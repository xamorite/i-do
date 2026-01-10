"use client";

import React from 'react';
import { Plus, Search, Layout, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { UserMenu } from '@/components/layout/UserMenu';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

interface DashboardHeaderProps {
    greetingName: string;
    username: string | null;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onNewTaskClick: () => void;
    onMobileMenuClick: () => void;
    isRightPaneOpen: boolean;
    onToggleRightPane: () => void;
    onOpenPartners: () => void;
    onNotificationSelect: (taskId: string) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    greetingName,
    username,
    searchQuery,
    onSearchChange,
    onNewTaskClick,
    onMobileMenuClick,
    isRightPaneOpen,
    onToggleRightPane,
    onOpenPartners,
    onNotificationSelect,
}) => {
    return (
        <header className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-30 transition-all">
            <div className="flex items-center space-x-4">
                {/* Mobile Hamburger */}
                <button
                    onClick={onMobileMenuClick}
                    className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                    <Layout size={20} />
                </button>

                <div className="flex items-center gap-3">
                    <h1 className="text-lg lg:text-xl font-black flex items-center gap-2">
                        <span className="bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent truncate max-w-[150px] lg:max-w-none">
                            Hey {greetingName}
                        </span>
                        {username && (
                            <span className="text-[9px] font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded uppercase tracking-widest leading-none">
                                @{username}
                            </span>
                        )}
                        <span>👋</span>
                    </h1>
                </div>
            </div>

            <div className="flex items-center space-x-2 lg:space-x-4">
                <button
                    onClick={onNewTaskClick}
                    className="flex items-center gap-2 bg-linear-to-r from-purple-600 to-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity shadow-sm shadow-purple-500/20"
                >
                    <Plus size={16} />
                    <span className="hidden sm:inline">New Task</span>
                </button>

                <div className="hidden sm:block cursor-pointer relative xl:block">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 pr-4 py-1.5 bg-gray-50 dark:bg-neutral-900 border-none rounded-full text-xs font-bold focus:ring-2 focus:ring-purple-500 transition-all w-32 sm:w-48"
                    />
                </div>

                <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block" />

                <NotificationCenter onSelectTask={onNotificationSelect} />

                <button
                    onClick={onToggleRightPane}
                    className={`p-2 rounded-lg transition-all ${isRightPaneOpen ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800'}`}
                    title={isRightPaneOpen ? 'Close right pane' : 'Open right pane'}
                >
                    {isRightPaneOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                </button>

                <UserMenu onOpenPartners={onOpenPartners} />
            </div>
        </header>
    );
};
