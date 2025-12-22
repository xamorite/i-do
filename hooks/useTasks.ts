import { getIdTokenHeader } from '@/lib/getIdToken';

export async function fetchTasks(filter = '') {
  const headers = await getIdTokenHeader() as HeadersInit;
  const res = await fetch(`/api/tasks${filter ? `?${filter}` : ''}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function createTask(payload: any) {
  const tokenHeader = await getIdTokenHeader() as Record<string, string>;
  const res = await fetch('/api/tasks', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json', ...tokenHeader } });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}

export async function updateTask(id: string, updates: any) {
  const tokenHeader = await getIdTokenHeader() as Record<string, string>;
  const res = await fetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(updates), headers: { 'Content-Type': 'application/json', ...tokenHeader } });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

export async function deleteTask(id: string) {
  if (!id || id === 'undefined') {
    console.error(`[deleteTask] Invalid task ID: ${id}`);
    throw new Error('Invalid task ID');
  }
  const tokenHeader = await getIdTokenHeader() as Record<string, string>;
  const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE', headers: tokenHeader });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    console.error(`[deleteTask] Failed to delete task ${id}. Status: ${res.status}. Error:`, err.error);
    throw new Error('Failed to delete task');
  }
  return res.json();
}
