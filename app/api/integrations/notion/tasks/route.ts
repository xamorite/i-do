import { fetchNotionTasks } from '@/lib/services/notionService';
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

    const url = new URL(request.url);
    const start = url.searchParams.get('start') || new Date().toISOString();
    const end = url.searchParams.get('end') || new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

    try {
        const tasks = await fetchNotionTasks(uid, start, end);
        return new Response(JSON.stringify({ ok: true, tasks }), { status: 200 });
    } catch (err: any) {
        return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), { status: 500 });
    }
}
