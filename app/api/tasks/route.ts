import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import type { Task } from '@/lib/types';

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
  const plannedDate = searchParams.get('plannedDate');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  let q = adminDb.collection('tasks').where('userId', '==', uid);

  if (plannedDate) {
    q = q.where('plannedDate', '==', plannedDate);
  } else if (startDate && endDate) {
    q = q.where('plannedDate', '>=', startDate).where('plannedDate', '<=', endDate);
  } else {
    q = q.orderBy('createdAt', 'desc').limit(100);
  }

  try {
    const snap = await q.get();
    const tasks: Task[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    return new Response(JSON.stringify({ ok: true, tasks }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('[GET /api/tasks] Firestore error:', err.message);
    return new Response(JSON.stringify({ ok: false, error: 'Failed to fetch tasks' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(request: Request) {
  try {
    const uid = await verifyToken(request);
    if (!uid) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let body;
    try {
      body = await request.json();
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate required fields
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      return new Response(JSON.stringify({ ok: false, error: 'Task title is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();
    const newTask: Partial<Task> = {
      ...body,
      userId: uid as any,
      status: body.status || 'inbox',
      createdAt: now,
      updatedAt: now,
    } as Partial<Task>;

    const ref = await adminDb.collection('tasks').add(newTask as any);
    const doc = await ref.get();
    return new Response(JSON.stringify({ ok: true, task: { id: doc.id, ...(doc.data() as any) } }), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('[POST /api/tasks] Error:', err.message);
    return new Response(JSON.stringify({ ok: false, error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
