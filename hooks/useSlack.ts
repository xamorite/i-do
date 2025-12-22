import { getIdTokenHeader } from '@/lib/getIdToken';

export async function fetchSlackMessages() {
    const headers = await getIdTokenHeader() as HeadersInit;
    const res = await fetch('/api/integrations/slack/messages', { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data.messages || [];
}
