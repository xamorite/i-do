import React from 'react';
import { useRouter } from 'next/navigation';
import { PanelRightClose, PanelRightOpen, Calendar as CalendarIcon } from 'lucide-react';
import { Task } from '@/lib/types';
import { SlackLogo, NotionLogo } from '@/components/ui/Logos';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { NotionDatabaseBrowser } from '@/components/integrations/NotionDatabaseBrowser';
import { importNotionPage } from '@/hooks/useNotion';

interface IntegrationSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    activeIntegration: string | null;
    onReferenceClick: (type: string) => void;
    selectedDate: Date;
    calendarEvents: any[];
    slackMessages: any[];
    tasks: Record<string, Task[]>;
    onLoadNotionTasks: () => void;
    onDragStart: (item: any) => void;
}

export const IntegrationSidebar: React.FC<IntegrationSidebarProps> = ({
    isOpen,
    onToggle,
    activeIntegration,
    onReferenceClick,
    selectedDate,
    calendarEvents,
    slackMessages,
    tasks,
    onLoadNotionTasks,
    onDragStart
}) => {
    const router = useRouter();

    if (!isOpen) return null;

    return (
        <div className={`border-l border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-all duration-300 flex flex-col ${isOpen ? 'w-80' : 'w-0 opacity-0 overflow-hidden'}`}>
            {/* Integration Tabs (Right Rail) */}
            <div className="flex items-center border-b border-gray-100 dark:border-neutral-800">
                <button
                    onClick={() => onReferenceClick('google-calendar')}
                    className={`flex-1 p-3 flex justify-center hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors border-b-2 ${activeIntegration === 'google-calendar' ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/10' : 'border-transparent'}`}
                    title="Calendar"
                >
                    <CalendarIcon size={18} className={activeIntegration === 'google-calendar' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'} />
                </button>
                <button
                    onClick={() => onReferenceClick('slack')}
                    className={`flex-1 p-3 flex justify-center hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors border-b-2 ${activeIntegration === 'slack' ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/10' : 'border-transparent'}`}
                    title="Slack"
                >
                    <SlackLogo size={18} className={activeIntegration === 'slack' ? 'opacity-100' : 'opacity-50 grayscale'} />
                </button>
                <button
                    onClick={() => onReferenceClick('notion')}
                    className={`flex-1 p-3 flex justify-center hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors border-b-2 ${activeIntegration === 'notion' ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/10' : 'border-transparent'}`}
                    title="Notion"
                >
                    <NotionLogo size={18} className={activeIntegration === 'notion' ? 'opacity-100' : 'opacity-50 grayscale'} />
                </button>
            </div>

            {/* Integration Content */}
            <div className="flex-1 overflow-hidden flex flex-col relative">
                {!activeIntegration && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-4">
                            <PanelRightOpen size={24} className="opacity-50" />
                        </div>
                        <p className="text-sm">Select an app above to view your integrations</p>
                    </div>
                )}

                {activeIntegration === 'google-calendar' ? (
                    <div className="flex-1 flex flex-col overflow-hidden h-full">
                        <div className="p-4 border-b border-gray-100 dark:border-neutral-800">
                            <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <CalendarIcon size={20} className="text-blue-500" />
                                Calendar
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <div className="space-y-3">
                                {calendarEvents.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 text-xs">No events today</div>
                                ) : (
                                    calendarEvents.map(event => (
                                        <div
                                            key={event.id}
                                            draggable
                                            onDragStart={() => onDragStart({ type: 'calendar-event', event })}
                                            className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800/50 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative overflow-hidden"
                                        >
                                            <div className="flex justify-between items-start mb-1 relative z-10">
                                                <span className="font-bold text-blue-700 dark:text-blue-300 text-xs">
                                                    {event.startTime
                                                        ? new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                        : event.plannedDate
                                                            ? 'All Day'
                                                            : 'N/A'}
                                                </span>
                                                {event.organizer && (
                                                    <span className="text-[10px] bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400">
                                                        Meeting
                                                    </span>
                                                )}
                                            </div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm leading-tight mb-1 relative z-10">
                                                {event.title}
                                            </p>
                                            {event.attendees && (
                                                <div className="flex -space-x-1 relative z-10 mt-2">
                                                    {event.attendees.slice(0, 3).map((a: any, i: number) => (
                                                        <div key={i} className="w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-700 border border-white dark:border-neutral-900 flex items-center justify-center text-[8px] text-blue-800 dark:text-blue-200 font-bold uppercase">
                                                            {a.email[0]}
                                                        </div>
                                                    ))}
                                                    {event.attendees.length > 3 && (
                                                        <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-neutral-800 border border-white dark:border-neutral-900 flex items-center justify-center text-[8px] text-gray-500">
                                                            +{event.attendees.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div className="absolute inset-0 border-2 border-blue-500 opacity-0 group-hover:opacity-10 rounded-xl transition-opacity" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                ) : activeIntegration === 'slack' ? (
                    <div className="flex-1 flex flex-col overflow-hidden h-full">
                        <div className="p-4 border-b border-gray-100 dark:border-neutral-800">
                            <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <SlackLogo size={20} />
                                Slack
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {slackMessages.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-xs">No saved messages</div>
                            ) : (
                                slackMessages.map((msg, i) => (
                                    <div
                                        key={i}
                                        draggable
                                        onDragStart={() => onDragStart({ type: 'slack-message', message: msg })}
                                        className="mb-3 bg-white dark:bg-neutral-800 p-3 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-5 h-5 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-[10px] font-bold text-purple-700 dark:text-purple-300">
                                                {msg.user[0]}
                                            </div>
                                            <span className="text-xs font-bold text-gray-900 dark:text-gray-100 flex-1">{msg.user}</span>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(msg.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">
                                            {msg.title}
                                        </p>
                                        <div className="absolute inset-0 border-2 border-purple-500 opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity" />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : activeIntegration === 'notion' ? (
                    <div className="flex-1 flex flex-col overflow-hidden h-full">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-800">
                            <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <NotionLogo size={20} />
                                Notion
                            </h2>
                            <button
                                onClick={() => router.push('/settings')}
                                className="px-3 py-1 bg-gray-100 dark:bg-neutral-800 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                            >
                                Settings
                            </button>
                        </div>

                        {/* Database Browser */}
                        <div className="flex-1 overflow-hidden p-4">
                            <NotionDatabaseBrowser
                                onPageSelect={async (page, dbId) => {
                                    const task = await importNotionPage(page.id, dbId, selectedDate.toISOString().split('T')[0]);
                                    if (task) onLoadNotionTasks();
                                }}
                                onPageDragStart={(page, dbId) => {
                                    onDragStart({ type: 'notion-page', page, databaseId: dbId });
                                }}
                            />
                        </div>

                        {/* Synced Tasks Summary */}
                        <div className="border-t border-gray-100 dark:border-neutral-800 p-4 bg-gray-50/50 dark:bg-neutral-900/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Synced Tasks</span>
                                <span className="text-[10px] font-bold text-purple-600">{Object.values(tasks).flat().filter(t => t.originalIntegration === 'notion').length}</span>
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                                {Object.values(tasks).flat().filter(t => t.originalIntegration === 'notion').slice(0, 5).map((t: Task) => (
                                    <div key={t.id} className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                        • {t.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};
