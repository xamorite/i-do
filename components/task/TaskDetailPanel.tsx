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
  AlertTriangle,
  Bell,
  UserCircle
} from 'lucide-react';
import { Task, SharedUser, PartnerRelationship } from '@/lib/types';
import { UserAutocomplete } from '@/components/partners/UserAutocomplete';
import { getIdTokenHeader } from '@/lib/getIdToken';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useDialog } from '@/contexts/DialogContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getCategoryStyles } from '@/lib/constants';

interface TaskDetailPanelProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>, dateStr?: string) => void;
  onDelete: (id: string, dateStr?: string) => void;
  partners?: PartnerRelationship[];
  userProfiles?: Record<string, any>;
}

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  partners,
  userProfiles
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [estimate, setEstimate] = useState<number | ''>('');
  const { user } = useAuth();
  const { showToast } = useToast();
  const { showConfirm, showAlert } = useDialog();
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [shares, setShares] = useState<SharedUser[]>([]);
  const [reminderMessage, setReminderMessage] = useState('');

  // New Fields State
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dueDate, setDueDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [recurrence, setRecurrence] = useState('');
  const [channel, setChannel] = useState('');
  const [accountabilityPartnerId, setAccountabilityPartnerId] = useState<string | null>(null);

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
      setAccountabilityPartnerId(task.accountabilityPartnerId || null);
      setReminderMessage(''); // Reset message when task changes
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
        await showAlert('Share Failed', err.error || 'Failed to share', { variant: 'destructive' });
        return;
      }
      fetchShares();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnshare = async (userId: string) => {
    if (!task) return;
    const confirmed = await showConfirm(
      'Remove Access?',
      'Are you sure you want to remove this user from the task?',
      { variant: 'destructive', confirmText: 'Remove' }
    );
    if (!confirmed) return;
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

  const handleSendReminder = async () => {
    try {
      const headers = await getIdTokenHeader() as HeadersInit;
      const res = await fetch(`/api/tasks/${task!.id}/remind`, {
        method: 'POST',
        headers: {
          ...headers as any,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: reminderMessage.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to send reminder', 'error');
      } else {
        showToast('✅ Reminder sent successfully!', 'success');
        setReminderMessage(''); // Clear message after sending
      }
    } catch (err) {
      console.error('Failed to send reminder:', err);
      showToast('Failed to send reminder', 'error');
    }
  };

  const isDone = task.status === 'done';
  const categoryStyle = getCategoryStyles(task.channel || undefined);
  const isAP = user?.uid === task.accountabilityPartnerId;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const canSendReminder = isAP && isOverdue && !isDone;

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
          <div className={`flex items-center justify-between p-4 border-b ${categoryStyle.bgColor} ${categoryStyle.borderColor}`}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleUpdate({ status: isDone ? 'planned' : 'done' })}
                className="hover:scale-110 transition-transform"
              >
                {isDone ? (
                  <CheckCircle2 className="text-green-500" size={20} />
                ) : task?.status === 'awaiting_approval' ? (
                  <Clock className="text-yellow-500" size={20} />
                ) : (
                  <Circle className="text-gray-400" size={20} />
                )}
              </button>
              <h2 className="font-semibold text-gray-900 dark:text-white">Task Details</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  const confirmed = await showConfirm(
                    'Delete Task',
                    'Are you sure you want to delete this task? This action cannot be undone.',
                    { variant: 'destructive', confirmText: 'Delete' }
                  );
                  if (confirmed) {
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
                className="w-full text-xl font-bold bg-transparent border-none focus:ring-0 outline-none focus:outline-none text-gray-900 dark:text-white placeholder:text-gray-300 p-0"
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
                    value={priority || 'medium'}
                    onChange={(e) => {
                      const p = e.target.value as any;
                      setPriority(p);
                      handleUpdate({ priority: p });
                    }}
                    className="w-full bg-transparent border-none focus:ring-0 outline-none focus:outline-none p-0 text-sm font-medium text-gray-900 dark:text-gray-100 uppercase"
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
                      className="bg-transparent border-none focus:ring-0 outline-none focus:outline-none p-0 text-gray-900 dark:text-gray-100 flex-1 min-w-[120px]"
                    />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value);
                        handleUpdate({ startTime: e.target.value });
                      }}
                      className="bg-transparent border-none focus:ring-0 outline-none focus:outline-none p-0 text-gray-900 dark:text-gray-100 w-24"
                    />
                    <span className="self-center">-</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => {
                        setEndTime(e.target.value);
                        handleUpdate({ endTime: e.target.value });
                      }}
                      className="bg-transparent border-none focus:ring-0 outline-none focus:outline-none p-0 text-gray-900 dark:text-gray-100 w-24"
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
                    className="bg-transparent border-none focus:ring-0 outline-none focus:outline-none p-0 text-gray-900 dark:text-gray-100 w-full"
                  />
                </div>
              </div>

              {/* Recurrence */}
              <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                <Repeat size={18} className="flex-shrink-0" />
                <div className="flex-1">
                  <span className="block text-[11px] font-medium uppercase mb-0.5">Recurrence</span>
                  <select
                    value={recurrence || ''}
                    onChange={(e) => {
                      setRecurrence(e.target.value);
                      handleUpdate({
                        isRecurring: !!e.target.value,
                        recurrencePattern: e.target.value
                      });
                    }}
                    className="w-full bg-transparent border-none focus:ring-0 outline-none focus:outline-none p-0 text-sm font-medium text-gray-900 dark:text-gray-100"
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
                      className="bg-transparent border-none focus:ring-0 outline-none focus:outline-none p-0 text-gray-900 dark:text-gray-100 w-16"
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
                    value={channel || ''}
                    onChange={(e) => {
                      setChannel(e.target.value);
                      handleUpdate({ channel: e.target.value });
                    }}
                    className="w-full bg-transparent border-none focus:ring-0 outline-none focus:outline-none p-0 text-sm font-medium text-gray-900 dark:text-gray-100"
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
                  {accountabilityPartnerId ? (
                    <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-2 py-1.5 rounded-lg border border-purple-100 dark:border-purple-800">
                      <div className="w-5 h-5 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center text-[10px] font-bold text-purple-700 dark:text-purple-300 overflow-hidden">
                        {userProfiles?.[accountabilityPartnerId]?.photoURL ? (
                          <img src={userProfiles[accountabilityPartnerId].photoURL} className="w-full h-full object-cover" />
                        ) : (
                          <User size={12} />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate flex-1">
                        {userProfiles?.[accountabilityPartnerId]?.displayName || accountabilityPartnerId}
                      </span>
                      <button
                        onClick={() => {
                          setAccountabilityPartnerId(null);
                          handleUpdate({ accountabilityPartnerId: null, status: 'planned' });
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <select
                      className="w-full bg-transparent border border-gray-200 dark:border-gray-700 rounded-md p-1.5 text-sm focus:ring-0 outline-none focus:outline-none"
                      onChange={(e) => {
                        if (e.target.value) {
                          setAccountabilityPartnerId(e.target.value);
                          handleUpdate({ accountabilityPartnerId: e.target.value, status: 'pending_acceptance' });
                        }
                      }}
                      value=""
                    >
                      <option value="" disabled>Select a partner...</option>
                      {partners?.filter(p => p.status === 'active').map(p => {
                        const otherId = p.requesterId === user?.uid ? p.recipientId : p.requesterId;
                        return (
                          <option key={p.id} value={otherId}>
                            {userProfiles?.[otherId]?.displayName || otherId}
                          </option>
                        );
                      })}
                      {(!partners || partners.filter(p => p.status === 'active').length === 0) && (
                        <option value="" disabled>No active partners found</option>
                      )}
                    </select>
                  )}
                  {/* Status Actions for Accountability */}
                  {accountabilityPartnerId && (
                    <div className="mt-2 text-xs">
                      {/* Owner View */}
                      {user?.uid === task.ownerId && task.status === 'planned' && (
                        <button
                          onClick={() => handleUpdate({ status: 'awaiting_approval' })}
                          className="w-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 py-1 rounded hover:bg-blue-200 transaction-colors"
                        >
                          Submit for Review
                        </button>
                      )}
                      {user?.uid === task.ownerId && task.status === 'awaiting_approval' && (
                        <div className="w-full bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 py-1 rounded text-center">
                          Pending Partner Approval
                        </div>
                      )}

                      {/* Partner View */}
                      {user?.uid === accountabilityPartnerId && task.status === 'awaiting_approval' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate({ status: 'done' })}
                            className="flex-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 py-1 rounded hover:bg-green-200"
                          >
                            Approve (Done)
                          </button>
                          <button
                            onClick={() => handleUpdate({ status: 'planned', rejectionReason: 'Try again!' })}
                            className="flex-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 py-1 rounded hover:bg-red-200"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {/* Reminder Button for AP when task is overdue */}
                      {canSendReminder && (
                        <div className="mt-2 space-y-2">
                          {task.remindedAt && (() => {
                            const hoursSince = Math.floor((new Date().getTime() - new Date(task.remindedAt).getTime()) / (1000 * 60 * 60));
                            const canSendAgain = hoursSince >= 24;

                            return (
                              <p className="text-[10px] text-gray-500 text-center">
                                {canSendAgain
                                  ? `Last reminded ${hoursSince}h ago`
                                  : `⏳ Wait ${24 - hoursSince}h to remind again`
                                }
                              </p>
                            );
                          })()}

                          {/* Custom Message Input */}
                          <div>
                            <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Add a personal note (optional)
                            </label>
                            <textarea
                              value={reminderMessage}
                              onChange={(e) => {
                                if (e.target.value.length <= 200) {
                                  setReminderMessage(e.target.value);
                                }
                              }}
                              placeholder="e.g., Hey! Just a friendly reminder about this task..."
                              className="w-full text-xs p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                              rows={2}
                              maxLength={200}
                            />
                            <p className="text-[9px] text-gray-400 text-right mt-0.5">
                              {reminderMessage.length}/200
                            </p>
                          </div>

                          <button
                            onClick={handleSendReminder}
                            className="w-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 py-1.5 rounded hover:bg-orange-200 flex items-center justify-center gap-2 transition-colors"
                            title="Send reminder to task owner"
                          >
                            <Bell size={14} />
                            Send Reminder
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                <div className="w-[18px] flex justify-center"><Tag size={16} /></div>
                <div className="flex-1">
                  <span className="block text-[11px] font-medium uppercase mb-0.5">Owner / Delegate</span>
                  {(task.ownerId && task.ownerId !== task.userId) || (task.ownerId && task.userId && task.ownerId !== task.userId) ? (
                    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-2 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800">
                      <div className="w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-300 overflow-hidden">
                        {userProfiles?.[task.ownerId]?.photoURL ? (
                          <img src={userProfiles[task.ownerId].photoURL} className="w-full h-full object-cover" />
                        ) : (
                          <User size={12} />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate flex-1">
                        {userProfiles?.[task.ownerId]?.displayName || task.ownerId}
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
                          <span className="max-w-[100px] truncate">
                            {userProfiles?.[u.userId]?.displayName || u.userId}
                          </span>
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
                className="w-full h-48 bg-transparent border-none focus:ring-0 outline-none focus:outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-400 p-0 resize-none leading-relaxed"
                placeholder="Add notes, checklists, or context..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-neutral-800">
            {/* Partner Profile Display */}
            {accountabilityPartnerId && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <UserCircle size={16} className="text-purple-600 dark:text-purple-400" />
                <div className="flex-1">
                  <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase block">Partnered with</span>
                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    {userProfiles?.[accountabilityPartnerId]?.photoURL && (
                      <img src={userProfiles[accountabilityPartnerId].photoURL} className="w-4 h-4 rounded-full object-cover" />
                    )}
                    {userProfiles?.[accountabilityPartnerId]?.displayName || accountabilityPartnerId}
                  </span>
                </div>
                <span className="text-lg">🤝</span>
              </div>
            )}
            <div className="text-[10px] text-gray-400 text-center">
              {task.updatedAt ? `Last updated ${new Date(task.updatedAt).toLocaleString()}` : 'New task'}
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};
