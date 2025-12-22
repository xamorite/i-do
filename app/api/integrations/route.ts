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
  try {
    const uid = await verifyToken(request);
    if (!uid) {
      console.warn('API GET /api/integrations: Unauthorized access attempt');
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
    }

    // Simplification: Remove orderBy to avoid needing a composite index immediately.
    // We can sort on the client or add the index later.
    const q = adminDb.collection('integrations').where('userId', '==', uid).limit(50);
    const snap = await q.get();
    const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    // Sort by connectedAt desc
    items.sort((a: any, b: any) => (b.connectedAt || '').localeCompare(a.connectedAt || ''));
    return new Response(JSON.stringify({ ok: true, integrations: items }), { status: 200 });
  } catch (error: any) {
    console.error('API Error GET /api/integrations:', error);
    return new Response(JSON.stringify({ ok: false, error: 'Internal Server Error' }), { status: 500 });
  }
}

export async function POST(request: Request) {
  const uid = await verifyToken(request);
  if (!uid) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

  const body = await request.json().catch(() => ({}));
  const now = new Date().toISOString();
  const payload = { userId: uid, service: body.service || 'unknown', config: body.config || {}, connectedAt: now };
  const ref = await adminDb.collection('integrations').add(payload as any);
  const doc = await ref.get();
  return new Response(JSON.stringify({ ok: true, integration: { id: doc.id, ...(doc.data() as any) } }), { status: 201 });
}

export async function DELETE(request: Request) {
  try {
    const uid = await verifyToken(request);
    if (!uid) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing ID' }), { status: 400 });
    }

    const docRef = adminDb.collection('integrations').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return new Response(JSON.stringify({ ok: false, error: 'Not found' }), { status: 404 });
    }

    if (doc.data()?.userId !== uid) {
      return new Response(JSON.stringify({ ok: false, error: 'Forbidden' }), { status: 403 });
    }

    await docRef.delete();
    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error('API Error DELETE /api/integrations:', error);
    return new Response(JSON.stringify({ ok: false, error: 'Internal Server Error' }), { status: 500 });
  }
}
