import { adminDb } from '@/lib/firebaseAdmin';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function exchangeCodeForTokens(code: string, redirectUri: string) {
    const clientId = process.env.SLACK_CLIENT_ID || '';
    const clientSecret = process.env.SLACK_CLIENT_SECRET || '';

    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('redirect_uri', redirectUri);

    const res = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
    });

    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Token exchange failed: ${txt}`);
    }

    const data = await res.json();
    if (!data.ok) {
        throw new Error(`Slack OAuth error: ${data.error}`);
    }
    return data;
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const redirectUri = process.env.SLACK_REDIRECT_URI || 'http://localhost:3000/api/integrations/slack/callback';

    if (!code || !state) {
        return new Response('Missing code or state', { status: 400 });
    }

    const q = await adminDb.collection('oauthStates').where('state', '==', state).limit(1).get();
    if (q.empty) {
        return new Response('Invalid or expired state', { status: 400 });
    }

    const stateDoc = q.docs[0];
    const stateData = stateDoc.data() as any;
    const userId = stateData.userId as string;

    try {
        const tokenResponse = await exchangeCodeForTokens(code, redirectUri);

        const now = new Date().toISOString();
        const payload = {
            userId,
            service: 'slack',
            config: {
                tokens: tokenResponse,
                team_id: tokenResponse.team?.id,
                team_name: tokenResponse.team?.name,
                bot_user_id: tokenResponse.bot_user_id,
            },
            connectedAt: now,
            updatedAt: now,
        };

        await adminDb.collection('integrations').add(payload as any);
        await stateDoc.ref.delete();

        const html = `
      <!doctype html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9f9f9; }
            .card { background: white; padding: 2rem; border-radius: 1rem; shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
            h1 { color: #333; font-weight: 800; }
            p { color: #666; margin-bottom: 2rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Slack Connected!</h1>
            <p>Your Slack workspace is now connected. You can close this window.</p>
          </div>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `;
        return new Response(html, { status: 200, headers: { 'content-type': 'text/html' } });
    } catch (err: any) {
        console.error('Slack OAuth Error:', err);
        return new Response(`Error completing OAuth: ${err.message || err}`, { status: 500 });
    }
}
