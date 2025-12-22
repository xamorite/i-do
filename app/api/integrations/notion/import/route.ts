import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { getNotionPage } from '@/lib/services/notionService';

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
    const uid = await verifyToken(request);
    if (!uid) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { pageId, databaseId, plannedDate } = body;
    if (!pageId) return new Response(JSON.stringify({ ok: false, error: 'Missing pageId' }), { status: 400 });

    try {
        const page = await getNotionPage(uid, pageId);

        // Map Notion page to internal task structure (basic mapping)
        const props = page.properties || {};

        // Check integration config for mappings
        const q = await adminDb.collection('integrations').where('userId', '==', uid).where('service', '==', 'notion').limit(1).get();
        const mapping = q.empty ? null : (q.docs[0].data() as any).config?.mappings || null;

        const titlePropName = mapping?.title || Object.keys(props).find((k: any) => (props[k] as any)?.type === 'title');
        const datePropName = mapping?.date || Object.keys(props).find((k: any) => (props[k] as any)?.type === 'date');

        const titleProp = titlePropName ? props[titlePropName] : Object.values(props).find((p: any) => p.type === 'title');
        const title = titleProp?.title?.[0]?.plain_text || 'Untitled Notion Page';

        // Try to extract a date
        const dateProp = datePropName ? props[datePropName] : Object.values(props).find((p: any) => p.type === 'date');
        const dateValue = dateProp?.date?.start || plannedDate || null;

        const now = new Date().toISOString();
        const newTask: any = {
            userId: uid,
            title,
            notes: page.url,
            plannedDate: dateValue ? dateValue.split('T')[0] : null,
            startTime: dateValue && dateValue.includes('T') ? dateValue : null,
            isTimeboxed: false,
            originalIntegration: 'notion',
            external: { service: 'notion', pageId, databaseId },
            status: 'planned',
            createdAt: now,
            updatedAt: now,
        };

        const ref = await adminDb.collection('tasks').add(newTask as any);
        const doc = await ref.get();
        return new Response(JSON.stringify({ ok: true, task: { id: doc.id, ...(doc.data() as any) } }), { status: 201 });
    } catch (err: any) {
        console.error('Notion import error', err);
        return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), { status: 500 });
    }
}
