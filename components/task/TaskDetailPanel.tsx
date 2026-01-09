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
  Circle,
  User,
  Flag,
  Repeat,
  CalendarCheck,
  AlertTriangle
} from 'lucide-react';
import { Task, SharedUser, PartnerRelationship } from '@/lib/types';
import { UserAutocomplete } from '@/components/partners/UserAutocomplete';
import { getIdTokenHeader } from '@/lib/getIdToken';

interface TaskDetailPanelProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>, dateStr?: string) => void;
  onDelete: (id: string, dateStr?: string) => void;
  partners?: PartnerRelationship[];
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

  // New Fields State
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dueDate, setDueDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [recurrence, setRecurrence] = useState('');
  const [channel, setChannel] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes || '');
      setEstimate(task.estimateMinutes || '');
      setPriority(task.priority || 'medium');
      setDueDate(task.dueDate || '');
      setStartTime(task.startTime || '');
      setEndTime(task.endTime || '');
      setRecurrence(task.recurrencePattern || '');
      setChannel(task.channel || '');
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
              {/* Priority */}
              <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                <Flag size={18} className="flex-shrink-0" />
                <div className="flex-1">
                  <span className="block text-[11px] font-medium uppercase mb-0.5">Priority</span>
                  <select
                    value={priority}
                    onChange={(e) => {
                      const p = e.target.value as any;
                      setPriority(p);
                      handleUpdate({ priority: p });
                    }}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-gray-900 dark:text-gray-100 uppercase"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Planned Date & Time */}
              <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                <Calendar size={18} className="flex-shrink-0" />
                <div className="flex-1">
                  <span className="block text-[11px] font-medium uppercase mb-0.5">Planned Schedule</span>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={task.plannedDate || ''}
                      onChange={(e) => handleUpdate({ plannedDate: e.target.value })}
                      className="bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-gray-100 flex-1 min-w-[120px]"
                    />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value);
                        handleUpdate({ startTime: e.target.value });
                      }}
                      className="bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-gray-100 w-24"
                    />
                    <span className="self-center">-</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => {
                        setEndTime(e.target.value);
                        handleUpdate({ endTime: e.target.value });
                      }}
                      className="bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-gray-100 w-24"
                    />
                  </div>
                </div>
              </div>

              {/* Due Date */}
              <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                <CalendarCheck size={18} className="flex-shrink-0" />
                <div className="flex-1">
                  <span className="block text-[11px] font-medium uppercase mb-0.5">Due Date</span>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      handleUpdate({ dueDate: e.target.value });
                    }}
                    className="bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-gray-100 w-full"
                  />
                </div>
              </div>

              {/* Recurrence */}
              <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                <Repeat size={18} className="flex-shrink-0" />
                <div className="flex-1">
                  <span className="block text-[11px] font-medium uppercase mb-0.5">Recurrence</span>
                  <select
                    value={recurrence}
                    onChange={(e) => {
                      setRecurrence(e.target.value);
                      handleUpdate({
                        isRecurring: !!e.target.value,
                        recurrencePattern: e.target.value
                      });
                    }}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-gray-900 dark:text-gray-100"
                  >
                    <option value="">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              {/* Estimate */}
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

              {/* Category */}
              <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                <Tag size={18} className="flex-shrink-0" />
                <div className="flex-1">
                  <span className="block text-[11px] font-medium uppercase mb-0.5">Category</span>
                  <select
                    value={channel}
                    onChange={(e) => {
                      setChannel(e.target.value);
                      handleUpdate({ channel: e.target.value });
                    }}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-gray-900 dark:text-gray-100"
                  >
                    <option value="">No Category</option>
                    <option value="work">Work</option>
                    <option value="personal">Personal</option>
                    <option value="health">Health</option>
                    <option value="errands">Errands</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Accountability Section */}
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Accountability</h3>

              <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                <div className="w-[18px] flex justify-center"><Tag size={16} /></div>
                <div className="flex-1">
                  <span className="block text-[11px] font-medium uppercase mb-0.5">Accountability Partner</span>
                  {task.accountabilityPartnerId ? (
                    <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-2 py-1.5 rounded-lg border border-purple-100 dark:border-purple-800">
                      <div className="w-5 h-5 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center text-[10px] font-bold text-purple-700 dark:text-purple-300">
                        <User size={12} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate flex-1">
                        {task.accountabilityPartnerId}
                      </span>
                      <button
                        onClick={() => handleUpdate({ accountabilityPartnerId: undefined })}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <UserAutocomplete
                      onSelect={(user) => handleUpdate({ accountabilityPartnerId: user.userId })}
                      placeholder="Assign a partner..."
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                <div className="w-[18px] flex justify-center"><Tag size={16} /></div>
                <div className="flex-1">
                  <span className="block text-[11px] font-medium uppercase mb-0.5">Owner / Delegate</span>
                  {(task.ownerId && task.ownerId !== task.userId) || (task.ownerId && task.userId && task.ownerId !== task.userId) ? (
                    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-2 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800">
                      <div className="w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-300">
                        <User size={12} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate flex-1">
                        {/* TODO: Resolve Name */}
                        {task.ownerId}
                      </span>
                      <button
                        onClick={() => {
                          // Revert to creator (userId)
                          const creatorId = task.createdBy || task.userId;
                          handleUpdate({
                            ownerId: creatorId,
                            status: 'planned'
                          });
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Reclaim Task"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    // If owner is self, show "Me" but allow clicking to delegate
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 flex-1 bg-gray-50 dark:bg-neutral-800 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Me (Owner)</span>
                      </div>
                      <div className="w-[200px]">
                        <UserAutocomplete
                          onSelect={(user) => {
                            handleUpdate({
                              ownerId: user.userId,
                              status: 'pending_acceptance'
                            });
                          }}
                          placeholder="Delegate to..."
                        />
                      </div>
                    </div>
                  )}
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
    </div >
  );
};
