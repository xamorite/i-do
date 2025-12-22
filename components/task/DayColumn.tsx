"use client";
/* eslint-disable */

import React from 'react';
import { Task } from '@/lib/types';
import { SortableTask } from '@/components/dnd/DragDropContainer';
import { TaskInput } from '@/components/task/TaskInput';
import { Plus } from 'lucide-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';

interface DayColumnProps {
    date: Date;
    tasks: Task[];
    searchQuery?: string;
    onAddTask: (val: { title: string, channel?: string, estimate?: number, date?: Date }) => void;
    onReorder: (newTasks: Task[]) => void;
    onTaskClick: (task: Task) => void;
    onStatusToggle: (task: Task) => void;
}

export const DayColumn: React.FC<DayColumnProps> = ({
    date,
    tasks,
    searchQuery = '',
    onAddTask,
    onReorder,
    onTaskClick,
    onStatusToggle
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

    return (
        <div ref={setNodeRef} className={`flex flex-col w-80 h-full bg-white dark:bg-neutral-900 border-r border-gray-100 dark:border-neutral-800 transition-colors ${isOver ? 'bg-purple-50/50 dark:bg-purple-900/5' : ''}`}>
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
                            />
                        ))}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
};
