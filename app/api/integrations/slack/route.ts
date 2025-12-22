import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

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

export async function GET(request: Request) {
    const uid = await verifyToken(request);
    if (!uid) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

    const clientId = process.env.SLACK_CLIENT_ID;
    const redirectUri = process.env.SLACK_REDIRECT_URI || 'http://localhost:3000/api/integrations/slack/callback';
    const state = Math.random().toString(36).slice(2) + Date.now().toString(36);

    await adminDb.collection('oauthStates').add({ state, userId: uid, createdAt: new Date().toISOString() });

    const params = new URLSearchParams({
        client_id: clientId || '',
        redirect_uri: redirectUri,
        scope: 'stars:read,channels:history,groups:history,im:history,mpim:history',
        state,
    });

    const url = `https://slack.com/oauth/v2/authorize?${params.toString()}`;
    return new Response(JSON.stringify({ ok: true, url }), { status: 200 });
}
