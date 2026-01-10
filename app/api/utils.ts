import { adminDb } from '@/lib/firebaseAdmin';

export async function createNotification(notification: {
    recipientId: string;
    senderId: string;
    type: 'task_assigned' | 'task_accepted' | 'task_rejected' | 'task_submitted' | 'task_approved' | 'task_changes_requested' | 'task_reminder';
    taskId: string;
    taskTitle: string;
    message?: string;
}) {
    if (!notification.recipientId || notification.recipientId === notification.senderId) {
        return; // Don't notify self or if no recipient
    }

    try {
        await adminDb.collection('notifications').add({
            ...notification,
            read: false,
            createdAt: new Date().toISOString()
        });
        console.log(`Notification sent to ${notification.recipientId}: ${notification.type}`);
    } catch (error) {
        console.error('Failed to create notification', error);
    }
}
