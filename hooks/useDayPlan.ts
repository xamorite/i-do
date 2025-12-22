import { getIdTokenHeader } from '@/lib/getIdToken';

export async function fetchDayPlan(date: string) {
  const headers = await getIdTokenHeader() as HeadersInit;
  const res = await fetch(`/api/dayplans?date=${encodeURIComponent(date)}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch dayplan');
  return res.json();
}

export async function upsertDayPlan(date: string, payload: any) {
  const tokenHeader = await getIdTokenHeader() as Record<string, string>;
  const res = await fetch('/api/dayplans', { method: 'POST', body: JSON.stringify({ date, ...payload }), headers: { 'Content-Type': 'application/json', ...tokenHeader } });
  if (!res.ok) throw new Error('Failed to upsert dayplan');
  return res.json();
}
