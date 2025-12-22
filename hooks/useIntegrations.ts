import { getIdTokenHeader } from '@/lib/getIdToken';

export async function listIntegrations() {
  const headers = await getIdTokenHeader() as HeadersInit;
  const res = await fetch('/api/integrations', { headers });
  if (!res.ok) throw new Error('Failed to list integrations');
  return res.json();
}

export async function startGoogleAuth() {
  const headers = await getIdTokenHeader() as HeadersInit;
  const res = await fetch('/api/integrations/google', { headers });
  if (!res.ok) throw new Error('Failed to start Google OAuth');
  return res.json();
}

export async function startNotionAuth() {
  const headers = await getIdTokenHeader() as HeadersInit;
  const res = await fetch('/api/integrations/notion', { headers });
  if (!res.ok) throw new Error('Failed to start Notion OAuth');
  return res.json();
}

export async function startSlackAuth() {
  const headers = await getIdTokenHeader() as HeadersInit;
  const res = await fetch('/api/integrations/slack', { headers });
  if (!res.ok) throw new Error('Failed to start Slack OAuth');
  return res.json();
}

export async function deleteIntegration(id: string) {
  const headers = await getIdTokenHeader() as HeadersInit;
  const res = await fetch(`/api/integrations?id=${id}`, {
    method: 'DELETE',
    headers
  });
  if (!res.ok) throw new Error('Failed to delete integration');
  return true;
}
