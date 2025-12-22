import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, AlertCircle, Repeat, Trash2 } from 'lucide-react';
import { Activity } from '@/lib/types';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

export type RecurrenceType = 'none' | 'daily' | 'every_2_days' | 'every_3_days' | 'every_4_days' | 'weekly' | 'monthly' | 'yearly';

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (activity: Activity, startDate: Date, recurrence: { type: RecurrenceType, endDate?: Date }) => void;
    initialData?: Activity;
    mode?: 'add' | 'edit';
    selectedDate: Date;
    onUpdate?: (activity: Activity, startDate: Date, recurrence: { type: RecurrenceType, endDate?: Date }, originalActivity: Activity) => void;
    onDelete?: (activity: Activity) => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onAdd, onUpdate, onDelete, selectedDate, initialData, mode = 'add' }) => {
    const [desc, setDesc] = useState('');
    const [type, setType] = useState('work');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [deadline, setDeadline] = useState('');
    const [reminder, setReminder] = useState('none');

    // New State Fields
    const [startDateStr, setStartDateStr] = useState('');
    const [recurrence, setRecurrence] = useState<RecurrenceType>('none');

    const [endDateStr, setEndDateStr] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Safe initialization
    useEffect(() => {
        if (isOpen) {
            if (initialData && mode === 'edit') {
                setDesc(initialData.desc);
                setType(initialData.type);
                setReminder(initialData.reminder || 'none');

                // Parse time string "3:00 AM - 6:00 AM" or "All Day"
                if (initialData.time === 'All Day') {
                    setStartTime('');
                    setEndTime('');
                } else {
                    const [startPart, endPart] = initialData.time.split(' - ');
                    if (startPart && endPart) {
                        // Helper to convert "3:00 AM" to "03:00"
                        const to24h = (t: string) => {
                            const [time, period] = t.trim().split(' ');
                            const [h, m] = time.split(':');
                            let hour = parseInt(h);
                            if (period === 'PM' && hour !== 12) hour += 12;
                            if (period === 'AM' && hour === 12) hour = 0;
                            return `${hour.toString().padStart(2, '0')}:${m}`;
                        };
                        setStartTime(to24h(startPart));
                        setEndTime(to24h(endPart));
                    }
                }

                if (initialData.deadline) {
                    // initialData.deadline is ISO string, input expects YYYY-MM-DDThh:mm
                    setDeadline(initialData.deadline.slice(0, 16));
                } else {
                    setDeadline('');
                }

                // For editing, we assume recurrence none for now unless simple
                setRecurrence('none');
            } else {
                // Reset for add mode
                setDesc('');
                setType('work');
                setStartTime('');
                setEndTime('');
                setDeadline('');
                setReminder('none');
                setRecurrence('none');
            }
        }
    }, [isOpen, initialData, mode]);

    // Initialize date on open
    useEffect(() => {
        if (isOpen && selectedDate) {
            // Format YYYY-MM-DD for input
            const yyyy = selectedDate.getFullYear();
            const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const dd = String(selectedDate.getDate()).padStart(2, '0');
            setStartDateStr(`${yyyy}-${mm}-${dd}`);

            // Default End Date to end of current month
            const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
            const l_mm = String(lastDay.getMonth() + 1).padStart(2, '0');
            const l_dd = String(lastDay.getDate()).padStart(2, '0');
            setEndDateStr(`${lastDay.getFullYear()}-${l_mm}-${l_dd}`);
        }
    }, [isOpen, selectedDate]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Format time string "9:00 AM - 10:00 AM"
        const formatTime = (time: string) => {
            const [hours, minutes] = time.split(':');
            const h = parseInt(hours);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${h12}:${minutes} ${ampm}`;
        };

        let timeStr = 'All Day';
        let durationStr: string | undefined = undefined;

        if (startTime && endTime) {
            const fStart = formatTime(startTime);
            const fEnd = formatTime(endTime);
            timeStr = `${fStart} - ${fEnd}`;

            // Calculate duration
            const durationMs = new Date(`1970-01-01T${endTime}`).getTime() - new Date(`1970-01-01T${startTime}`).getTime();
            const durationHrs = Math.round(durationMs / (1000 * 60 * 60) * 10) / 10;
            durationStr = `${durationHrs}h`;
        }

        const newActivity: Activity = {
            time: timeStr,
            desc,
            type,
            deadline: deadline ? new Date(deadline).toISOString() : undefined,
            reminder: reminder !== 'none' ? reminder : undefined,
            duration: durationStr
        };

        // Parse dates
        const [s_y, s_m, s_d] = startDateStr.split('-').map(Number);
        const localStartDate = new Date(s_y, s_m - 1, s_d);

        let localEndDate: Date | undefined = undefined;
        if (recurrence !== 'none' && endDateStr) {
            const [e_y, e_m, e_d] = endDateStr.split('-').map(Number);
            localEndDate = new Date(e_y, e_m - 1, e_d);
        }

        if (mode === 'edit' && onUpdate && initialData) {
            onUpdate(newActivity, localStartDate, { type: recurrence, endDate: localEndDate }, initialData);
        } else {
            onAdd(newActivity, localStartDate, { type: recurrence, endDate: localEndDate });
        }

        onClose();

        // Reset form
        setDesc('');
        setType('work');
        setStartTime('');
        setEndTime('');
        setRecurrence('none');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 z-10">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{mode === 'edit' ? 'Edit Task' : 'Add New Task'}</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                        <X size={20} className="text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-black dark:text-gray-200 mb-1">Description</label>
                        <input
                            type="text"
                            required
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-gray-900 dark:text-white dark:bg-neutral-800 placeholder:text-gray-500"
                            placeholder="What needs to be done?"
                        />
                    </div>

                    {/* Date Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-black dark:text-gray-200 mb-1">Date</label>
                            <div className="relative">
                                <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="date"
                                    required
                                    value={startDateStr}
                                    onChange={(e) => setStartDateStr(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white dark:bg-neutral-800 placeholder:text-gray-500 dark:[color-scheme:dark]"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-black dark:text-gray-200 mb-1">Recurrence</label>
                            <div className="relative">
                                <Repeat size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <select
                                    value={recurrence}
                                    onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none appearance-none bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                                >
                                    <option value="none">Does not repeat</option>
                                    <option value="daily">Daily</option>
                                    <option value="every_2_days">Every 2 Days</option>
                                    <option value="every_3_days">Every 3 Days</option>
                                    <option value="every_4_days">Every 4 Days</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* End Date (Conditional) */}
                    {recurrence !== 'none' && (
                        <div>
                            <label className="block text-sm font-medium text-black dark:text-gray-200 mb-1">Repeat Until</label>
                            <div className="relative">
                                <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="date"
                                    value={endDateStr}
                                    onChange={(e) => setEndDateStr(e.target.value)}
                                    min={startDateStr}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white dark:bg-neutral-800 placeholder:text-gray-500 dark:[color-scheme:dark]"
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-black dark:text-gray-200 mb-1">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white dark:bg-neutral-800"
                            >
                                <option value="work">Work</option>
                                <option value="music">Music</option>
                                <option value="hobby">Hobby</option>
                                <option value="spiritual">Spiritual</option>
                                <option value="personal">Personal</option>
                                <option value="call">Call</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-black dark:text-gray-200 mb-1">Reminder</label>
                            <select
                                value={reminder}
                                onChange={(e) => setReminder(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white dark:bg-neutral-800"
                            >
                                <option value="none">None</option>
                                <option value="15min">15 min before</option>
                                <option value="30min">30 min before</option>
                                <option value="1h">1 hour before</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-black dark:text-gray-200 mb-1">Start Time</label>
                            <div className="relative">
                                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white dark:bg-neutral-800 placeholder:text-gray-500 dark:[color-scheme:dark]"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-black dark:text-gray-200 mb-1">End Time</label>
                            <div className="relative">
                                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white dark:bg-neutral-800 placeholder:text-gray-500 dark:[color-scheme:dark]"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-black dark:text-gray-200 mb-1">Deadline (Optional)</label>
                        <div className="relative">
                            <AlertCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="datetime-local"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white dark:bg-neutral-800 placeholder:text-gray-500 dark:[color-scheme:dark]"
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex justify-between gap-3">
                        {mode === 'edit' && onDelete && initialData ? (
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Trash2 size={16} />
                                Delete
                            </button>
                        ) : (
                            <div></div>
                        )}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-black dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors"
                            >
                                {mode === 'edit' ? 'Save Changes' : 'Add Task'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => {
                    if (onDelete && initialData) {
                        onDelete(initialData);
                        onClose();
                    }
                }}
                title={initialData?.desc}
            />
        </div>
    );
};
