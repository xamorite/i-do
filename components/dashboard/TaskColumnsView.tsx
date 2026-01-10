import React from 'react';
import { Task } from '@/lib/types';
import { DayColumn } from '@/components/task/DayColumn';
import { InboxColumn } from '@/components/task/InboxColumn';
import { WeeklyCalendar } from '@/components/calendar/WeeklyCalendar';
import { MonthlyCalendar } from '@/components/calendar/MonthlyCalendar';

interface TaskColumnsViewProps {
    currentView: string;
    selectedDate: Date;
    datesToShow: Date[];
    tasks: Record<string, Task[]>;
    visibleSources: Set<string>;
    searchQuery: string;
    calendarEvents: any[];
    user: any;
    onAddTask: (val: { title: string, channel?: string, estimate?: number, date?: Date }) => void;
    onReorder: (newTasks: Task[], dateStr: string) => void;
    onTaskClick: (task: Task) => void;
    onTaskUpdate: (id: string, updates: Partial<Task>, dateStr?: string) => void;
    onAction: (task: Task, action: string) => void;
    userProfiles?: Record<string, any>;
}

export const TaskColumnsView: React.FC<TaskColumnsViewProps> = ({
    currentView,
    selectedDate,
    datesToShow,
    tasks,
    visibleSources,
    searchQuery,
    calendarEvents,
    user,
    onAddTask,
    onReorder,
    onTaskClick,
    onTaskUpdate,
    onAction,
    userProfiles
}) => {
    return (
        <section className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-neutral-900 border-l border-gray-100 dark:border-neutral-900">
            {/* View Header with Date */}
            <div className="px-4 lg:px-8 py-4 lg:py-6 border-b border-gray-50 dark:border-neutral-800/50 flex items-center justify-between">
                <h2 className="text-lg lg:text-xl font-black text-gray-900 dark:text-gray-100">
                    {currentView === 'month'
                        ? selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                        : selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </h2>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                {currentView === 'home' || currentView === 'today' ? (
                    <div className="flex-1 flex overflow-x-auto custom-scrollbar snap-x snap-mandatory lg:snap-none">
                        {/* Inbox Column - Only in home view */}
                        {currentView === 'home' && (
                            <div className="snap-center h-full flex-shrink-0 w-full lg:w-auto">
                                <InboxColumn
                                    tasks={(tasks['inbox'] || []).filter(t => {
                                        const source = t.originalIntegration?.split('-')[0] || 'task';
                                        return visibleSources.has(source);
                                    })}
                                    searchQuery={searchQuery}
                                    onAddTask={(val) => onAddTask({ ...val, date: undefined })}
                                    onTaskClick={onTaskClick}
                                    onStatusToggle={(t) => onTaskUpdate(t.id, { status: t.status === 'done' ? 'inbox' : 'done' })}
                                    currentUserId={user?.uid}
                                    onAction={onAction}
                                    userProfiles={userProfiles}
                                />
                            </div>
                        )}

                        {/* Day Columns */}
                        {datesToShow.map((d) => {
                            const dStr = d.toISOString().split('T')[0];
                            return (
                                <div key={dStr} className="snap-center h-full flex-shrink-0 w-full lg:w-auto">
                                    <DayColumn
                                        date={d}
                                        tasks={(tasks[dStr] || []).filter(t => {
                                            const source = t.originalIntegration?.split('-')[0] || 'task';
                                            return visibleSources.has(source);
                                        })}
                                        searchQuery={searchQuery}
                                        onAddTask={onAddTask}
                                        onReorder={(newTasks) => onReorder(newTasks, dStr)}
                                        onTaskClick={onTaskClick}
                                        onStatusToggle={(t) => onTaskUpdate(t.id, { status: t.status === 'done' ? 'planned' : 'done' }, dStr)}
                                        currentUserId={user?.uid}
                                        onAction={onAction}
                                        userProfiles={userProfiles}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ) : currentView === 'week' ? (
                    <div className="flex-1 overflow-auto">
                        <WeeklyCalendar
                            date={selectedDate}
                            events={calendarEvents.filter(e => visibleSources.has(e.type || e.originalIntegration?.split('-')[0] || 'google'))}
                            tasks={Object.values(tasks).flat().filter(t => {
                                const source = t.originalIntegration?.split('-')[0] || 'task';
                                return visibleSources.has(source);
                            })}
                        />
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto">
                        <MonthlyCalendar
                            date={selectedDate}
                            events={calendarEvents.filter(e => visibleSources.has(e.type || e.originalIntegration?.split('-')[0] || 'google'))}
                            tasks={Object.values(tasks).flat().filter(t => {
                                const source = t.originalIntegration?.split('-')[0] || 'task';
                                return visibleSources.has(source);
                            })}
                        />
                    </div>
                )}
            </div>
        </section>
    );
};
