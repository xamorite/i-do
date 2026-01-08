import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { Notification } from '@/lib/types';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    try {
        const snapshot = await adminDb
            .collection('notifications')
            .where('recipientId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const notifications: Notification[] = [];
        snapshot.forEach((doc) => {
            notifications.push({ id: doc.id, ...doc.data() } as Notification);
        });

        return NextResponse.json({ notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing notification ID' }, { status: 400 });
    }

    try {
        const body = await request.json();
        await adminDb.collection('notifications').doc(id).update(body);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating notification:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    // Intead of calling this endpoint internally, we usually use the adminDb directly from other routes.
    // But this can be used for client testing or specialized triggers.
    try {
        const body = await request.json();
        const notification: Omit<Notification, 'id'> = {
            ...body,
            createdAt: new Date().toISOString(),
            read: false
        };

        const ref = await adminDb.collection('notifications').add(notification);
        return NextResponse.json({ id: ref.id, ...notification });
    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
