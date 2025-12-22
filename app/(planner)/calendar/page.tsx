import React from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CalendarView } from '@/components/calendar/CalendarView';

export default function CalendarPage() {
  return (
    <AuthGuard>
      <CalendarView />
    </AuthGuard>
  );
}
