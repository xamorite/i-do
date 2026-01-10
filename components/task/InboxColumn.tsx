import React from 'react';
import { Task } from '@/lib/types';
import { SortableTask } from '@/components/dnd/DragDropContainer';
import { TaskInput } from '@/components/task/TaskInput';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';

interface InboxColumnProps {
    tasks: Task[];
    searchQuery?: string;
    onAddTask: (val: { title: string, channel?: string, estimate?: number }) => void;
    onTaskClick: (task: Task) => void;
    onStatusToggle: (task: Task) => void;
    currentUserId?: string;
    onAction?: (task: Task, action: string) => void;
    userProfiles?: Record<string, any>;
}

export const InboxColumn: React.FC<InboxColumnProps> = ({
    tasks,
    searchQuery = '',
    onAddTask,
    onTaskClick,
    onStatusToggle,
    currentUserId,
    onAction,
    userProfiles
}) => {
    const { setNodeRef, isOver } = useDroppable({
        id: 'inbox-column',
        data: {
            type: 'InboxColumn',
        }
    });

    const displayTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div ref={setNodeRef} className={`flex flex-col w-full min-w-[300px] lg:w-80 flex-shrink-0 h-full bg-gradient-to-b from-purple-50/30 to-white dark:from-purple-950/10 dark:to-neutral-900 border-r border-dashed border-purple-200 dark:border-purple-800/30 transition-colors ${isOver ? 'bg-purple-100/50 dark:bg-purple-900/20' : ''}`}>
            {/* Header */}
            <div className="p-4 border-b border-purple-100 dark:border-purple-800/30">
                <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    Inbox
                </h3>
                <p className="text-sm text-gray-400 font-medium mt-1">Unplanned tasks</p>

                {/* Count & Progress */}
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                            {displayTasks.length} {displayTasks.length === 1 ? 'task' : 'tasks'}
                        </span>
                    </div>
                    <div className="h-1 w-full bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: displayTasks.length > 0 ? '100%' : '0%' }} />
                    </div>
                </div>
            </div>

            {/* Task List Section */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {/* Inline Add Task */}
                <div className="bg-white dark:bg-neutral-900 border border-purple-200 dark:border-purple-800/50 rounded-xl shadow-sm overflow-hidden focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 dark:focus-within:ring-purple-900/50 transition-all">
                    <TaskInput
                        onSubmit={onAddTask}
                        placeholder="Add to inbox..."
                    />
                </div>

                <SortableContext
                    items={displayTasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-3 min-h-[100px]">
                        {displayTasks.length === 0 ? (
                            <div className="text-center py-12 px-4">
                                <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                    Your inbox is empty
                                </p>
                                <p className="text-xs text-gray-400">
                                    Add tasks here and drag them to schedule for specific days
                                </p>
                            </div>
                        ) : (
                            displayTasks.map((task) => (
                                <SortableTask
                                    key={task.id}
                                    task={task}
                                    onTaskClick={onTaskClick}
                                    onStatusToggle={onStatusToggle}
                                    currentUserId={currentUserId}
                                    onAction={onAction}
                                    userProfiles={userProfiles}
                                />
                            ))
                        )}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
};
