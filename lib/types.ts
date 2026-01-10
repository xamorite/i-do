import { User as FirebaseUser } from 'firebase/auth';

export type UserRole = 'user' | 'admin';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  username?: string; // Unique username for @mentions
  photoURL?: string;
  role: UserRole;
  createdAt?: Date;
}

export interface AuthContextType {
  user: FirebaseUser | null;
  userRole: UserRole | null;
  username: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, username: string) => Promise<void>;
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
  // Accountability fields
  userId?: string; // Database field for owner (for backward compatibility / indexing)
  ownerId?: string | null; // The user responsible for doing the work
  createdBy?: string; // The user who created the task
  accountabilityPartnerId?: string | null; // The user who verifies completion
  rejectionReason?: string;
  remindedAt?: string | null; // Timestamp when last reminded by AP
  lastRemindedBy?: string | null; // User ID who sent the last reminder

  status:
  | 'inbox'
  | 'backlog'
  | 'draft'              // Draft task, not yet active
  | 'planned'
  | 'done'
  | 'pending_acceptance' // Delegated task waiting for owner acceptance
  | 'awaiting_approval'  // Owner believes it's done, waiting for AP
  | 'rejected'           // Owner rejected delegation
  | 'blocked';           // General blocked state

  priority?: 'low' | 'medium' | 'high' | 'critical' | null;
  tags?: string[];
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: 'image' | 'file' | 'link';
  }[];

  isTimeboxed?: boolean;
  startTime?: string | null;
  endTime?: string | null;
  originalIntegration?: string | null;
  channel?: string | null; // Category/channel for task organization
  subtasks?: Subtask[]; // Subtasks for breaking down work
  timeLogs?: TimeLog[]; // Time tracking logs
  isRecurring?: boolean;
  recurrencePattern?: string | null; // cron-like pattern or simple "daily", "weekly", etc.
  createdAt?: string;
  updatedAt?: string;
  sharedWith?: SharedUser[];
}

export type PartnerStatus = 'pending' | 'active' | 'declined' | 'blocked';

export interface PartnerRelationship {
  id: string;
  requesterId: string;
  recipientId: string;
  status: PartnerStatus;
  createdAt: string;
  updatedAt: string;
}

export type ShareRole = 'viewer' | 'commenter' | 'accountability_partner';

export interface SharedUser {
  userId: string;
  role: ShareRole;
  addedAt: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  type:
  | 'task_assigned'
  | 'task_accepted'
  | 'task_rejected'
  | 'task_submitted'
  | 'task_approved'
  | 'task_changes_requested'
  | 'task_reminder'
  | 'task_updated'
  | 'task_ap_assigned'
  | 'task_ap_accepted'
  | 'partner_request'
  | 'partner_accepted'
  | 'partner_declined'
  | 'task_comment'
  | 'task_delegated'
  | 'task_delegation_accepted'
  | 'task_delegation_rejected'
  | 'task_ap_rejected'
  | 'task_ap_removed'
  | 'partner_removed'
  | 'partner_blocked'
  | 'system_message';
  taskId: string;
  taskTitle: string;
  message?: string; // Optional custom message (used for reminders)
  read: boolean;
  createdAt: string;
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





