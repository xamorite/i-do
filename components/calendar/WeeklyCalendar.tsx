"use client";

import React from 'react';
import { Task } from '@/lib/types';

interface WeeklyCalendarProps {
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

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ date, events, tasks }) => {
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        d.setDate(diff + i);
        return d;
    });

    const hours = Array.from({ length: 15 }, (_, i) => i + 6); // 6 AM to 8 PM

    return (
        <div className="flex-1 flex flex-col bg-white dark:bg-neutral-900 border-l border-gray-100 dark:border-neutral-800 overflow-hidden">
            {/* Days Header */}
            <div className="flex border-b border-gray-100 dark:border-neutral-800 ml-16">
                {days.map((d, i) => (
                    <div key={i} className="flex-1 p-4 text-center border-r border-gray-50 dark:border-neutral-900/50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {d.toLocaleDateString(undefined, { weekday: 'short' })}
                        </p>
                        <p className={`text-xl font-black ${d.toDateString() === new Date().toDateString() ? 'text-purple-600' : ''}`}>
                            {d.getDate()}
                        </p>
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto relative custom-scrollbar">
                <div className="flex">
                    {/* Time Column */}
                    <div className="w-16 flex-shrink-0 border-r border-gray-100 dark:border-neutral-800">
                        {hours.map((h) => (
                            <div key={h} className="h-20 border-b border-gray-50 dark:border-neutral-900/50 flex items-start justify-end pr-3 pt-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">
                                    {h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Day Columns */}
                    <div className="flex-1 flex">
                        {days.map((d, dayIdx) => {
                            const dateStr = formatDate(d);

                            // Filter items for this day
                            const dayItems = [
                                ...events.filter(e => {
                                    const eventDate = e.plannedDate || e.start?.split('T')[0] || e.date;
                                    return eventDate === dateStr;
                                }).map(e => ({ ...e, type: e.type || e.originalIntegration?.split('-')[0] || 'google' })),
                                ...tasks.filter(t => t.plannedDate === dateStr).map(t => ({ ...t, type: 'task' }))
                            ];

                            return (
                                <div key={dayIdx} className="flex-1 border-r border-gray-50 dark:border-neutral-900/50 relative min-h-[1200px]">
                                    {hours.map((h) => (
                                        <div key={h} className="h-20 border-b border-gray-50 dark:border-neutral-100/5 dark:border-neutral-900/30" />
                                    ))}

                                    {(() => {
                                        const processed: any[] = [];
                                        dayItems.filter(i => {
                                            const start = i.startTime || (i.start?.includes('T') ? i.start.split('T')[1] : '09:00');
                                            const h = parseInt(start.split(':')[0]);
                                            return h >= 6 && h <= 20;
                                        }).forEach((item, idx) => {
                                            const startTimeStr = item.startTime || (item.start?.includes('T') ? item.start.split('T')[1] : '09:00');
                                            const endTimeStr = item.endTime || (item.end?.includes('T') ? item.end.split('T')[1] : '10:00');

                                            const startHour = parseInt(startTimeStr.split(':')[0]) + (parseInt(startTimeStr.split(':')[1]) / 60);
                                            const endHour = parseInt(endTimeStr.split(':')[0]) + (parseInt(endTimeStr.split(':')[1]) / 60);
                                            const duration = endHour - startHour;

                                            const top = (startHour - 6) * 80;
                                            const height = duration * 80;

                                            const overlaps = processed.filter(p =>
                                                (top < p.top + p.height) && (top + height > p.top)
                                            );

                                            const column = overlaps.length;
                                            const width = 100 / (overlaps.length + 1);

                                            overlaps.forEach((p, i) => {
                                                p.width = 100 / (overlaps.length + 1);
                                                p.left = i * p.width;
                                            });

                                            processed.push({
                                                ...item,
                                                top,
                                                height,
                                                left: column * width,
                                                width: width,
                                                startTimeStr,
                                                endTimeStr
                                            });
                                        });

                                        return processed.map((item, itemIdx) => {
                                            const getColors = (type: string) => {
                                                switch (type) {
                                                    case 'google': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400';
                                                    case 'notion': return 'bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-400';
                                                    case 'slack': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400';
                                                    default: return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400';
                                                }
                                            };

                                            return (
                                                <div
                                                    key={itemIdx}
                                                    className={`absolute rounded-lg border p-2 text-[10px] font-bold overflow-hidden shadow-sm transition-transform hover:scale-[1.02] hover:z-30 cursor-pointer ${getColors(item.type)}`}
                                                    style={{
                                                        top: `${item.top}px`,
                                                        height: `${Math.max(item.height, 24)}px`,
                                                        left: `${item.left}%`,
                                                        width: `${item.width}%`
                                                    }}
                                                >
                                                    <div className="line-clamp-1">{item.title || item.summary}</div>
                                                    {item.height > 30 && (
                                                        <div className="opacity-60 mt-0.5 flex items-center gap-1">
                                                            <span>{item.startTimeStr}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
