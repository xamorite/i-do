import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

// Force dynamic rendering
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

/**
 * POST /api/tasks/[id]/remind
 * Sends a reminder notification from accountability partner to task owner
 * Only accessible by the accountability partner when task is overdue
 */
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const uid = await verifyToken(request);
        if (!uid) {
            return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const taskId = params.id;
        const taskRef = adminDb.collection('tasks').doc(taskId);
        const taskDoc = await taskRef.get();

        if (!taskDoc.exists) {
            return new Response(JSON.stringify({ ok: false, error: 'Task not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const task = { id: taskDoc.id, ...taskDoc.data() } as any;

        // Verify user is the accountability partner
        if (task.accountabilityPartnerId !== uid) {
            return new Response(JSON.stringify({
                ok: false,
                error: 'Only the accountability partner can send reminders'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if task has a due date
        if (!task.dueDate) {
            return new Response(JSON.stringify({
                ok: false,
                error: 'Task must have a due date to send reminders'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if task is overdue
        const dueDate = new Date(task.dueDate);
        const now = new Date();
        if (now < dueDate) {
            return new Response(JSON.stringify({
                ok: false,
                error: 'Task is not yet overdue'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check throttling: Only allow 1 reminder per 24 hours
        if (task.remindedAt) {
            const lastReminder = new Date(task.remindedAt);
            const hoursSinceLastReminder = (now.getTime() - lastReminder.getTime()) / (1000 * 60 * 60);

            if (hoursSinceLastReminder < 24) {
                const hoursRemaining = Math.ceil(24 - hoursSinceLastReminder);
                return new Response(JSON.stringify({
                    ok: false,
                    error: `Please wait ${hoursRemaining} more hour${hoursRemaining > 1 ? 's' : ''} before sending another reminder`
                }), {
                    status: 429, // Too Many Requests
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Check if task is already done
        if (task.status === 'done') {
            return new Response(JSON.stringify({
                ok: false,
                error: 'Task is already completed'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Parse request body for optional message
        let messageBody: { message?: string } = {};
        try {
            const body = await request.json();
            messageBody = body;
        } catch {
            // Body is optional, ignore parsing errors
        }

        // Validate message if provided (max 200 chars)
        const customMessage = messageBody.message?.trim();
        if (customMessage && customMessage.length > 200) {
            return new Response(JSON.stringify({
                ok: false,
                error: 'Message must be 200 characters or less'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Update task with reminder timestamp
        const reminderTimestamp = new Date().toISOString();
        await taskRef.update({
            remindedAt: reminderTimestamp,
            lastRemindedBy: uid,
            updatedAt: reminderTimestamp,
        });

        // Create notification for task owner
        const { createNotification } = await import('../../../utils');
        await createNotification({
            recipientId: task.ownerId || task.userId,
            senderId: uid,
            type: 'task_reminder',
            taskId: task.id,
            taskTitle: task.title,
            message: customMessage, // Include custom message
        });

        return new Response(JSON.stringify({
            ok: true,
            message: 'Reminder sent successfully',
            remindedAt: reminderTimestamp
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error('[POST /api/tasks/[id]/remind] Error:', err.message);
        return new Response(JSON.stringify({
            ok: false,
            error: 'Internal server error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
