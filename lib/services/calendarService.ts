import { adminDb } from '@/lib/firebaseAdmin';

interface GoogleTokenResponse {
  access_token: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  refresh_token?: string;
  id_token?: string;
}

async function getIntegration(userId: string) {
  const q = await adminDb.collection('integrations').where('userId', '==', userId).where('service', '==', 'google').limit(1).get();
  if (q.empty) return null;
  const doc = q.docs[0];
  return { id: doc.id, ref: doc.ref, data: doc.data() as any };
}

async function refreshAccessTokenIfNeeded(integrationDoc: any) {
  const tokens = integrationDoc?.data?.config?.tokens as any ?? integrationDoc?.config?.tokens;
  if (!tokens) throw new Error('No tokens found for integration');

  const now = Date.now();
  const expiresAt = tokens.expires_at ? Number(tokens.expires_at) : 0;
  if (tokens.access_token && expiresAt && now < expiresAt - 60000) {
    return tokens.access_token;
  }

  if (!tokens.refresh_token) throw new Error('No refresh token available');

  const params = new URLSearchParams();
  params.append('client_id', process.env.GOOGLE_CLIENT_ID || '');
  params.append('client_secret', process.env.GOOGLE_CLIENT_SECRET || '');
  params.append('refresh_token', tokens.refresh_token);
  params.append('grant_type', 'refresh_token');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error('Failed to refresh token: ' + txt);
  }
  const tokenResp = (await res.json()) as GoogleTokenResponse;

  const newExpiresAt = tokenResp.expires_in ? Date.now() + tokenResp.expires_in * 1000 : undefined;
  const updatedTokens = {
    ...tokens,
    access_token: tokenResp.access_token,
    expires_at: newExpiresAt,
    scope: tokenResp.scope || tokens.scope,
    token_type: tokenResp.token_type || tokens.token_type,
    refresh_token: tokenResp.refresh_token || tokens.refresh_token,
  };

  await integrationDoc.ref.update({ 'config.tokens': updatedTokens, updatedAt: new Date().toISOString() } as any);
  return updatedTokens.access_token;
}

export async function ensureAccessTokenForUser(userId: string) {
  const integration = await getIntegration(userId);
  if (!integration) throw new Error('No Google Calendar integration found');
  const tokens = integration.data?.config?.tokens;
  if (!tokens) throw new Error('No tokens stored');
  const access = await refreshAccessTokenIfNeeded(integration);
  return access;
}


export async function listEvents(userId: string, rangeStart: string, rangeEnd: string) {
  try {
    const integration = await getIntegration(userId);
    if (!integration) {
      console.log(`No Google Calendar integration found for user ${userId}, returning empty list`);
      return [];
    }

    const accessToken = await ensureAccessTokenForUser(userId).catch(err => {
      console.error('Error refreshing token:', err);
      // If token refresh fails, we might want to return empty or rethrow. 
      // For now, let's catch basic "No Google Calendar" errors gracefully if they propagate
      throw err;
    });

    const params = new URLSearchParams({ timeMin: rangeStart, timeMax: rangeEnd, singleEvents: 'true', orderBy: 'startTime' } as any);
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error('Failed to list events: ' + txt);
    }
    const data = await res.json();
    return data.items || [];
  } catch (error: any) {
    console.error('Error in listEvents:', error);
    // If it's just missing integration/tokens, return empty to avoid 500 UI crash
    if (error.message.includes('No Google Calendar integration') || error.message.includes('No tokens')) {
      return [];
    }
    throw error;
  }
}

export async function createEvent(userId: string, event: any) {
  const accessToken = await ensureAccessTokenForUser(userId);
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events`;
  const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(event) });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error('Failed to create event: ' + txt);
  }
  return res.json();
}
