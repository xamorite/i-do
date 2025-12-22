import { fetchSlackStarredMessages } from '@/lib/services/slackService';
import { adminAuth } from '@/lib/firebaseAdmin';

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

    try {
        const messages = await fetchSlackStarredMessages(uid);
        return new Response(JSON.stringify({ ok: true, messages }), { status: 200 });
    } catch (err: any) {
        return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), { status: 500 });
    }
}
