import { adminAuth } from '@/lib/firebaseAdmin';
import { listNotionDatabases } from '@/lib/services/notionService';

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
    const start = url.searchParams.get('start') || undefined;
    const pageSize = Number(url.searchParams.get('page_size') || '20');
    const query = url.searchParams.get('query') || undefined;

    try {
        const res = await listNotionDatabases(uid, start, pageSize, query);
        return new Response(JSON.stringify({ ok: true, databases: res.results, next_cursor: res.next_cursor, has_more: res.has_more }), { status: 200 });
    } catch (err: any) {
        console.error('Notion DB list error', err);
        return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), { status: 500 });
    }
}
