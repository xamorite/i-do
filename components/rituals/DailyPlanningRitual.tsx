"use client";

import React, { useState } from 'react';
import { X, ArrowRight, Check, Calendar, Clock, Layout } from 'lucide-react';
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

                        {step === 'review' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Review Yesterday</h3>
                                    <p className="text-gray-500">Check off what you finished. We'll archive the rest.</p>
                                </div>
                                {/* TODO: List yesterday's tasks here */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700">
                                    Placeholder: Yesterday's Task List
                                </div>
                            </div>
                        )}

                        {step === 'plan' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Fill Your Day</h3>
                                    <p className="text-gray-500">What are your top priorities for today?</p>
                                </div>
                                {/* TODO: Add tasks from backlog/input */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700">
                                    Placeholder: Add/Select Tasks Interface
                                </div>
                            </div>
                        )}

                        {step === 'estimate' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Estimate Time</h3>
                                    <p className="text-gray-500">How long will each task take? Be realistic.</p>
                                </div>
                                {/* TODO: Time estimation inputs for each task */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700">
                                    Placeholder: Task List with Time Inputs
                                </div>
                            </div>
                        )}

                        {step === 'timebox' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Timebox</h3>
                                    <p className="text-gray-500">Drag your tasks onto the calendar to lock them in.</p>
                                </div>
                                {/* TODO: Split view with tasks and calendar */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700">
                                    Placeholder: Drag and Drop Calendar View
                                </div>
                            </div>
                        )}

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
