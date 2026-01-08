import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const uid = decodedToken.uid;

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query')?.toLowerCase() || '';

        if (query.length < 1) {
            return new Response(JSON.stringify({ results: [] }), { status: 200 });
        }

        // 1. Fetch Active Partners
        // We need to check both requesterId and recipientId
        const p1 = adminDb.collection('partners')
            .where('requesterId', '==', uid)
            .where('status', '==', 'active')
            .get();

        const p2 = adminDb.collection('partners')
            .where('recipientId', '==', uid)
            .where('status', '==', 'active')
            .get();

        const [snap1, snap2] = await Promise.all([p1, p2]);

        const partnerIds = new Set<string>();
        snap1.docs.forEach(d => partnerIds.add(d.data().recipientId));
        snap2.docs.forEach(d => partnerIds.add(d.data().requesterId));

        if (partnerIds.size === 0) {
            return new Response(JSON.stringify({ results: [] }), { status: 200 });
        }

        // 2. Fetch User Profiles for these partners
        // Optimization: limit to 10 for autocomplete if list is huge? 
        // For now, fetch all active partners' profiles.
        const refs = Array.from(partnerIds).map(id => adminDb.collection('users').doc(id));
        const userDocs = await adminDb.getAll(...refs);

        // 3. Filter by username query
        const results = userDocs
            .map(d => d.exists ? d.data() as any : null)
            .filter(u => u && u.username && u.username.toLowerCase().startsWith(query))
            .map(u => ({
                userId: u.userId,
                username: u.username,
                displayName: u.displayName,
                photoURL: u.photoURL
            }));

        return new Response(JSON.stringify({ results }), { status: 200 });

    } catch (error: any) {
        console.error('Autocomplete error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
