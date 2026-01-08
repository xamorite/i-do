import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            console.error('[User Sync] Missing or invalid Authorization header');
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        let decodedToken;

        try {
            decodedToken = await adminAuth.verifyIdToken(token);
        } catch (verifyError) {
            console.error('[User Sync] Token verification failed:', verifyError);
            return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
        }

        const uid = decodedToken.uid;
        const email = decodedToken.email || '';

        if (!uid) {
            console.error('[User Sync] No UID in decoded token');
            return new Response(JSON.stringify({ error: 'Invalid user ID' }), { status: 400 });
        }

        console.log(`[User Sync] Syncing user: ${uid}`);

        const userRef = adminDb.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            console.log(`[User Sync] User already exists: ${uid}`);
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

        console.log(`[User Sync] Creating new user with username: ${username}`);
        await userRef.set(userData);
        console.log(`[User Sync] User created successfully: ${uid}`);

        return new Response(JSON.stringify({ user: userData }), { status: 201 });
    } catch (error: any) {
        console.error('[User Sync] Unexpected error:', error);
        console.error('[User Sync] Error stack:', error.stack);
        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            message: error.message
        }), { status: 500 });
    }
}
