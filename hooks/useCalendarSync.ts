import { getIdTokenHeader } from '@/lib/getIdToken';
import { Task } from '@/lib/types';

export async function fetchCalendarEvents(rangeStart: string, rangeEnd: string) {
  const headers = await getIdTokenHeader() as HeadersInit;
  const res = await fetch(`/api/calendar/events?start=${encodeURIComponent(rangeStart)}&end=${encodeURIComponent(rangeEnd)}`, { headers });
  if (!res.ok) return [];
  const data = await res.json();

  // Transform Google Calendar events into a standard Task-like structure for the UI
  return (data.items || []).map((event: any) => ({
    id: event.id,
    title: event.summary,
    notes: event.description || '',
    plannedDate: event.start?.date || event.start?.dateTime?.split('T')[0],
    isTimeboxed: true,
    originalIntegration: 'google',
    status: 'planned' as const,
    startTime: event.start?.dateTime,
    endTime: event.end?.dateTime,
  }));
}
