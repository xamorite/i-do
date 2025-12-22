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

interface TaskCardProps {
  task: Task;
  onClick?: (task: Task) => void;
  onStatusToggle?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onClick,
  onStatusToggle
}) => {
  const isDone = task.status === 'done';

  const getStatusIcon = () => {
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

  return (
    <div
      onClick={() => onClick?.(task)}
      className="group bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-purple-200 dark:hover:border-purple-900/50 transition-all cursor-pointer flex items-start gap-3"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onStatusToggle?.(task);
        }}
        className="mt-0.5 flex-shrink-0"
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

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {integrationIcon()}
          </div>

          {task.channel && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-purple-600 dark:text-purple-400">
              <span className="opacity-50">#</span>
              <span>{task.channel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
