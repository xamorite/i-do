import { ensureAccessTokenForUser } from './calendarService';

export interface GoogleTask {
    id: string;
    title: string;
    notes?: string;
    due?: string;
    status: 'needsAction' | 'completed';
}

export async function listGoogleTasks(userId: string): Promise<GoogleTask[]> {
    try {
        const accessToken = await ensureAccessTokenForUser(userId);

        // 1. Get Task Lists
        const listsRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!listsRes.ok) {
            console.error('Failed to fetch task lists', await listsRes.text());
            return [];
        }

        const listsData = await listsRes.json();
        const defaultList = listsData.items?.[0];

        if (!defaultList) return [];

        // 2. Get Tasks from default list
        const tasksRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${defaultList.id}/tasks?showCompleted=false&dueMax=${new Date(new Date().setDate(new Date().getDate() + 7)).toISOString()}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!tasksRes.ok) {
            console.error('Failed to fetch tasks', await tasksRes.text());
            return [];
        }

        const tasksData = await tasksRes.json();

        return (tasksData.items || []).map((t: any) => ({
            id: t.id,
            title: t.title,
            notes: t.notes,
            due: t.due,
            status: t.status,
        }));

    } catch (err) {
        console.error('Error listing Google Tasks:', err);
        return [];
    }
}
