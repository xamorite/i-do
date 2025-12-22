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

export async function POST(request: Request) {
    try {
        const uid = await verifyToken(request);
        if (!uid) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

        const body = await request.json().catch(() => ({}));
        const { credential, refreshToken } = body;

        // credential should contain the OAuth tokens (access_token, id_token, etc.)
        // passed from the client-side getRedirectResult
        if (!credential || !credential.accessToken) {
            return new Response(JSON.stringify({ ok: false, error: 'Missing credentials' }), { status: 400 });
        }

        // Check if integration already exists
        const q = await adminDb.collection('integrations')
            .where('userId', '==', uid)
            .where('service', '==', 'google')
            .limit(1)
            .get();

        if (!q.empty) {
            return new Response(JSON.stringify({ ok: true, message: 'Integration already exists' }), { status: 200 });
        }

        const now = new Date().toISOString();
        const payload = {
            userId: uid,
            service: 'google', // Consistent naming
            config: {
                tokens: {
                    access_token: credential.accessToken,
                    id_token: credential.idToken,
                    refresh_token: refreshToken || undefined, // Store captured refresh token
                    scope: 'https://www.googleapis.com/auth/calendar', // Default basic scope
                    token_type: 'Bearer',
                    expiry_date: Date.now() + 3600 * 1000, // Approx 1 hour
                },
            },
            scopes: 'https://www.googleapis.com/auth/calendar',
            connectedAt: now,
        };

        await adminDb.collection('integrations').add(payload);

        return new Response(JSON.stringify({ ok: true, message: 'Google Calendar auto-integrated' }), { status: 200 });
    } catch (error: any) {
        console.error('API Error /api/integrations/google/auto:', error);
        return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
    }
}
