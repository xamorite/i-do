import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { PartnerRelationship } from '@/lib/types';

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

export async function GET(request: Request) {
    const uid = await verifyToken(request);
    if (!uid) return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    try {
        // Fetch where user is requester OR recipient
        const [reqSnap, recSnap] = await Promise.all([
            adminDb.collection('partners').where('requesterId', '==', uid).get(),
            adminDb.collection('partners').where('recipientId', '==', uid).get()
        ]);

        const partners: PartnerRelationship[] = [];
        reqSnap.forEach(doc => partners.push({ id: doc.id, ...doc.data() } as PartnerRelationship));
        recSnap.forEach(doc => partners.push({ id: doc.id, ...doc.data() } as PartnerRelationship));

        return NextResponse.json({ partners });
    } catch (err) {
        console.error('Failed to fetch partners', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const uid = await verifyToken(request);
    if (!uid) return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    try {
        const body = await request.json();
        const { recipientEmail, recipientId, recipientUsername } = body;

        let targetUserId = recipientId;

        // If username provided, find user by username
        if (!targetUserId && recipientUsername) {
            const cleanUsername = recipientUsername.toLowerCase().trim();
            const q = await adminDb.collection('users').where('username', '==', cleanUsername).limit(1).get();
            if (!q.empty) {
                targetUserId = q.docs[0].id;
            }
        }

        // Fallback: If email provided, find user by email
        if (!targetUserId && recipientEmail) {
            try {
                const userRecord = await adminAuth.getUserByEmail(recipientEmail);
                targetUserId = userRecord.uid;
            } catch (e) {
                // User not found by email
            }
        }

        if (!targetUserId) {
            return NextResponse.json({ error: 'User not found. Check availability of username or email.' }, { status: 404 });
        }

        if (targetUserId === uid) {
            return NextResponse.json({ error: 'Cannot partner with self' }, { status: 400 });
        }

        // Check for existing relationship
        const existing = await adminDb.collection('partners')
            .where('requesterId', 'in', [uid, targetUserId])
            .where('recipientId', 'in', [uid, targetUserId])
            .get();

        // Manual filter because Firestore composite 'in' queries are tricky
        let exists = false;
        existing.forEach(doc => {
            const d = doc.data();
            if ((d.requesterId === uid && d.recipientId === targetUserId) ||
                (d.requesterId === targetUserId && d.recipientId === uid)) {
                exists = true;
            }
        });

        if (exists) {
            return NextResponse.json({ error: 'Relationship already exists' }, { status: 409 });
        }

        const newRel: Omit<PartnerRelationship, 'id'> = {
            requesterId: uid,
            recipientId: targetUserId,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const ref = await adminDb.collection('partners').add(newRel);

        // Notify recipient
        await adminDb.collection('notifications').add({
            recipientId: targetUserId,
            type: 'partner_request',
            senderId: uid,
            message: 'sent you a partnership request',
            read: false,
            createdAt: new Date().toISOString(),
            PartnerRequestId: ref.id
        });

        return NextResponse.json({ id: ref.id, ...newRel });

    } catch (err) {
        console.error('Failed to create partner request', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const uid = await verifyToken(request);
    if (!uid) return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    try {
        const body = await request.json();
        const { id, status } = body; // id of relationship

        if (!['active', 'declined', 'blocked'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const ref = adminDb.collection('partners').doc(id);
        const doc = await ref.get();

        if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const data = doc.data() as PartnerRelationship;

        // Only the recipient can 'active' or 'decline' a pending request
        // Either can 'block'
        // If status is active, either can 'block'

        if (status === 'active' || status === 'declined') {
            if (data.recipientId !== uid) {
                return NextResponse.json({ error: 'Only recipient can Accept/Decline' }, { status: 403 });
            }
        }

        // If blocking, prevent loop? Logic simplistic for now.

        const updatePromise = ref.update({
            status,
            updatedAt: new Date().toISOString()
        });

        // Notifications
        if (status === 'active' || status === 'declined') {
            const notifData = {
                recipientId: data.requesterId, // Notify the person who ASKED
                type: status === 'active' ? 'partner_accepted' : 'partner_declined',
                senderId: uid,
                message: status === 'active' ? 'accepted your partnership request' : 'declined your partnership request',
                read: false,
                createdAt: new Date().toISOString(),
                PartnerRequestId: id
            };
            await Promise.all([updatePromise, adminDb.collection('notifications').add(notifData)]);
        } else {
            await updatePromise;
        }

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error('Failed to update partner', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
