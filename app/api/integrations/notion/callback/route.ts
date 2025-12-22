import { adminDb } from '@/lib/firebaseAdmin';
import { encryptText } from '@/lib/kms';

async function exchangeCodeForTokens(code: string, redirectUri: string) {
    const clientId = process.env.NOTION_CLIENT_ID || '';
    const clientSecret = process.env.NOTION_CLIENT_SECRET || '';

    // Notion uses Basic Auth for the token exchange
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const res = await fetch('https://api.notion.com/v1/oauth/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
        }),
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
    const redirectUri = process.env.NOTION_REDIRECT_URI || 'http://localhost:3000/api/integrations/notion/callback';

    if (!code || !state) {
        return new Response('Missing code or state', { status: 400 });
    }

    // Find state mapping in Firestore
    const q = await adminDb.collection('oauthStates').where('state', '==', state).limit(1).get();
    if (q.empty) {
        return new Response('Invalid or expired state', { status: 400 });
    }

    const stateDoc = q.docs[0];
    const stateData = stateDoc.data() as any;
    const userId = stateData.userId as string;

    try {
        const tokenResponse = await exchangeCodeForTokens(code, redirectUri);

        // Store integration in Firestore
        const now = new Date().toISOString();
        // Encrypt token payload at rest
        const encryptedTokens = await encryptText(JSON.stringify(tokenResponse));

        const payload = {
          userId,
          service: 'notion',
          config: {
            tokens: encryptedTokens,
            workspace_id: tokenResponse.workspace_id,
            workspace_name: tokenResponse.workspace_name,
            workspace_icon: tokenResponse.workspace_icon,
            bot_id: tokenResponse.bot_id,
          },
          connectedAt: now,
          updatedAt: now,
        };

        await adminDb.collection('integrations').add(payload as any);

        // Remove the state mapping
        await stateDoc.ref.delete();

        // Show a success message to the user
        const html = `
      <!doctype html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9f9f9; }
            .card { background: white; padding: 2rem; border-radius: 1rem; shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
            h1 { color: #333; font-weight: 800; }
            p { color: #666; margin-bottom: 2rem; }
            .close-btn { background: #333; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Notion Connected!</h1>
            <p>Your Notion workspace has been successfully connected to your planner.</p>
            <p>You can close this window now.</p>
          </div>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `;
        return new Response(html, { status: 200, headers: { 'content-type': 'text/html' } });
    } catch (err: any) {
        console.error('Notion OAuth Error:', err);
        return new Response(`Error completing OAuth: ${err.message || err}`, { status: 500 });
    }
}
