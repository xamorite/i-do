import { adminAuth, adminDb } from '../../../lib/firebaseAdmin';
import type { DayPlan } from '../../../lib/types';

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

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return new Response(JSON.stringify({ ok: false, error: 'Date is required' }), { status: 400 });
  }

  const q = adminDb.collection('dayplans')
    .where('userId', '==', uid)
    .where('date', '==', date)
    .limit(1);

  const snap = await q.get();
  if (snap.empty) {
    return new Response(JSON.stringify({ ok: true, dayPlan: null }), { status: 200 });
  }

  const doc = snap.docs[0];
  return new Response(JSON.stringify({ ok: true, dayPlan: { id: doc.id, ...doc.data() } }), { status: 200 });
}

export async function POST(request: Request) {
  const uid = await verifyToken(request);
  if (!uid) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (!body.date || !body.taskIds) {
    return new Response(JSON.stringify({ ok: false, error: 'Date and taskIds are required' }), { status: 400 });
  }

  // Check if dayplan already exists
  const existingQ = adminDb.collection('dayplans')
    .where('userId', '==', uid)
    .where('date', '==', body.date)
    .limit(1);
  const existingSnap = await existingQ.get();

  if (!existingSnap.empty) {
    const docId = existingSnap.docs[0].id;
    await adminDb.collection('dayplans').doc(docId).update({
      taskIds: body.taskIds,
      totalPlannedMinutes: body.totalPlannedMinutes || 0,
      updatedAt: new Date().toISOString()
    });
    return new Response(JSON.stringify({ ok: true, id: docId }), { status: 200 });
  }

  const newDayPlan = {
    userId: uid,
    date: body.date,
    taskIds: body.taskIds,
    totalPlannedMinutes: body.totalPlannedMinutes || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const ref = await adminDb.collection('dayplans').add(newDayPlan);
  return new Response(JSON.stringify({ ok: true, id: ref.id }), { status: 201 });
}
