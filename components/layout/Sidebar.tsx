"use client";

import React from 'react';
import { ChevronLeft, ChevronRight, Zap, Filter, X } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date;
    changeDate: (direction: number) => void;
    setSelectedDate: (date: Date) => void;
    currentView: 'home' | 'today' | 'week' | 'month';
    setCurrentView: (view: any) => void;
    setIsPlanningOpen: (open: boolean) => void;
    visibleSources: Set<string>;
    toggleSource: (source: string) => void;
    inboxCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    onClose,
    selectedDate,
    changeDate,
    setSelectedDate,
    currentView,
    setCurrentView,
    setIsPlanningOpen,
    visibleSources,
    toggleSource,
    inboxCount = 0
}) => {
    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white dark:bg-neutral-900 border-r border-gray-100 dark:border-neutral-900
        flex flex-col p-4 space-y-6 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                {/* Mobile Header with Close Button */}
                <div className="flex items-center justify-between mb-4 px-2 lg:mb-4">
                    <div className="flex items-center gap-2">
                        <img src="https://img.icons8.com/nolan/64/reminders.png" alt="logo" className="w-6 h-6" />
                        <span className="font-bold text-sm tracking-tight text-gray-500">DailyExpress</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-3 space-y-4">
                    {/* Date Navigation */}
                    <div className="flex items-center bg-gray-50 dark:bg-neutral-800/50 rounded-xl p-1 border border-gray-100 dark:border-neutral-800 shadow-inner">
                        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white dark:hover:bg-neutral-700 rounded-lg transition-all text-gray-400 hover:text-purple-600" title="Previous day" aria-label="Previous day">
                            <ChevronLeft size={16} />
                        </button>
                        <button onClick={() => setSelectedDate(new Date())} className="flex-1 text-[10px] font-black hover:text-purple-600 transition-colors uppercase tracking-widest text-gray-500">
                            Today
                        </button>
                        <button onClick={() => changeDate(1)} className="p-2 hover:bg-white dark:hover:bg-neutral-700 rounded-lg transition-all text-gray-400 hover:text-purple-600" title="Next day" aria-label="Next day">
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* View Switcher */}
                    <div className="flex items-center bg-gray-50 dark:bg-neutral-800/50 rounded-xl p-1 border border-gray-100 dark:border-neutral-800 shadow-inner">
                        {[
                            { id: 'home', label: 'Day' },
                            { id: 'week', label: 'Week' },
                            { id: 'month', label: 'Month' }
                        ].map((v) => (
                            <button
                                key={v.id}
                                onClick={() => {
                                    setCurrentView(v.id);
                                    if (window.innerWidth < 1024) onClose();
                                }}
                                className={`flex-1 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-widest transition-all ${currentView.includes(v.id) || (v.id === 'home' && currentView === 'today')
                                    ? 'bg-white dark:bg-neutral-700 text-purple-600 shadow-md ring-1 ring-black/5'
                                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'
                                    }`}
                            >
                                {v.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Inbox Indicator */}
                <div className="px-3">
                    <button
                        onClick={() => {
                            setCurrentView('home');
                            if (window.innerWidth < 1024) onClose();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all font-bold text-xs"
                    >
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <span>INBOX</span>
                        </div>
                        {inboxCount > 0 && (
                            <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                                {inboxCount}
                            </span>
                        )}
                    </button>
                </div>

                <div className="px-3">
                    <button
                        onClick={() => {
                            setIsPlanningOpen(true);
                            if (window.innerWidth < 1024) onClose();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-gray-800 to-gray-900 dark:from-neutral-800 dark:to-neutral-900 text-white rounded-xl hover:shadow-lg transition-all font-black text-[11px] active:scale-[0.98] uppercase tracking-widest border border-gray-700/50"
                    >
                        <Zap size={14} fill="currentColor" className="text-yellow-400" />
                        <span>Plan Day</span>
                    </button>
                </div>

                <div className="mt-8 space-y-4">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3">Visibility</h3>
                    <div className="space-y-1">
                        {['google', 'notion', 'slack', 'task'].map(s => {
                            const colors: Record<string, string> = {
                                google: 'text-red-500 bg-red-50 dark:bg-red-900/10',
                                notion: 'text-gray-500 bg-gray-50 dark:bg-neutral-800',
                                slack: 'text-green-500 bg-green-50 dark:bg-green-900/10',
                                task: 'text-purple-500 bg-purple-50 dark:bg-purple-900/10'
                            };
                            return (
                                <button
                                    key={s}
                                    onClick={() => s !== 'slack' && toggleSource(s)}
                                    disabled={s === 'slack'}
                                    title={s === 'slack' ? 'Coming Soon' : ''}
                                    className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${visibleSources.has(s)
                                        ? `${colors[s]} shadow-sm border border-gray-100 dark:border-neutral-700`
                                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                        } ${s === 'slack' ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                >
                                    <Filter size={12} />
                                    {s}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-8 space-y-4">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3">Day</h3>
                    <div className="space-y-1">
                        {['Daily planning', 'Daily shutdown', 'Daily highlights'].map((r) => (
                            <button key={r} className="sunsama-sidebar-btn w-full text-left px-3 py-1.5 text-sm font-semibold text-gray-500 hover:text-purple-600 transition-colors capitalize">
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
            </aside>
        </>
    );
};
