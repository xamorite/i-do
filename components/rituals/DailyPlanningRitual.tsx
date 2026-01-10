"use client";

import React, { useState } from 'react';
import { X, ArrowRight, Check, Calendar, Clock, Layout, Circle, CheckCircle2 } from 'lucide-react';
import { Task } from '@/lib/types';

interface DailyPlanningRitualProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date;
    tasks: Record<string, Task[]>;
    onUpdateTask: (taskId: string, updates: Partial<Task>, dateStr?: string) => void;
}

type RitualStep = 'review' | 'plan' | 'estimate' | 'timebox';

export const DailyPlanningRitual: React.FC<DailyPlanningRitualProps> = ({
    isOpen,
    onClose,
    date,
    tasks,
    onUpdateTask,
}) => {
    const [step, setStep] = useState<RitualStep>('review');

    if (!isOpen) return null;

    const steps: { id: RitualStep; title: string; icon: React.ReactNode }[] = [
        { id: 'review', title: 'Review Yesterday', icon: <Check size={18} /> },
        { id: 'plan', title: 'Fill Your Day', icon: <Layout size={18} /> },
        { id: 'estimate', title: 'Estimate Time', icon: <Clock size={18} /> },
        { id: 'timebox', title: 'Timebox', icon: <Calendar size={18} /> },
    ];

    const handleNext = () => {
        const currentIndex = steps.findIndex((s) => s.id === step);
        if (currentIndex < steps.length - 1) {
            setStep(steps[currentIndex + 1].id);
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                            <Calendar className="text-purple-600 dark:text-purple-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Daily Planning</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between max-w-2xl mx-auto">
                        {steps.map((s, index) => {
                            const isActive = s.id === step;
                            const isCompleted = steps.findIndex((st) => st.id === step) > index;

                            return (
                                <div key={s.id} className="flex flex-col items-center relative group">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isActive
                                            ? 'bg-purple-600 text-white shadow-lg scale-110'
                                            : isCompleted
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                            }`}
                                    >
                                        {isCompleted ? <Check size={16} /> : s.icon}
                                    </div>
                                    <span
                                        className={`mt-2 text-xs font-medium transition-colors ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500'
                                            }`}
                                    >
                                        {s.title}
                                    </span>
                                    {index < steps.length - 1 && (
                                        <div className="absolute top-5 left-1/2 w-full h-[2px] -z-10 bg-gray-200 dark:bg-gray-700">
                                            <div
                                                className={`h-full bg-green-500 transition-all duration-500 ${isCompleted ? 'w-full' : 'w-0'
                                                    }`}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-900">
                    <div className="max-w-3xl mx-auto">

                        {step === 'review' && (() => {
                            // Get yesterday's date
                            const yesterday = new Date(date);
                            yesterday.setDate(yesterday.getDate() - 1);
                            const yesterdayKey = yesterday.toISOString().split('T')[0];
                            const yesterdayTasks = tasks[yesterdayKey] || [];

                            const completed = yesterdayTasks.filter(t => t.status === 'done').length;
                            const total = yesterdayTasks.length;

                            return (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Review Yesterday</h3>
                                        <p className="text-gray-500">Check off what you finished. We'll archive the rest.</p>
                                        {total > 0 && (
                                            <p className="mt-2 text-sm font-medium text-purple-600">
                                                {completed} of {total} completed
                                            </p>
                                        )}
                                    </div>

                                    {yesterdayTasks.length === 0 ? (
                                        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700">
                                            No tasks from yesterday
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {yesterdayTasks.map(task => (
                                                <div
                                                    key={task.id}
                                                    className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center gap-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                                                >
                                                    <button
                                                        onClick={() => {
                                                            const newStatus = task.status === 'done' ? 'planned' : 'done';
                                                            onUpdateTask(task.id, { status: newStatus }, yesterdayKey);
                                                        }}
                                                        className="flex-shrink-0"
                                                    >
                                                        {task.status === 'done' ? (
                                                            <CheckCircle2 className="text-green-500" size={20} />
                                                        ) : (
                                                            <Circle className="text-gray-400" size={20} />
                                                        )}
                                                    </button>
                                                    <div className="flex-1">
                                                        <p className={`font-medium ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                                            {task.title}
                                                        </p>
                                                        {task.estimateMinutes && (
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {Math.floor(task.estimateMinutes / 60)}h {task.estimateMinutes % 60}m
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {step === 'plan' && (() => {
                            const todayKey = date.toISOString().split('T')[0];
                            const todayTasks = tasks[todayKey] || [];

                            // Get inbox/backlog tasks (tasks not planned for today)
                            const availableTasks = Object.values(tasks).flat().filter(t =>
                                (t.status === 'inbox' || t.status === 'backlog') &&
                                t.plannedDate !== todayKey
                            );

                            return (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Fill Your Day</h3>
                                        <p className="text-gray-500">What are your top priorities for today?</p>
                                        <p className="mt-2 text-sm font-medium text-purple-600">
                                            {todayTasks.length} tasks planned
                                        </p>
                                    </div>

                                    {availableTasks.length === 0 ? (
                                        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                                            <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                </svg>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-300 font-medium mb-2">Your inbox is empty!</p>
                                            <p className="text-sm text-gray-400 mb-4">
                                                Add tasks to your <span className="font-bold text-purple-600 dark:text-purple-400">Inbox</span> first, then schedule them here.
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                💡 Tip: Check the <span className="font-semibold">Inbox column</span> on your dashboard to add unplanned tasks
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Click to add to today:
                                            </p>
                                            {availableTasks.slice(0, 10).map(task => (
                                                <div
                                                    key={task.id}
                                                    onClick={() => {
                                                        onUpdateTask(task.id, {
                                                            plannedDate: todayKey,
                                                            status: 'planned'
                                                        });
                                                    }}
                                                    className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center gap-3 border border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-all hover:shadow-md"
                                                >
                                                    <Circle className="text-gray-400 flex-shrink-0" size={20} />
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {task.title}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {task.channel || 'No category'}
                                                        </p>
                                                    </div>
                                                    <ArrowRight className="text-purple-500 flex-shrink-0" size={16} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {step === 'estimate' && (() => {
                            const todayKey = date.toISOString().split('T')[0];
                            const todayTasks = tasks[todayKey] || [];

                            const totalMinutes = todayTasks.reduce((sum, t) => sum + (t.estimateMinutes || 0), 0);
                            const hours = Math.floor(totalMinutes / 60);
                            const mins = totalMinutes % 60;

                            return (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Estimate Time</h3>
                                        <p className="text-gray-500">How long will each task take? Be realistic.</p>
                                        <p className="mt-2 text-sm font-medium text-purple-600">
                                            Total: {hours}h {mins}m {totalMinutes > 480 && <span className="text-orange-500">(⚠️ Over 8 hours)</span>}
                                        </p>
                                    </div>

                                    {todayTasks.length === 0 ? (
                                        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700">
                                            No tasks planned for today. Add some in the previous step!
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {todayTasks.map(task => {
                                                const estimateHours = Math.floor((task.estimateMinutes || 0) / 60);
                                                const estimateMins = (task.estimateMinutes || 0) % 60;

                                                return (
                                                    <div
                                                        key={task.id}
                                                        className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center gap-3 border border-gray-200 dark:border-gray-700"
                                                    >
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-900 dark:text-white mb-2">
                                                                {task.title}
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="23"
                                                                    value={estimateHours}
                                                                    onChange={(e) => {
                                                                        const newHours = parseInt(e.target.value) || 0;
                                                                        const newMinutes = newHours * 60 + estimateMins;
                                                                        onUpdateTask(task.id, { estimateMinutes: newMinutes }, todayKey);
                                                                    }}
                                                                    className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                                    placeholder="0"
                                                                />
                                                                <span className="text-sm text-gray-500">h</span>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="59"
                                                                    step="15"
                                                                    value={estimateMins}
                                                                    onChange={(e) => {
                                                                        const newMins = parseInt(e.target.value) || 0;
                                                                        const newMinutes = estimateHours * 60 + newMins;
                                                                        onUpdateTask(task.id, { estimateMinutes: newMinutes }, todayKey);
                                                                    }}
                                                                    className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                                    placeholder="0"
                                                                />
                                                                <span className="text-sm text-gray-500">m</span>
                                                            </div>
                                                        </div>
                                                        <Clock className="text-gray-400" size={20} />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {step === 'timebox' && (() => {
                            const todayKey = date.toISOString().split('T')[0];
                            const todayTasks = tasks[todayKey] || [];

                            return (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Timebox</h3>
                                        <p className="text-gray-500">Drag your tasks onto the calendar to lock them in.</p>
                                        <p className="mt-2 text-sm text-purple-600">
                                            {todayTasks.length} tasks ready to schedule
                                        </p>
                                    </div>

                                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-8 border-2 border-purple-200 dark:border-purple-700">
                                        <div className="text-center">
                                            <Calendar className="mx-auto text-purple-600 dark:text-purple-400 mb-4" size={48} />
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                                Time Blocking Coming Soon!
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                                This step will integrate with your calendar to help you schedule exact time blocks for each task.
                                            </p>
                                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-md mx-auto">
                                                <p className="text-xs text-gray-500 mb-3">
                                                    <strong>Your planned tasks:</strong>
                                                </p>
                                                {todayTasks.length === 0 ? (
                                                    <p className="text-sm text-gray-400">No tasks planned yet</p>
                                                ) : (
                                                    <ul className="space-y-2 text-left">
                                                        {todayTasks.map(task => (
                                                            <li key={task.id} className="text-sm flex items-center gap-2">
                                                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                                <span className="text-gray-900 dark:text-white">{task.title}</span>
                                                                {task.estimateMinutes && (
                                                                    <span className="text-xs text-gray-500 ml-auto">
                                                                        ({Math.floor(task.estimateMinutes / 60)}h {task.estimateMinutes % 60}m)
                                                                    </span>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <button
                        onClick={onClose}
                        className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        Skip for now
                    </button>
                    <button
                        onClick={handleNext}
                        className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-medium transition-colors shadow-lg shadow-purple-200 dark:shadow-none"
                    >
                        <span>{step === 'timebox' ? 'Finish Planning' : 'Next Step'}</span>
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
