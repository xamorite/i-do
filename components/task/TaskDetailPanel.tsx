"use client";

import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Clock,
  Calendar,
  AlignLeft,
  Tag,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { Task, SharedUser } from '@/lib/types';
import { UserAutocomplete } from '@/components/partners/UserAutocomplete';
import { getIdTokenHeader } from '@/lib/getIdToken';

interface TaskDetailPanelProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>, dateStr?: string) => void;
  onDelete: (id: string, dateStr?: string) => void;
}

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [estimate, setEstimate] = useState<number | ''>('');
  const [shares, setShares] = useState<SharedUser[]>([]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes || '');
      setEstimate(task.estimateMinutes || '');
      fetchShares();
    }
  }, [task]);

  const fetchShares = async () => {
    if (!task) return;
    try {
      const headers = await getIdTokenHeader() as HeadersInit;
      const res = await fetch(`/api/tasks/${task.id}/share`, { headers });
      const data = await res.json();
      if (data.shares) setShares(data.shares);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async (user: any) => {
    if (!task) return;
    try {
      const headers = await getIdTokenHeader() as HeadersInit;
      const res = await fetch(`/api/tasks/${task.id}/share`, {
        method: 'POST',
        headers: { ...headers as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerUserId: user.userId })
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to share');
        return;
      }
      fetchShares();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnshare = async (userId: string) => {
    if (!task) return;
    if (!confirm('Remove access?')) return;
    try {
      const headers = await getIdTokenHeader() as HeadersInit;
      await fetch(`/api/tasks/${task.id}/share?partnerUserId=${userId}`, {
        method: 'DELETE',
        headers
      });
      fetchShares();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen || !task) return null;

  const handleUpdate = (updates: Partial<Task>) => {
    onUpdate(task!.id, updates, task!.plannedDate || '');
  };

  const isDone = task.status === 'done';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md transform transition-transform duration-300 ease-in-out bg-white dark:bg-neutral-900 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleUpdate({ status: isDone ? 'planned' : 'done' })}
                className="hover:scale-110 transition-transform"
              >
                {isDone ? (
                  <CheckCircle2 className="text-green-500" size={20} />
                ) : (
                  <Circle className="text-gray-400" size={20} />
                )}
              </button>
              <h2 className="font-semibold text-gray-900 dark:text-white">Task Details</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this task?')) {
                    onDelete(task.id, task.plannedDate || '');
                    onClose();
                  }
                }}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
            {/* Title */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => handleUpdate({ title })}
                className="w-full text-xl font-bold bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder:text-gray-300 p-0"
                placeholder="Task title"
              />
            </div>

            {/* Meta Items */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                <Calendar size={18} className="flex-shrink-0" />
                <div className="flex-1">
                  <span className="block text-[11px] font-medium uppercase mb-0.5">Planned Date</span>
                  <input
                    type="date"
                    value={task.plannedDate || ''}
                    onChange={(e) => handleUpdate({ plannedDate: e.target.value })}
                    className="bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-gray-100 dark:[color-scheme:dark] w-full"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                <Clock size={18} className="flex-shrink-0" />
                <div className="flex-1">
                  <span className="block text-[11px] font-medium uppercase mb-0.5">Time Estimate</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={estimate}
                      onChange={(e) => setEstimate(e.target.value ? parseInt(e.target.value) : '')}
                      onBlur={() => handleUpdate({ estimateMinutes: estimate === '' ? null : estimate })}
                      className="bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-gray-100 w-16"
                      placeholder="--"
                    />
                    <span>minutes</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Accountability Section */}
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Accountability</h3>

              <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                <div className="w-[18px] flex justify-center"><Tag size={16} /></div>
                <div className="flex-1">
                  <span className="block text-[11px] font-medium uppercase mb-0.5">Partner ID</span>
                  <input
                    type="text"
                    value={task.accountabilityPartnerId || ''}
                    onChange={(e) => handleUpdate({ accountabilityPartnerId: e.target.value })}
                    className="bg-transparent border-b border-gray-200 dark:border-neutral-800 focus:border-purple-500 focus:ring-0 p-0 text-gray-900 dark:text-gray-100 w-full text-xs py-1"
                    placeholder="Paste user ID"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                <div className="w-[18px] flex justify-center"><Tag size={16} /></div>
                <div className="flex-1">
                  <span className="block text-[11px] font-medium uppercase mb-0.5">Owner ID</span>
                  <input
                    type="text"
                    value={task.ownerId || task.userId || ''}
                    onChange={(e) => {
                      // If changing owner, we might want to trigger the delegation flow status
                      const newOwnerId = e.target.value;
                      handleUpdate({
                        ownerId: newOwnerId,
                        userId: newOwnerId,
                        status: newOwnerId !== task.createdBy ? 'pending_acceptance' : 'planned'
                      });
                    }}
                    className="bg-transparent border-b border-gray-200 dark:border-neutral-800 focus:border-purple-500 focus:ring-0 p-0 text-gray-900 dark:text-gray-100 w-full text-xs py-1"
                    placeholder="Paste user ID"
                  />
                </div>
              </div>

              {/* Shared With */}
              <div className="flex items-start gap-4 text-gray-500 dark:text-gray-400">
                <div className="w-[18px] flex justify-center mt-1"><Tag size={16} /></div>
                <div className="flex-1">
                  <span className="block text-[11px] font-medium uppercase mb-0.5">Shared With</span>

                  {/* List current shares */}
                  {shares.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {shares.map((u, i) => (
                        <div key={i} className="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full text-xs">
                          <span className="max-w-[100px] truncate">{u.userId}</span>
                          <span className="opacity-50 text-[10px]">({u.role})</span>
                          <button onClick={() => handleUnshare(u.userId)}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <UserAutocomplete
                    onSelect={handleShare}
                    placeholder="Type @username to share..."
                  />
                </div>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-neutral-800" />

            {/* Notes */}
            <div className="flex gap-4">
              <AlignLeft size={18} className="text-gray-400 mt-1 flex-shrink-0" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => handleUpdate({ notes })}
                className="w-full h-48 bg-transparent border-none focus:ring-0 text-gray-700 dark:text-gray-300 placeholder:text-gray-400 p-0 resize-none leading-relaxed"
                placeholder="Add notes, checklists, or context..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-neutral-800 text-center">
            <div className="text-[10px] text-gray-400">
              {task.updatedAt ? `Last updated ${new Date(task.updatedAt).toLocaleString()}` : 'New task'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
