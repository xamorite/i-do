import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import type { Task } from '@/lib/types';
import { updateNotionPageStatus } from '@/lib/services/notionService';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function verifyToken(request: Request) {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) return null;
    try {
        const decoded = await adminAuth.verifyIdToken(token);
        return decoded.uid as string;
    } catch (err) {
        return null;
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const uid = await verifyToken(request);
    if (!uid) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

    const { id } = await params;
    const taskRef = adminDb.collection('tasks').doc(id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
        return new Response(JSON.stringify({ ok: false, error: 'Task not found' }), { status: 404 });
    }

    const taskData = taskDoc.data();
    // Allow if owner, creator, or AP
    const allowed = taskData?.userId === uid || taskData?.ownerId === uid || taskData?.createdBy === uid || taskData?.accountabilityPartnerId === uid;

    if (!allowed) {
        return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 403 });
    }

    return new Response(JSON.stringify({ ok: true, task: { id: taskDoc.id, ...taskData } }), { status: 200 });
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const uid = await verifyToken(request);
    if (!uid) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const now = new Date().toISOString();

    const taskRef = adminDb.collection('tasks').doc(id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
        return new Response(JSON.stringify({ ok: false, error: 'Task not found' }), { status: 404 });
    }

    const taskData = taskDoc.data();
    if (!taskData) {
        return new Response(JSON.stringify({ ok: false, error: 'Task data missing' }), { status: 500 });
    }

    // Permission Check: Owner or Accountability Partner or Shared (Commenter/AP)
    const isOwner = taskData.userId === uid || taskData.ownerId === uid;
    const isAP = taskData.accountabilityPartnerId === uid;
    const isCreator = taskData.createdBy === uid;
    const sharedUser = taskData.sharedWith?.find((u: any) => u.userId === uid);
    const hasEditAccess = isOwner || isAP || isCreator || (sharedUser && ['commenter', 'accountability_partner'].includes(sharedUser.role));

    if (!hasEditAccess) {
        // Allow if just updating status (e.g. strict AP check is below)
        // Actually, let's keep it strict. 
        return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 403 });
    }

    // Accountability Rules logic
    if (body.status) {
        const newStatus = body.status;
        const currentStatus = taskData.status;

        // 1. Completing a task
        if (newStatus === 'done') {
            const isActingAP = isAP || (sharedUser && sharedUser.role === 'accountability_partner');
            if (taskData.accountabilityPartnerId && !isActingAP) {
                return new Response(JSON.stringify({
                    ok: false,
                    error: 'Only the Accountability Partner can mark this task as complete.'
                }), { status: 403 });
            }
        }

        // 2. Submitting for approval
        if (newStatus === 'awaiting_approval') {
            if (!isOwner) {
                return new Response(JSON.stringify({ ok: false, error: 'Only the Owner can submit for approval.' }), { status: 403 });
            }
        }

        // 3. Acceptance/Rejection of delegation
        if (currentStatus === 'pending_acceptance') {
            if (!isOwner) {
                return new Response(JSON.stringify({ ok: false, error: 'Only the Owner can accept or reject this task.' }), { status: 403 });
            }
        }
    }

    // Recalculate visibleTo if relevant fields change
    let visibleTo = taskData.visibleTo || [taskData.userId, taskData.ownerId, taskData.createdBy, taskData.accountabilityPartnerId];
    if (body.ownerId || body.accountabilityPartnerId || body.sharedWith) {
        const owners = new Set<string>([
            body.ownerId || taskData.ownerId,
            taskData.createdBy
        ]);
        const apId = body.accountabilityPartnerId !== undefined ? body.accountabilityPartnerId : taskData.accountabilityPartnerId;
        if (apId) owners.add(apId);

        const shared = body.sharedWith || taskData.sharedWith || [];
        shared.forEach((u: any) => owners.add(u.userId));

        visibleTo = Array.from(owners).filter(Boolean);
    }

    const updates = {
        ...body,
        updatedAt: now,
        visibleTo
    };

    await taskRef.update(updates);

    // Notifications
    if (body.status && body.status !== taskData.status) {
        const { createNotification } = await import('../../utils');
        const currentStatus = taskData.status;
        const newStatus = body.status;

        // 1. Task Accepted
        if (currentStatus === 'pending_acceptance' && newStatus === 'planned') {
            await createNotification({
                recipientId: taskData.createdBy,
                senderId: uid,
                type: 'task_accepted',
                taskId: id,
                taskTitle: taskData.title
            });
        }
        // 2. Task Rejected
        else if (currentStatus === 'pending_acceptance' && newStatus === 'rejected') {
            await createNotification({
                recipientId: taskData.createdBy,
                senderId: uid,
                type: 'task_rejected',
                taskId: id,
                taskTitle: taskData.title
            });
        }
        // 3. Submitted for Approval
        else if (newStatus === 'awaiting_approval' && taskData.accountabilityPartnerId) {
            await createNotification({
                recipientId: taskData.accountabilityPartnerId,
                senderId: uid,
                type: 'task_submitted',
                taskId: id,
                taskTitle: taskData.title
            });
        }
        // 4. Approved
        else if (currentStatus === 'awaiting_approval' && newStatus === 'done') {
            await createNotification({
                recipientId: taskData.ownerId,
                senderId: uid,
                type: 'task_approved',
                taskId: id,
                taskTitle: taskData.title
            });
        }
        // 5. Changes Requested (AP rejects submission)
        else if (currentStatus === 'awaiting_approval' && (newStatus === 'planned' || newStatus === 'rejected')) {
            await createNotification({
                recipientId: taskData.ownerId,
                senderId: uid,
                type: 'task_changes_requested',
                taskId: id,
                taskTitle: taskData.title
            });
        }
    }

    // If this task is from Notion and was marked done, try to update the Notion page
    try {
        if (updates.status && updates.status === 'done') {
            const taskData = taskDoc.data();
            const external = taskData?.external;
            if (external?.service === 'notion' && external?.pageId) {
                try {
                    await updateNotionPageStatus(uid, external.pageId, 'Done');
                } catch (err) {
                    console.error('Failed to update Notion page status:', err);
                }
            }
        }
    } catch (err) {
        console.error('Error during Notion sync post-task-update', err);
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const uid = await verifyToken(request);
        if (!uid) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

        const { id } = await params;
        if (!id || id === 'undefined') {
            return new Response(JSON.stringify({ ok: false, error: 'Invalid Task ID' }), { status: 400 });
        }
        console.log(`[API DELETE] Attempting to delete task: ${id} for user: ${uid}`);

        const taskRef = adminDb.collection('tasks').doc(id);
        const taskDoc = await taskRef.get();

        if (!taskDoc.exists) {
            console.warn(`[API DELETE] Task not found: ${id}`);
            return new Response(JSON.stringify({ ok: false, error: 'Task not found' }), { status: 404 });
        }

        const taskData = taskDoc.data();
        if (taskData?.userId !== uid) {
            console.warn(`[API DELETE] Permission denied. Task ${id} owned by ${taskData?.userId}, but requested by ${uid}`);
            return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 403 });
        }

        await taskRef.delete();
        console.log(`[API DELETE] Successfully deleted task: ${id}`);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    } catch (error: any) {
        console.error(`[API DELETE] Error deleting task:`, error);
        return new Response(JSON.stringify({ ok: false, error: 'Internal Server Error' }), { status: 500 });
    }
}
