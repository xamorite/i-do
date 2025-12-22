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
  // Create OAuth URL and store state tied to user
  const uid = await verifyToken(request);
  if (!uid) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/integrations/google/callback';
  const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar');
  const state = Math.random().toString(36).slice(2) + Date.now().toString(36);

  // store state mapping
  await adminDb.collection('oauthStates').add({ state, userId: uid, createdAt: new Date().toISOString() });

  const params = new URLSearchParams({
    client_id: clientId || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/tasks.readonly',
    state,
  });
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return new Response(JSON.stringify({ ok: true, url }), { status: 200 });
}
