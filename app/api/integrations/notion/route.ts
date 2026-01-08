import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

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

export async function GET(request: Request) {
    // Create OAuth URL and store state tied to user
    const uid = await verifyToken(request);
    if (!uid) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

    const clientId = process.env.NOTION_CLIENT_ID;
    const redirectUri = process.env.NOTION_REDIRECT_URI || 'http://localhost:3000/api/integrations/notion/callback';
    const state = Math.random().toString(36).slice(2) + Date.now().toString(36);

    // Store state mapping in Firestore
    await adminDb.collection('oauthStates').add({ state, userId: uid, createdAt: new Date().toISOString() });

    const params = new URLSearchParams({
        client_id: clientId || '',
        redirect_uri: redirectUri,
        response_type: 'code',
        owner: 'user',
        state,
    });

    const url = `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
    return new Response(JSON.stringify({ ok: true, url }), { status: 200 });
}
