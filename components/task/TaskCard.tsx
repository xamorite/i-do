"use client";

import React from 'react';
import { Task } from '@/lib/types';
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  AlertCircle,
  MoreVertical
} from 'lucide-react';
import { getCategoryStyles } from '@/lib/constants';

interface TaskCardProps {
  task: Task;
  onClick?: (task: Task) => void;
  onStatusToggle?: (task: Task) => void;
  currentUserId?: string;
  onAction?: (task: Task, action: string) => void;
  userProfiles?: Record<string, any>;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onClick,
  onStatusToggle,
  currentUserId,
  onAction,
  userProfiles
}) => {
  const isDone = task.status === 'done';
  const isAccountability = !!task.accountabilityPartnerId;
  const isAP = currentUserId === task.accountabilityPartnerId;
  const isOwner = currentUserId === task.ownerId || currentUserId === task.userId;

  // Check if task is overdue and has been reminded
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const hasBeenReminded = !!task.remindedAt;
  const isRemindedOverdue = isOverdue && hasBeenReminded && !isDone;

  // Determine whose profile to show (the other person)
  const otherUserId = isOwner ? task.accountabilityPartnerId : (isAP ? (task.ownerId || task.userId) : null);
  const otherProfile = otherUserId && userProfiles ? userProfiles[otherUserId] : null;

  const getStatusIcon = () => {
    if (task.status === 'pending_acceptance') return <AlertCircle className="text-yellow-500" size={18} />;
    if (task.status === 'awaiting_approval') return <Clock className="text-blue-500" size={18} />;
    if (task.status === 'rejected') return <AlertCircle className="text-red-500" size={18} />;
    if (isDone) return <CheckCircle2 className="text-green-500" size={18} />;
    return <Circle className="text-gray-400 group-hover:text-purple-500 transition-colors" size={18} />;
  };

  const integrationIcon = () => {
    if (!task.originalIntegration) return null;
    const icons: Record<string, React.ReactNode> = {
      'google-calendar': <div className="w-4 h-4 bg-[#4285F4] rounded-sm flex items-center justify-center text-white text-[8px] font-bold">31</div>,
      'slack': <div className="w-4 h-4 bg-[#4A154B] rounded-sm flex items-center justify-center text-white text-[8px] font-bold">#</div>,
      'notion': <div className="w-4 h-4 bg-black rounded-sm flex items-center justify-center text-white text-[8px] font-bold">N</div>,
    };
    return icons[task.originalIntegration] || null;
  };

  const categoryStyle = getCategoryStyles(task.channel || undefined);

  const handleMainAction = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Accountability Flows
    if (task.status === 'pending_acceptance') {
      onAction?.(task, 'accept');
      return;
    }

    if (task.status === 'awaiting_approval') {
      if (isAP) {
        onAction?.(task, 'approve');
      }
      return;
    }

    if (isAccountability && !isDone) {
      // If it's a normal task with accountability, main action is "Submit"
      onAction?.(task, 'submit');
      return;
    }

    // Default behavior
    onStatusToggle?.(task);
  };

  return (
    <div
      onClick={() => onClick?.(task)}
      className={`group bg-white dark:bg-neutral-900 border-l-4 border-y border-r rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col gap-2 ${isRemindedOverdue
        ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10 shadow-red-100 dark:shadow-red-900/5 ring-1 ring-red-500 ring-opacity-50 animate-pulse-subtle'
        : `${categoryStyle.borderColor} border-gray-200 dark:border-neutral-800`
        } ${isDone ? 'opacity-60 grayscale shadow-none' : ''}`}
    >
      {/* Visual pulse for reminded overdue tasks */}
      {isRemindedOverdue && (
        <style jsx>{`
          @keyframes pulse-subtle {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.85; }
          }
          .animate-pulse-subtle {
            animation: pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}</style>
      )}
      <div className="flex items-start gap-3 w-full">
        <button
          onClick={handleMainAction}
          className="mt-0.5 flex-shrink-0"
          title={
            task.status === 'pending_acceptance' ? 'Accept Task' :
              task.status === 'awaiting_approval' ? (isAP ? 'Approve' : 'Waiting for Approval') :
                isAccountability && !isDone ? 'Submit for Review' : 'Toggle Status'
          }
        >
          {getStatusIcon()}
        </button>

        <div className="flex-1 min-w-0 py-0.5">
          <div className="flex justify-between items-start gap-2">
            <h3 className={`text-sm font-semibold leading-snug transition-all ${isDone ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
              {task.title}
            </h3>
            {task.estimateMinutes && (
              <span className="text-[10px] font-black text-gray-400 tabular-nums">
                {Math.floor(task.estimateMinutes / 60)}:{(task.estimateMinutes % 60).toString().padStart(2, '0')}
              </span>
            )}
          </div>

          {/* Status Badge */}
          {task.status === 'pending_acceptance' && (
            <div className="mt-1 flex gap-2">
              <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">Pending Acceptance</span>
            </div>
          )}
          {task.status === 'awaiting_approval' && (
            <div className="mt-1 flex gap-2">
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">In Review</span>
            </div>
          )}

          {task.subtasks && task.subtasks.length > 0 && (
            <div className="mt-2 space-y-1">
              {task.subtasks.map(s => (
                <div key={s.id} className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                  <div className={`w-3 h-3 rounded-full border ${s.completed ? 'bg-green-500 border-green-500' : 'border-gray-200 dark:border-neutral-800'} flex items-center justify-center`}>
                    {s.completed && <CheckCircle2 size={10} className="text-white" />}
                  </div>
                  <span className={s.completed ? 'line-through opacity-50' : ''}>{s.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="flex items-center justify-between mt-1 pl-7">
        <div className="flex items-center gap-2">
          {integrationIcon()}
          {isAccountability && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded-md" title="Accountability Active">
              <span>🤝 Partnered</span>
            </div>
          )}
          {isRemindedOverdue && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded-md border border-red-200 dark:border-red-800" title="Reminder sent">
              <span>🔔 Reminded</span>
            </div>
          )}
          {otherProfile && (
            <div className="flex items-center -ml-1 h-5 w-5 rounded-full border-2 border-white dark:border-neutral-900 bg-gray-200 dark:bg-neutral-800 overflow-hidden" title={otherProfile.displayName}>
              {otherProfile.photoURL ? (
                <img src={otherProfile.photoURL} alt={otherProfile.displayName} className="h-full w-full object-cover shadow-sm" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[8px] font-bold text-gray-500">
                  {otherProfile.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}
        </div>

        {task.channel && (
          <div className={`flex items-center gap-1 text-[10px] font-bold ${categoryStyle.color} uppercase tracking-wider`}>
            <span>{categoryStyle.label}</span>
          </div>
        )}
      </div>

      {/* Explicit Action Buttons for specific states */}
      {task.status === 'pending_acceptance' && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={(e) => { e.stopPropagation(); onAction?.(task, 'accept'); }}
            className="flex-1 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg hover:bg-green-100"
          >
            Accept
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAction?.(task, 'reject'); }}
            className="flex-1 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-lg hover:bg-red-100"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(TaskCard);
