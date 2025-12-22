import { adminAuth } from '@/lib/firebaseAdmin';
import { listPagesInDatabase } from '@/lib/services/notionService';

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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const uid = await verifyToken(request);
    if (!uid) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
    const { id } = await params;
    const url = new URL(request.url);
    const start = url.searchParams.get('start') || undefined;
    const pageSize = Number(url.searchParams.get('page_size') || '50');

    try {
        const res = await listPagesInDatabase(uid, id, pageSize, start);
        return new Response(JSON.stringify({ ok: true, pages: res.results, next_cursor: res.next_cursor, has_more: res.has_more }), { status: 200 });
    } catch (err: any) {
        console.error('Notion pages list error', err);
        return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), { status: 500 });
    }
}
