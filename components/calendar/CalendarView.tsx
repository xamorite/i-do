"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    Plus
} from 'lucide-react';
import { WeeklyCalendar } from './WeeklyCalendar';
import { MonthlyCalendar } from './MonthlyCalendar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchTasks } from '@/hooks/useTasks';
import { fetchCalendarEvents } from '@/hooks/useCalendarSync';
import { Task } from '@/lib/types';

export const CalendarView: React.FC = () => {
    useAuth();
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'week' | 'month'>('week');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [events, setEvents] = useState<Array<Record<string, unknown>>>([]);
    const [visibleSources, setVisibleSources] = useState<Set<string>>(new Set(['google', 'notion', 'slack', 'task']));

    const toggleSource = (source: string) => {
        setVisibleSources(prev => {
            const next = new Set(prev);
            if (next.has(source)) next.delete(source);
            else next.add(source);
            return next;
        });
    };

    const loadData = useCallback(async () => {
        try {
            let start: string;
            let end: string;

            if (view === 'week') {
                const monday = new Date(currentDate);
                const day = monday.getDay();
                const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
                monday.setDate(diff);
                monday.setHours(0, 0, 0, 0);

                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                sunday.setHours(23, 59, 59, 999);

                start = monday.toISOString();
                end = sunday.toISOString();
            } else {
                const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const startDay = monthStart.getDay();
                const gridStart = new Date(monthStart);
                gridStart.setDate(gridStart.getDate() - (startDay === 0 ? 6 : startDay - 1));
                gridStart.setHours(0, 0, 0, 0);

                const gridEnd = new Date(gridStart);
                gridEnd.setDate(gridStart.getDate() + 41);
                gridEnd.setHours(23, 59, 59, 999);

                start = gridStart.toISOString();
                end = gridEnd.toISOString();
            }

            const [tasksData, eventsData] = await Promise.all([
                fetchTasks(`startDate=${start.split('T')[0]}&endDate=${end.split('T')[0]}`),
                fetchCalendarEvents(start, end)
            ]);

            setTasks(tasksData.tasks || []);
            setEvents(eventsData || []);
        } catch (err) {
            console.error('Failed to load calendar data:', err);
        }
    }, [currentDate, view]);

    useEffect(() => {
        // defer to next microtask to avoid synchronous setState within effect
        Promise.resolve().then(() => void loadData());
    }, [loadData]);

    const navigate = (direction: number) => {
        const nextDate = new Date(currentDate);
        if (view === 'week') {
            nextDate.setDate(currentDate.getDate() + (direction * 7));
        } else {
            nextDate.setMonth(currentDate.getMonth() + direction);
        }
        setCurrentDate(nextDate);
    };

    const title = currentDate.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
        ...(view === 'week' ? { day: 'numeric' } : {})
    });

    const getEventSource = (e: Record<string, unknown>) => {
        type EventLike = { type?: string; originalIntegration?: string };
        const ev = e as EventLike;
        if (ev.type && typeof ev.type === 'string') return ev.type;
        if (ev.originalIntegration && typeof ev.originalIntegration === 'string') return ev.originalIntegration.split('-')[0];
        return 'google';
    };

    return (
        <div className="flex flex-col h-full bg-[#FAF9F6] dark:bg-neutral-950 overflow-hidden">
            {/* Header */}
            <header className="h-16 border-b border-gray-100 dark:border-neutral-900 bg-white dark:bg-neutral-900 px-6 flex items-center justify-between z-20">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl transition-all text-gray-500 hover:text-purple-600"
                        title="Back to Dashboard"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-black text-gray-900 dark:text-gray-100 min-w-[200px]">
                            {title}
                        </h1>
                        <div className="flex items-center bg-gray-100 dark:bg-neutral-800 rounded-full p-1 shadow-inner">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-1.5 hover:bg-white dark:hover:bg-neutral-700 rounded-full transition-all hover:shadow-sm"
                                title="Previous"
                                aria-label="Previous"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date())}
                                className="px-3 text-xs font-bold hover:text-purple-600 transition-colors"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => navigate(1)}
                                className="p-1.5 hover:bg-white dark:hover:bg-neutral-700 rounded-full transition-all hover:shadow-sm"
                                title="Next"
                                aria-label="Next"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-gray-100 dark:bg-neutral-800 mx-2" />

                    <div className="flex items-center bg-gray-50 dark:bg-neutral-800 rounded-xl p-1 border border-gray-100 dark:border-neutral-700 shadow-sm">
                        <button
                            onClick={() => setView('week')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'week'
                                ? 'bg-white dark:bg-neutral-700 text-purple-600 dark:text-purple-400 shadow-sm border border-gray-100 dark:border-neutral-600'
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                            title="Switch to week view"
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setView('month')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'month'
                                ? 'bg-white dark:bg-neutral-700 text-purple-600 dark:text-purple-400 shadow-sm border border-gray-100 dark:border-neutral-600'
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                            title="Switch to month view"
                        >
                            Month
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search events..."
                            className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 w-64 transition-all"
                        />
                    </div>
                    <button className="p-2.5 bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-xl text-gray-500 hover:text-purple-600 transition-all hover:shadow-md" title="Filter events" aria-label="Filter events">
                        <Filter size={18} />
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Mini-Rail / Task Preview */}
                <aside className="w-64 border-r border-gray-100 dark:border-neutral-900 bg-white dark:bg-neutral-900 p-6 hidden xl:flex xl:flex-col xl:gap-8">
                    <button className="flex items-center justify-center gap-2 w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-purple-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0">
                        <Plus size={18} />
                        Add Event
                    </button>

                    <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">My Calendars</h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 group cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={visibleSources.has('google')}
                                    onChange={() => toggleSource('google')}
                                    className="w-4 h-4 rounded-md border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                />
                                <span className="text-sm font-bold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">Google Calendar</span>
                                <div className="w-2 h-2 rounded-full bg-red-500 ml-auto" />
                            </label>
                            <label className="flex items-center gap-3 group cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={visibleSources.has('notion')}
                                    onChange={() => toggleSource('notion')}
                                    className="w-4 h-4 rounded-md border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                />
                                <span className="text-sm font-bold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">Notion Tasks</span>
                                <div className="w-2 h-2 rounded-full bg-gray-500 ml-auto" />
                            </label>
                            <label className="flex items-center gap-3 group cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={visibleSources.has('slack')}
                                    onChange={() => toggleSource('slack')}
                                    className="w-4 h-4 rounded-md border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                />
                                <span className="text-sm font-bold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">Slack Reminders</span>
                                <div className="w-2 h-2 rounded-full bg-green-500 ml-auto" />
                            </label>
                            <label className="flex items-center gap-3 group cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={visibleSources.has('task')}
                                    onChange={() => toggleSource('task')}
                                    className="w-4 h-4 rounded-md border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                />
                                <span className="text-sm font-bold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">Local Tasks</span>
                                <div className="w-2 h-2 rounded-full bg-purple-500 ml-auto" />
                            </label>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col relative overflow-hidden bg-white dark:bg-neutral-900">
                    {view === 'week' ? (
                        <WeeklyCalendar
                            date={currentDate}
                            events={events.filter((e: Record<string, unknown>) => visibleSources.has(getEventSource(e)))}
                            tasks={visibleSources.has('task') ? tasks : []}
                        />
                    ) : (
                        <MonthlyCalendar
                            date={currentDate}
                            events={events.filter((e: Record<string, unknown>) => visibleSources.has(getEventSource(e)))}
                            tasks={visibleSources.has('task') ? tasks : []}
                        />
                    )}
                </main>
            </div>
        </div>
    );
};
