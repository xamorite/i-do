"use client";
/* eslint-disable */

import React from 'react';
import { Task } from '@/lib/types';
import { SortableTask } from '@/components/dnd/DragDropContainer';
import { TaskInput } from '@/components/task/TaskInput';
import { Plus } from 'lucide-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { getCategoryStyles } from '@/lib/constants';

interface DayColumnProps {
    date: Date;
    tasks: Task[];
    searchQuery?: string;
    onAddTask: (val: { title: string, channel?: string, estimate?: number, date?: Date }) => void;
    onReorder: (newTasks: Task[]) => void;
    onTaskClick: (task: Task) => void;
    onStatusToggle: (task: Task) => void;
    currentUserId?: string;
    onAction?: (task: Task, action: string) => void;
    userProfiles?: Record<string, any>;
}

export const DayColumn: React.FC<DayColumnProps> = ({
    date,
    tasks,
    searchQuery = '',
    onAddTask,
    onReorder,
    onTaskClick,
    onStatusToggle,
    currentUserId,
    onAction,
    userProfiles
}) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `column-${date.toISOString().split('T')[0]}`,
        data: {
            type: 'DayColumn',
            date,
        }
    });

    const isToday = new Date().toDateString() === date.toDateString();
    const dayName = date.toLocaleDateString(undefined, { weekday: 'long' });
    const dateFormatted = date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

    const totalPlannedMinutes = tasks.reduce((acc, t) => acc + (t.estimateMinutes || 0), 0);
    const completedMinutes = tasks.filter(t => t.status === 'done').reduce((acc, t) => acc + (t.estimateMinutes || 0), 0);
    const progress = tasks.length > 0 ? (completedMinutes / totalPlannedMinutes) * 100 : 0;

    const hours = Math.floor(totalPlannedMinutes / 60);
    const minutes = totalPlannedMinutes % 60;

    const displayTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Category distribution
    const categoryCounts: Record<string, number> = {};
    displayTasks.forEach(t => {
        const cat = t.channel || 'default';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const categoryStats = Object.entries(categoryCounts).map(([cat, count]) => ({
        cat,
        percent: (count / displayTasks.length) * 100,
        style: getCategoryStyles(cat === 'default' ? undefined : cat)
    })).sort((a, b) => b.percent - a.percent);

    return (
        <div ref={setNodeRef} className={`flex flex-col w-full min-w-[300px] lg:w-80 flex-shrink-0 h-full bg-white dark:bg-neutral-900 border-r border-gray-100 dark:border-neutral-800 transition-colors ${isOver ? 'bg-purple-50/50 dark:bg-purple-900/5' : ''}`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-50 dark:border-neutral-800/50">
                <h3 className={`text-xl font-bold ${isToday ? 'text-purple-600' : 'text-gray-900 dark:text-gray-100'}`}>
                    {dayName}
                </h3>
                <p className="text-sm text-gray-400 font-medium">{dateFormatted}</p>

                {/* Progress Bar */}
                <div className="mt-4 h-1.5 w-full bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div ref={(el) => { if (el) el.style.width = `${progress}%`; }} className="h-full bg-purple-500 transition-all duration-500" />
                </div>

                {/* Category Distribution Bar */}
                {displayTasks.length > 0 && (
                    <div className="mt-2 flex h-1 w-full rounded-full overflow-hidden opacity-60">
                        {categoryStats.map(stat => (
                            <div
                                key={stat.cat}
                                style={{ width: `${stat.percent}%` }}
                                className={stat.style.color.replace('text-', 'bg-')}
                                title={`${stat.style.label}: ${Math.round(stat.percent)}%`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Task List Section */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Inline Add Task */}
                <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden focus-within:border-purple-300 transition-all">
                    <TaskInput
                        onSubmit={onAddTask}
                        initialDate={date}
                        placeholder="Add task"
                    />
                </div>

                <SortableContext
                    items={displayTasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-3 min-h-[100px]">
                        {displayTasks.map((task) => (
                            <SortableTask
                                key={task.id}
                                task={task}
                                onTaskClick={onTaskClick}
                                onStatusToggle={onStatusToggle}
                                currentUserId={currentUserId}
                                onAction={onAction}
                                userProfiles={userProfiles}
                            />
                        ))}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
};
