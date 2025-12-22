import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import type { Task } from '@/lib/types';
import { updateNotionPageStatus } from '@/lib/services/notionService';

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

    if (taskDoc.data()?.userId !== uid) {
        return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 403 });
    }

    const updates = {
        ...body,
        updatedAt: now,
    };

    await taskRef.update(updates);

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
