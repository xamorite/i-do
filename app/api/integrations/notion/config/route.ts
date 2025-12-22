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

export async function PATCH(request: Request) {
    const uid = await verifyToken(request);
    if (!uid) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { selectedDatabaseId, mappings } = body;

    try {
        const q = await adminDb.collection('integrations').where('userId', '==', uid).where('service', '==', 'notion').limit(1).get();
        if (q.empty) return new Response(JSON.stringify({ ok: false, error: 'Integration not found' }), { status: 404 });

        const doc = q.docs[0];
        const data = doc.data() as any;
        const config = data.config || {};
        if (selectedDatabaseId) config.selectedDatabaseId = selectedDatabaseId;
        if (mappings) config.mappings = mappings;

        await doc.ref.update({ config, updatedAt: new Date().toISOString() });

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    } catch (err: any) {
        console.error('Failed to save Notion config', err);
        return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), { status: 500 });
    }
}
