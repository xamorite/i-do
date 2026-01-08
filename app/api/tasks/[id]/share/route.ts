import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

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

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const uid = await verifyToken(request);
    if (!uid) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

    const { id } = await params;
    const taskRef = adminDb.collection('tasks').doc(id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) return new Response(JSON.stringify({ ok: false, error: 'Task not found' }), { status: 404 });

    // Check access
    const data = taskDoc.data();
    const isOwnerOrAP = data?.userId === uid || data?.ownerId === uid || data?.accountabilityPartnerId === uid || data?.createdBy === uid;

    if (!isOwnerOrAP) {
        // Check if I am in the shared list?
        const myShare = await taskRef.collection('sharedWith').doc(uid).get();
        if (!myShare.exists) {
            return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 403 });
        }
    }

    const snapshot = await taskRef.collection('sharedWith').get();
    const shares = snapshot.docs.map(d => d.data());

    return new Response(JSON.stringify({ ok: true, shares }), { status: 200 });
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const uid = await verifyToken(request);
    if (!uid) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { partnerUserId } = body;

    if (!partnerUserId) {
        return new Response(JSON.stringify({ ok: false, error: 'Partner User ID required' }), { status: 400 });
    }

    // 1. Verify Task Ownership
    const taskRef = adminDb.collection('tasks').doc(id);
    const taskDoc = await taskRef.get();
    if (!taskDoc.exists) return new Response(JSON.stringify({ ok: false, error: 'Task not found' }), { status: 404 });

    if (taskDoc.data()?.userId !== uid && taskDoc.data()?.ownerId !== uid) {
        return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 403 });
    }

    // 2. Verify Partner Relationship (Active)
    // Check if there is an ACTIVE relationship between uid and partnerUserId
    const p1 = await adminDb.collection('partners')
        .where('requesterId', '==', uid)
        .where('recipientId', '==', partnerUserId)
        .where('status', '==', 'active')
        .get();

    const p2 = await adminDb.collection('partners')
        .where('requesterId', '==', partnerUserId)
        .where('recipientId', '==', uid)
        .where('status', '==', 'active')
        .get();

    if (p1.empty && p2.empty) {
        return new Response(JSON.stringify({ ok: false, error: 'You can only share tasks with active partners.' }), { status: 403 });
    }

    // 3. Add to Subcollection
    const shareRef = taskRef.collection('sharedWith').doc(partnerUserId);
    const shareDoc = await shareRef.get();

    if (shareDoc.exists) {
        return new Response(JSON.stringify({ ok: true, message: 'Already shared' }), { status: 200 });
    }

    await shareRef.set({
        userId: partnerUserId,
        role: 'viewer', // MVP default
        sharedByUserId: uid,
        sharedAt: new Date().toISOString()
    });

    return new Response(JSON.stringify({ ok: true }), { status: 201 });
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const uid = await verifyToken(request);
    if (!uid) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

    const url = new URL(request.url);
    // Extract partnerUserId from query or body? Typically DELETE should be /api/tasks/[id]/share/[partnerUserId] but Next.js file structure makes that nested.
    // I'll assume passing partnerUserId in body for simplicity or query param. 
    // Wait, the file is `route.ts` at `[id]/share`, so I can't do another segment easily without folder.
    // I'll look for `partnerUserId` in Query Params.
    const partnerUserId = url.searchParams.get('partnerUserId');

    if (!partnerUserId) return new Response(JSON.stringify({ ok: false, error: 'Partner User ID required' }), { status: 400 });

    const { id } = await params;
    const taskRef = adminDb.collection('tasks').doc(id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) return new Response(JSON.stringify({ ok: false, error: 'Task not found' }), { status: 404 });
    if (taskDoc.data()?.userId !== uid && taskDoc.data()?.ownerId !== uid) {
        return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 403 });
    }

    await taskRef.collection('sharedWith').doc(partnerUserId).delete();

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
