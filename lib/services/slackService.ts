import { adminDb } from '@/lib/firebaseAdmin';

export async function getSlackIntegration(userId: string) {
    const q = await adminDb.collection('integrations')
        .where('userId', '==', userId)
        .where('service', '==', 'slack')
        .limit(1)
        .get();

    if (q.empty) return null;
    const doc = q.docs[0];
    return { id: doc.id, ref: doc.ref, data: doc.data() as any };
}

export async function ensureSlackToken(userId: string) {
    const integration = await getSlackIntegration(userId);
    if (!integration) throw new Error('Slack integration not found');

    const tokens = integration.data?.config?.tokens;
    if (!tokens?.authed_user?.access_token && !tokens?.access_token) throw new Error('No Slack access token found');

    return tokens.authed_user?.access_token || tokens.access_token;
}

export async function fetchSlackStarredMessages(userId: string) {
    try {
        const accessToken = await ensureSlackToken(userId);

        // Slack 'stars.list' returns starred items across all channels
        const res = await fetch('https://slack.com/api/stars.list', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!res.ok) {
            console.error('Failed to fetch Slack stars', await res.text());
            return [];
        }

        const data = await res.json();
        if (!data.ok) {
            console.error('Slack API error (stars.list):', data.error);
            return [];
        }

        // Map starred messages to a standard candidate format
        return (data.items || []).filter((item: any) => item.type === 'message').map((item: any) => {
            const msg = item.message;
            return {
                id: `slack-${msg.ts}`,
                title: msg.text || 'Empty Slack Message',
                notes: `From ${item.channel || 'unknown channel'}`,
                originalIntegration: 'slack',
                externalUrl: `https://slack.com/archives/${item.channel}/p${msg.ts.replace('.', '')}`,
                createdAt: new Date(parseFloat(msg.ts) * 1000).toISOString(),
            };
        });
    } catch (err) {
        console.error('Error fetching Slack stars:', err);
        return [];
    }
}
