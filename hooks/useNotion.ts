import { getIdTokenHeader } from '@/lib/getIdToken';

export async function fetchNotionTasks(rangeStart?: string, rangeEnd?: string) {
    const headers = await getIdTokenHeader() as HeadersInit;
    const params = new URLSearchParams();
    if (rangeStart) params.append('start', rangeStart);
    if (rangeEnd) params.append('end', rangeEnd);

    const res = await fetch(`/api/integrations/notion/tasks${params.toString() ? `?${params.toString()}` : ''}`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data.tasks || [];
}

export async function fetchNotionDatabases() {
    const headers = await getIdTokenHeader() as HeadersInit;
    const res = await fetch('/api/integrations/notion/databases', { headers });
    if (!res.ok) return { databases: [], nextCursor: null, hasMore: false };
    const data = await res.json();
    return { databases: data.databases || [], nextCursor: data.next_cursor || null, hasMore: !!data.has_more };
}

export async function fetchNotionPages(databaseId: string) {
    const headers = await getIdTokenHeader() as HeadersInit;
    const res = await fetch(`/api/integrations/notion/databases/${databaseId}/pages`, { headers });
    if (!res.ok) return { pages: [], nextCursor: null, hasMore: false };
    const data = await res.json();
    return { pages: data.pages || [], nextCursor: data.next_cursor || null, hasMore: !!data.has_more };
}

export async function importNotionPage(pageId: string, databaseId?: string, plannedDate?: string) {
    const authHeaders = await getIdTokenHeader();
    const headers = { ...authHeaders, 'content-type': 'application/json' };
    const res = await fetch('/api/integrations/notion/import', { method: 'POST', headers, body: JSON.stringify({ pageId, databaseId, plannedDate }) });
    if (!res.ok) return null;
    const data = await res.json();
    return data.task || null;
}

export async function saveNotionConfig(selectedDatabaseId: string, mappings: any) {
    const authHeaders = await getIdTokenHeader();
    const headers = { ...authHeaders, 'content-type': 'application/json' };
    const res = await fetch('/api/integrations/notion/config', { method: 'PATCH', headers, body: JSON.stringify({ selectedDatabaseId, mappings }) });
    if (!res.ok) throw new Error('Failed to save config');
    return await res.json();
}
