import { adminAuth } from '@/lib/firebaseAdmin';
import { listEvents, createEvent } from '@/lib/services/calendarService';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
  try {
    const uid = await verifyToken(request);
    if (!uid) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const start = url.searchParams.get('start') || new Date().toISOString();
    const end = url.searchParams.get('end') || new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

    try {
      const items = await listEvents(uid, start, end);
      return new Response(JSON.stringify({ ok: true, items }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err: any) {
      console.error('[GET /api/calendar/events] Error:', err);
      return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error: any) {
    console.error('[GET /api/calendar/events] Unexpected error:', error);
    return new Response(JSON.stringify({ ok: false, error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(request: Request) {
  try {
    const uid = await verifyToken(request);
    if (!uid) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let body;
    try {
      body = await request.json();
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const created = await createEvent(uid, body);
      return new Response(JSON.stringify({ ok: true, event: created }), { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err: any) {
      console.error('[POST /api/calendar/events] Error:', err);
      return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error: any) {
    console.error('[POST /api/calendar/events] Unexpected error:', error);
    return new Response(JSON.stringify({ ok: false, error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
