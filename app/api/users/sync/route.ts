import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const uid = decodedToken.uid;
        const email = decodedToken.email || '';

        const userRef = adminDb.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            return new Response(JSON.stringify({ user: userDoc.data() }), { status: 200 });
        }

        // Create user with username
        let username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 5) {
            const q = await adminDb.collection('users').where('username', '==', username).get();
            if (q.empty) {
                isUnique = true;
            } else {
                username = `${username}${Math.floor(Math.random() * 1000)}`;
                attempts++;
            }
        }

        if (!isUnique) {
            // Fallback to random if super unlucky
            username = `user${Math.floor(Math.random() * 1000000)}`;
        }

        const userData = {
            userId: uid,
            email,
            displayName: decodedToken.name || email.split('@')[0],
            photoURL: decodedToken.picture || '',
            username,
            createdAt: new Date().toISOString()
        };

        await userRef.set(userData);

        return new Response(JSON.stringify({ user: userData }), { status: 201 });
    } catch (error: any) {
        console.error('User sync error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
