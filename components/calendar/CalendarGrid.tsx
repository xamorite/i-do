"use client";
/* eslint-disable */

import React from 'react';
import { Calendar as CalendarIcon, MoreHorizontal, ChevronLeft, ChevronRight, Search, Clock } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { Task } from '@/lib/types';

interface CalendarGridProps {
    date: Date;
    events: any[];
    tasks?: Task[];
    searchQuery?: string;
}

interface HourSlotProps {
    hour: number;
    date: Date;
}

const HourSlot: React.FC<HourSlotProps> = ({ hour, date }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `hour-${hour}`,
        data: {
            type: 'CalendarSlot',
            hour,
            date,
        }
    });

    return (
        <div
            ref={setNodeRef}
            className={`h-20 border-b border-gray-100/50 dark:border-neutral-900/50 flex items-start pt-2 transition-colors ${isOver ? 'bg-purple-100/50 dark:bg-purple-900/20' : ''}`}
        >
            <span className="text-[10px] font-bold text-gray-400 w-12 text-right pr-4 uppercase">
                {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
            </span>
            <div className="flex-1 h-full relative" />
        </div>
    );
};

export const CalendarGrid: React.FC<CalendarGridProps> = ({ date, events, tasks = [], searchQuery = '' }) => {
    const hours = Array.from({ length: 15 }, (_, i) => i + 6); // 6 AM to 8 PM

    const dayLabel = date.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();
    const dayNumber = date.getDate();

    const getTimePosition = (timeStr: string) => {
        const d = new Date(timeStr);
        const h = d.getHours();
        const m = d.getMinutes();
        if (h < 6) return null;
        const offset = (h - 6) * 80 + (m / 60) * 80; // 80px per hour
        return offset + 16; // offset from top
    };

    const getTimeHeight = (start: string, end: string) => {
        const s = new Date(start);
        const e = new Date(end);
        const diffMs = e.getTime() - s.getTime();
        const diffMin = diffMs / (1000 * 60);
        return (diffMin / 60) * 80;
    };

    const timeboxedTasks = tasks.filter(t =>
        t.isTimeboxed &&
        t.startTime &&
        t.endTime &&
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-96 flex flex-col h-full bg-gray-50/30 dark:bg-neutral-900/10 border-l border-gray-100 dark:border-neutral-900">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-neutral-900 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-neutral-800 shadow-sm text-sm font-bold">
                    <CalendarIcon size={16} className="text-gray-400" />
                    <span>Calendars</span>
                </div>
                <div className="flex items-center gap-1">
                    <button title="Search calendar" aria-label="Search calendar" className="p-1.5 hover:bg-white dark:hover:bg-neutral-800 rounded-lg transition-colors"><Search size={18} className="text-gray-400" /></button>
                    <button title="More options" aria-label="More options" className="p-1.5 hover:bg-white dark:hover:bg-neutral-800 rounded-lg transition-colors"><MoreHorizontal size={18} className="text-gray-400" /></button>
                </div>
            </div>

            {/* Date Header */}
            <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{dayLabel}</p>
                        <p className="text-2xl font-black">{dayNumber}</p>
                    </div>
                    <div className="h-10 w-px bg-gray-100 dark:bg-neutral-800" />
                </div>
            </div>

            {/* Grid Wrapper */}
            <div className="flex-1 overflow-y-auto relative">
                <div className="px-4">
                    {hours.map((hour) => (
                        <HourSlot key={hour} hour={hour} date={date} />
                    ))}
                </div>

                {/* Merged Items with Overlap Detection */}
                {(() => {
                    const todayStr = date.toISOString().split('T')[0];
                    const allItems = [
                        ...events.map(e => ({ ...e, isEvent: true, start: e.startTime || e.start?.dateTime, end: e.endTime || e.end?.dateTime, type: e.type || e.originalIntegration?.split('-')[0] || 'google' })),
                        ...timeboxedTasks.map(t => ({ ...t, isEvent: false, start: t.startTime, end: t.endTime, type: 'task' }))
                    ].filter(i => {
                        if (!i.start || !i.end) return false;
                        return i.start.split('T')[0] === todayStr;
                    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

                    const processed: any[] = [];
                    allItems.forEach((item, idx) => {
                        const top = getTimePosition(item.start);
                        const height = getTimeHeight(item.start, item.end);
                        if (top === null) return;

                        // Check for overlaps with already processed items
                        const overlaps = processed.filter(p =>
                            (top < p.top + p.height) && (top + height > p.top)
                        );

                        const column = overlaps.length;
                        const width = 100 / (overlaps.length + 1);

                        // Shift previous items in the same collision group to make room
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
                            id: item.id || idx
                        });
                    });

                    const CalendarItem: React.FC<{ item: any }> = ({ item }) => {
                        const elRef = React.useRef<HTMLDivElement | null>(null);
                        React.useEffect(() => {
                            const el = elRef.current;
                            if (!el) return;
                            el.style.top = String(item.top) + 'px';
                            el.style.height = String(Math.max(item.height, item.isEvent ? 24 : 32)) + 'px';
                            el.style.left = `calc(4rem + ${item.left}%)`;
                            el.style.width = `calc(${item.width}% - 1rem)`;
                        }, [item.top, item.height, item.left, item.width, item.isEvent]);

                        const getColors = (type: string) => {
                            switch (type) {
                                case 'google': return 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400';
                                case 'notion': return 'bg-gray-500/10 border-gray-500 text-gray-600 dark:text-gray-400';
                                case 'slack': return 'bg-green-500/10 border-green-500 text-green-600 dark:text-green-400';
                                default: return 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400';
                            }
                        };

                        return (
                            <div ref={elRef} key={item.id} className={`absolute rounded-lg border-l-4 p-2 shadow-sm overflow-hidden z-10 transition-all hover:z-30 cursor-pointer ${getColors(item.type)}`}>
                                <div className="flex items-center gap-1.5 min-w-0">
                                    {!item.isEvent && <div className={`w-1.5 h-1.5 rounded-full ${item.type === 'task' ? 'bg-purple-500' : 'bg-blue-500'}`} />}
                                    <p className="text-[10px] font-bold truncate">{item.title || item.summary}</p>
                                </div>
                                {item.height > 30 && (
                                    <div className="flex items-center gap-1 text-[9px] opacity-60 mt-0.5">
                                        <Clock size={8} />
                                        <span>{new Date(item.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                )}
                            </div>
                        );
                    };

                    return processed.map((item) => <CalendarItem key={item.id} item={item} />);
                })()}
            </div>
        </div>
    );
};
