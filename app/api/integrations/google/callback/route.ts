import { adminDb } from '@/lib/firebaseAdmin';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials are not configured');
  }

  const params = new URLSearchParams();
  params.append('code', code);
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('redirect_uri', redirectUri);
  params.append('grant_type', 'authorization_code');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Token exchange failed: ${txt}`);
  }
  return res.json();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/integrations/google/callback';

  if (!code || !state) {
    return new Response('Missing code or state', { status: 400 });
  }

  // find state mapping
  const q = await adminDb.collection('oauthStates').where('state', '==', state).limit(1).get();
  if (q.empty) {
    return new Response('Invalid or expired state', { status: 400 });
  }
  const stateDoc = q.docs[0];
  const data = stateDoc.data() as any;
  const userId = data.userId as string;

  try {
    const tokenResponse = await exchangeCodeForTokens(code, redirectUri);
    // store in integrations collection
    const now = new Date().toISOString();
    const payload = {
      userId,
      service: 'google',
      config: {
        tokens: tokenResponse,
      },
      scopes: tokenResponse.scope || 'https://www.googleapis.com/auth/calendar',
      connectedAt: now,
    };
    await adminDb.collection('integrations').add(payload as any);

    // remove state
    await stateDoc.ref.delete();

    // Show a success page
    // Show a success page that closes itself
    const html = `
      <!doctype html>
      <html>
        <head>
          <title>Connected</title>
          <style>body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fafafa; color: #333; }</style>
        </head>
        <body>
          <div style="text-align: center">
            <h1>Google Calendar connected!</h1>
            <p>Redirecting you back...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'google-auth-success' }, '*');
              setTimeout(() => window.close(), 100);
            } else {
              window.location.href = '/dashboard';
            }
          </script>
        </body>
      </html>
    `;
    return new Response(html, { status: 200, headers: { 'content-type': 'text/html' } });
  } catch (err: any) {
    console.error('[Google OAuth Callback] Error:', err);
    const errorMessage = err.message || 'An error occurred during OAuth';
    const errorHtml = `
      <!doctype html>
      <html>
        <head>
          <title>Connection Error</title>
          <style>body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fafafa; color: #333; }</style>
        </head>
        <body>
          <div style="text-align: center">
            <h1 style="color: #dc2626;">Connection Failed</h1>
            <p>${errorMessage}</p>
            <button onclick="window.close()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #333; color: white; border: none; border-radius: 0.25rem; cursor: pointer;">Close</button>
          </div>
        </body>
      </html>
    `;
    return new Response(errorHtml, { status: 500, headers: { 'content-type': 'text/html' } });
  }
}
