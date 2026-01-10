import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import type { Task } from '@/lib/types';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

  // Helper to apply filters
  const applyFilters = (query: FirebaseFirestore.Query) => {
    if (plannedDate) {
      return query.where('plannedDate', '==', plannedDate);
    } else if (startDate && endDate) {
      return query.where('plannedDate', '>=', startDate).where('plannedDate', '<=', endDate);
    } else {
      return query.orderBy('createdAt', 'desc').limit(100);
    }
  };

  try {
    // 1. Tasks where I am owner
    const q1 = applyFilters(adminDb.collection('tasks').where('userId', '==', uid));

    // 2. Tasks where I am accountability partner
    const q2 = applyFilters(adminDb.collection('tasks').where('accountabilityPartnerId', '==', uid));

    // Execute Core queries
    const [snap1, snap2] = await Promise.all([q1.get(), q2.get()]);

    const tasksMap = new Map<string, Task>();

    // Add Owned & Partnered
    [snap1, snap2].forEach(snap => {
      snap.docs.forEach(doc => {
        tasksMap.set(doc.id, { id: doc.id, ...(doc.data() as any) });
      });
    });

    // 3. Tasks shared with me (via Subcollection)
    // Query 'sharedWith' subcollection across all tasks
    // NOTE: This requires a Firestore index. If index doesn't exist, skip for now.
    try {
      const q3 = adminDb.collectionGroup('sharedWith').where('userId', '==', uid);
      const snapShared = await q3.get();

      // Handle Shared Tasks
      // Since we only get the sharedWith doc, we must fetch the parent Task.
      if (!snapShared.empty) {
        const parentRefs = snapShared.docs.map(d => d.ref.parent?.parent).filter(r => r !== null) as FirebaseFirestore.DocumentReference[];

        // Optimize: Deduplicate refs
        const uniqueRefPaths = new Set<string>();
        const uniqueRefs: FirebaseFirestore.DocumentReference[] = [];
        parentRefs.forEach(ref => {
          if (!uniqueRefPaths.has(ref.path)) {
            uniqueRefPaths.add(ref.path);
            uniqueRefs.push(ref);
          }
        });

        if (uniqueRefs.length > 0) {
          const parentDocs = await adminDb.getAll(...uniqueRefs);
          parentDocs.forEach(d => {
            if (d.exists && !tasksMap.has(d.id)) {
              const data = d.data() as any;
              let match = true;
              if (plannedDate) {
                if (data.plannedDate !== plannedDate) match = false;
              } else if (startDate && endDate) {
                if (data.plannedDate < startDate || data.plannedDate > endDate) match = false;
              }

              if (match) {
                tasksMap.set(d.id, { id: d.id, ...data });
              }
            }
          });
        }
      }
    } catch (collectionGroupError: any) {
      // Collection group query failed (likely missing index)
      // Continue without shared tasks for now
      console.warn('[GET /api/tasks] Collection group query failed (index may be needed):', collectionGroupError.message);
    }

    const tasks = Array.from(tasksMap.values());

    // Client-side sort
    if (!plannedDate && !startDate) {
      tasks.sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });
    }

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

    // Validate with Zod schema
    const { validateSchema, taskSchema } = await import('@/lib/validation');
    const validation = validateSchema(taskSchema, body);

    if (!validation.success) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'Validation failed',
        details: validation.error
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Use validated data
    const validatedBody = validation.data;

    const now = new Date().toISOString();

    const ownerId = validatedBody.ownerId || uid;
    const isDelegated = ownerId !== uid;

    // Calculate visibleTo
    const visibleTo = new Set<string>([uid, ownerId]);
    if (validatedBody.accountabilityPartnerId) visibleTo.add(validatedBody.accountabilityPartnerId);
    if (validatedBody.sharedWith) {
      validatedBody.sharedWith.forEach((u: any) => visibleTo.add(u.userId));
    }

    // Determine initial status based on accountability rules
    let status = validatedBody.status || 'inbox';
    if (isDelegated) {
      status = 'pending_acceptance';
    }

    const newTask: Partial<Task> & { visibleTo: string[] } = {
      ...validatedBody,
      userId: ownerId, // The person who has to do the task
      ownerId: ownerId,
      createdBy: uid,
      accountabilityPartnerId: validatedBody.accountabilityPartnerId || null,
      status: status,
      createdAt: now,
      updatedAt: now,
      visibleTo: Array.from(visibleTo)
    };

    const ref = await adminDb.collection('tasks').add(newTask as any);
    const doc = await ref.get();

    // Trigger notification if delegated
    if (isDelegated) {
      const { createNotification } = await import('../utils');
      await createNotification({
        recipientId: ownerId,
        senderId: uid,
        type: 'task_assigned',
        taskId: doc.id,
        taskTitle: validatedBody.title
      });
    }

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
