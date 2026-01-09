"use client";

import React, { useState } from 'react';
import {
    X,
    Clock,
    Calendar,
    Flag,
    Repeat,
    CalendarCheck,
    Tag,
    Plus
} from 'lucide-react';
import { Task, User } from '@/lib/types';
import { UserAutocomplete } from '@/components/partners/UserAutocomplete';
import { useAuth } from '@/contexts/AuthContext';
import { usePartnersRealtime } from '@/hooks/usePartnersRealtime';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (task: Partial<Task>) => Promise<void>;
    initialDate?: string;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
    isOpen,
    onClose,
    onCreate,
    initialDate
}) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [priority, setPriority] = useState<Task['priority']>('medium');
    const [plannedDate, setPlannedDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [recurrence, setRecurrence] = useState('');
    const [estimate, setEstimate] = useState<number | ''>('');
    const [channel, setChannel] = useState('');
    const [ownerId, setOwnerId] = useState<string | undefined>(undefined);
    const [partnerId, setPartnerId] = useState<string | undefined>(undefined);
    const [submitting, setSubmitting] = useState(false);

    // Partners Logic
    const { partners } = usePartnersRealtime();
    const [partnerProfiles, setPartnerProfiles] = useState<Record<string, string>>({});

    React.useEffect(() => {
        const fetchPartnerProfiles = async () => {
            if (!partners || partners.length === 0) return;
            const profiles: Record<string, string> = {};

            for (const p of partners) {
                const otherId = p.requesterId === user?.uid ? p.recipientId : p.requesterId;
                if (profiles[otherId]) continue;
                try {
                    const userDoc = await getDoc(doc(db, 'users', otherId));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        profiles[otherId] = userData.displayName || userData.username || 'Unknown User';
                    }
                } catch (e) {
                    console.error("Error fetching profile", e);
                }
            }
            setPartnerProfiles(profiles);
        };
        if (partners && user) fetchPartnerProfiles();
    }, [partners, user]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setSubmitting(true);
        try {
            const newTask: Partial<Task> = {
                title: title.trim(),
                notes,
                priority,
                plannedDate: plannedDate || null,
                dueDate: dueDate || null,
                startTime: startTime || null,
                endTime: endTime || null,
                isRecurring: !!recurrence,
                estimateMinutes: typeof estimate === 'number' ? estimate : null,
                status: 'planned',
                ownerId: ownerId || user?.uid,
                userId: user?.uid, // Creator
                createdBy: user?.uid,
            };

            if (channel) newTask.channel = channel;
            if (recurrence) newTask.recurrencePattern = recurrence;
            if (partnerId) newTask.accountabilityPartnerId = partnerId;

            await onCreate(newTask);
            onClose();
            // Reset form
            setTitle('');
            setNotes('');
            setPriority('medium');
            setEstimate('');
            setChannel('');
        } catch (error) {
            console.error('Failed to create task:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-800">
                        <h2 className="font-bold text-lg text-gray-900 dark:text-white">Create New Task</h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Title */}
                        <div>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full text-xl font-bold bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder:text-gray-300 p-0"
                                placeholder="Task title"
                                autoFocus
                                required
                            />
                        </div>

                        {/* Fields Grid */}
                        <div className="space-y-4">

                            {/* Priority */}
                            <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                                <Flag size={18} className="flex-shrink-0" />
                                <div className="flex-1">
                                    <span className="block text-[11px] font-medium uppercase mb-0.5">Priority</span>
                                    <select
                                        value={priority || 'medium'}
                                        onChange={(e) => setPriority(e.target.value as any)}
                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-gray-900 dark:text-gray-100 uppercase"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                            </div>

                            {/* Planned Date */}
                            <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                                <Calendar size={18} className="flex-shrink-0" />
                                <div className="flex-1">
                                    <span className="block text-[11px] font-medium uppercase mb-0.5">Planned Schedule</span>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={plannedDate}
                                            onChange={(e) => setPlannedDate(e.target.value)}
                                            className="bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-gray-100 flex-1"
                                        />
                                        <input
                                            type="time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-gray-100 w-24"
                                        />
                                        <span className="self-center">-</span>
                                        <input
                                            type="time"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
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
                                        onChange={(e) => setDueDate(e.target.value)}
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
                                        value={recurrence || ''}
                                        onChange={(e) => setRecurrence(e.target.value)}
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
                                    <span className="block text-[11px] font-medium uppercase mb-0.5">Time Estimate (min)</span>
                                    <input
                                        type="number"
                                        value={estimate}
                                        onChange={(e) => setEstimate(e.target.value ? parseInt(e.target.value) : '')}
                                        className="bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-gray-100 w-24"
                                        placeholder="--"
                                    />
                                </div>
                            </div>

                            {/* Category */}
                            <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                                <Tag size={18} className="flex-shrink-0" />
                                <div className="flex-1">
                                    <span className="block text-[11px] font-medium uppercase mb-0.5">Category</span>
                                    <select
                                        value={channel || ''}
                                        onChange={(e) => setChannel(e.target.value)}
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

                            {/* Accountability */}
                            <div className="pt-4 border-t border-gray-100 dark:border-neutral-800 space-y-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Assignments</h3>

                                {/* Partner */}
                                <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                                    <div className="w-[18px] flex justify-center"><Tag size={16} /></div>
                                    <div className="flex-1">
                                        <span className="block text-[11px] font-medium uppercase mb-0.5">Accountability Partner</span>
                                        {partnerId ? (
                                            <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-2 py-1.5 rounded-lg border border-purple-100 dark:border-purple-800">
                                                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                                                    {partnerProfiles[partnerId] || partnerId}
                                                </span>
                                                <button onClick={() => setPartnerId(undefined)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <select
                                                className="w-full bg-transparent border border-gray-200 dark:border-gray-700 rounded-md p-1.5 text-sm"
                                                onChange={(e) => setPartnerId(e.target.value)}
                                                value=""
                                            >
                                                <option value="" disabled>Select a partner...</option>
                                                {partners?.filter(p => p.status === 'active').map(p => {
                                                    const otherId = p.requesterId === user?.uid ? p.recipientId : p.requesterId;
                                                    return (
                                                        <option key={p.id} value={otherId}>
                                                            {partnerProfiles[otherId] || otherId}
                                                        </option>
                                                    );
                                                })}
                                                {(!partners || partners.filter(p => p.status === 'active').length === 0) && (
                                                    <option value="" disabled>No active partners found</option>
                                                )}
                                            </select>
                                        )}
                                    </div>
                                </div>

                                {/* Owner / Delegate */}
                                <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                                    <div className="w-[18px] flex justify-center"><Tag size={16} /></div>
                                    <div className="flex-1">
                                        <span className="block text-[11px] font-medium uppercase mb-0.5">Assign To</span>
                                        {ownerId && ownerId !== user?.uid ? (
                                            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-2 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800">
                                                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">{ownerId}</span>
                                                <button onClick={() => setOwnerId(user?.uid)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Me</span>
                                                <span className="text-xs text-gray-400 mx-2">or</span>
                                                <div className="flex-1">
                                                    <UserAutocomplete
                                                        onSelect={(u) => setOwnerId(u.userId)}
                                                        placeholder="Delegate..."
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>

                            <hr className="border-gray-100 dark:border-neutral-800" />

                            {/* Notes */}
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full h-32 bg-transparent border-none focus:ring-0 text-gray-700 dark:text-gray-300 placeholder:text-gray-400 p-0 resize-none leading-relaxed"
                                placeholder="Add notes, checklists, or context..."
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? 'Creating...' : (
                                    <>
                                        <Plus size={20} />
                                        Create Task
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
