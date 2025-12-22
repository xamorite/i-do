import { User as FirebaseUser } from 'firebase/auth';

export type UserRole = 'user' | 'admin';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  createdAt?: Date;
}

export interface AuthContextType {
  user: FirebaseUser | null;
  userRole: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Legacy types - kept for backwards compatibility during migration
export type Activity = {
  time: string;
  desc: string;
  type: string;
  deadline?: string;
  reminder?: string;
  duration?: string;
};

export type DaySchedule = {
  date: string;
  day: string;
  activities: Activity[];
};

// Enhanced Sunsama-style types
export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt?: string;
}

export interface TimeLog {
  id: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  type: 'manual' | 'timer';
  createdAt: string;
}

export interface Task {
  id: string;
  projectId?: string | null;
  title: string;
  notes?: string;
  dueDate?: string | null;
  plannedDate?: string | null;
  estimateMinutes?: number | null;
  actualMinutes?: number | null;
  status: 'inbox' | 'backlog' | 'planned' | 'done';
  isTimeboxed?: boolean;
  startTime?: string | null;
  endTime?: string | null;
  originalIntegration?: string | null;
  channel?: string; // Category/channel for task organization
  subtasks?: Subtask[]; // Subtasks for breaking down work
  timeLogs?: TimeLog[]; // Time tracking logs
  isRecurring?: boolean;
  recurrencePattern?: string; // cron-like pattern or simple "daily", "weekly", etc.
  createdAt?: string;
  updatedAt?: string;
}

// Planner-specific types
export interface Project {
  id: string;
  name: string;
  color?: string;
  archived?: boolean;
}

export interface DayPlan {
  id: string;
  userId: string;
  date: string; // ISO date
  tasksOrdered: string[]; // array of Task.id
  totalPlannedMinutes?: number;
  ritualsCompleted?: {
    planning?: boolean;
    shutdown?: boolean;
  };
}

export interface TimeBlock {
  id: string;
  taskId?: string | null;
  userId: string;
  start: string;
  end: string;
  source?: 'manual' | 'autoschedule' | 'calendar';
}

export interface Integration {
  id: string;
  userId: string;
  service: string;
  scopes?: string[];
  connectedAt?: string;
  config?: Record<string, any>;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  start: string;
  end: string;
  source?: string;
  linkedTaskId?: string | null;
}


