"use client";

import React from 'react';
import { Task } from '@/lib/types';

interface MonthlyCalendarProps {
    date: Date;
    events: any[];
    tasks: Task[];
}

const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ date, events, tasks }) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    // Adjust to start of the week (Monday)
    const startDay = startOfMonth.getDay();
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - (startDay === 0 ? 6 : startDay - 1));

    const weeks = [];
    let currentWeek = [];
    let currentDay = new Date(startDate);

    for (let i = 0; i < 42; i++) {
        currentWeek.push(new Date(currentDay));
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
        currentDay.setDate(currentDay.getDate() + 1);
    }

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <div className="flex-1 flex flex-col bg-white dark:bg-neutral-900 border-l border-gray-100 dark:border-neutral-800 overflow-hidden">
            {/* Day Names Header */}
            <div className="flex border-b border-gray-100 dark:border-neutral-800">
                {dayNames.map((name) => (
                    <div key={name} className="flex-1 p-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest border-r border-gray-50 dark:border-neutral-900/50">
                        {name}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="flex-1 grid grid-rows-6">
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex border-b border-gray-100 dark:border-neutral-800">
                        {week.map((day, dayIndex) => {
                            const isCurrentMonth = day.getMonth() === date.getMonth();
                            const isToday = day.toDateString() === new Date().toDateString();

                            return (
                                <div
                                    key={dayIndex}
                                    className={`flex-1 border-r border-gray-50 dark:border-neutral-900/50 p-2 min-h-[100px] ${isCurrentMonth ? 'bg-white dark:bg-neutral-900' : 'bg-gray-50/50 dark:bg-neutral-800/30'
                                        }`}
                                >
                                    <p className={`text-xs font-bold ${isToday ? 'bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center' :
                                        isCurrentMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'
                                        }`}>
                                        {day.getDate()}
                                    </p>

                                    <div className="mt-2 space-y-1">
                                        {[
                                            ...events.filter(e => {
                                                const eventDate = e.plannedDate || e.start?.split('T')[0] || e.date;
                                                return eventDate === formatDate(day);
                                            }).map(e => ({ ...e, type: e.type || e.originalIntegration?.split('-')[0] || 'google' })),
                                            ...tasks.filter(t => t.plannedDate === formatDate(day)).map(t => ({ ...t, type: 'task' }))
                                        ].slice(0, 3).map((item, itemIdx) => {
                                            const getColors = (type: string) => {
                                                switch (type) {
                                                    case 'google': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200/50';
                                                    case 'notion': return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200/50';
                                                    case 'slack': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200/50';
                                                    default: return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200/50';
                                                }
                                            };

                                            return (
                                                <div
                                                    key={itemIdx}
                                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border truncate ${getColors(item.type)}`}
                                                >
                                                    {item.title || item.summary}
                                                </div>
                                            );
                                        })}
                                        {[...events, ...tasks].filter(i => (i.start?.split('T')[0] || i.date || i.plannedDate) === day.toISOString().split('T')[0]).length > 3 && (
                                            <div className="text-[9px] font-bold text-gray-400 px-1">
                                                + {[...events, ...tasks].filter(i => (i.start?.split('T')[0] || i.date || i.plannedDate) === day.toISOString().split('T')[0]).length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};
