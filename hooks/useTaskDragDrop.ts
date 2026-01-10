import { useState } from 'react';
import {
    useSensor,
    useSensors,
    PointerSensor,
    KeyboardSensor,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Task } from '@/lib/types';
import { importNotionPage } from '@/hooks/useNotion';

export function useTaskDragDrop(
    handleTaskUpdate: (id: string, updates: Partial<Task>, dateStr?: string) => Promise<void>,
    loadNotionTasks: () => Promise<void>,
    onTaskCreate: (task: { title: string, date?: Date, startTime?: string, endTime?: string, isTimeboxed?: boolean }) => Promise<void>
) {
    const [activeDragItem, setActiveDragItem] = useState<any | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const data = active.data.current;
        setActiveDragItem(data || null);
    };

    const handleDragOver = (event: DragOverEvent) => {
        // Cross-column sorting logic if needed here
        // Currently dnd-kit handle this within SortableContext if provided
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragItem(null);
        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        // If dragging an existing internal task
        if (activeData?.type === 'Task') {
            const activeTask = activeData.task as Task;

            // Drop on Calendar Slot -> timebox
            if (overData?.type === 'CalendarSlot') {
                const { hour, date } = overData;
                const plannedDate = date.toISOString().split('T')[0];
                const startTime = new Date(date);
                startTime.setHours(hour, 0, 0, 0);
                const endTime = new Date(startTime);
                endTime.setHours(hour + 1);

                await handleTaskUpdate(activeTask.id, {
                    plannedDate,
                    status: 'planned',
                    isTimeboxed: true,
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                }, activeTask.plannedDate || '');
                return;
            }

            // Drop on Day column -> schedule task for that day
            if (overData?.type === 'DayColumn') {
                const newDate = overData.date.toISOString().split('T')[0];
                if (activeTask.plannedDate !== newDate) {
                    await handleTaskUpdate(activeTask.id, {
                        plannedDate: newDate,
                        status: 'planned'
                    }, activeTask.plannedDate || '');
                }
                return;
            }

            // Drop on Inbox column -> unschedule task
            if (overData?.type === 'InboxColumn') {
                await handleTaskUpdate(activeTask.id, {
                    plannedDate: '',
                    status: 'inbox',
                    isTimeboxed: false,
                    startTime: '',
                    endTime: ''
                }, activeTask.plannedDate || '');
                return;
            }

            return;
        }

        // If dragging a Notion page (from Sidebar)
        if (activeData?.type === 'notion-page' || activeData?.type === 'NotionPage') {
            const { page, databaseId } = activeData;

            // Drop on Calendar Slot -> import and timebox
            if (overData?.type === 'CalendarSlot') {
                const { hour, date } = overData;
                const plannedDateTime = new Date(date);
                plannedDateTime.setHours(hour, 0, 0, 0);

                try {
                    const created = await importNotionPage(page.id, databaseId, plannedDateTime.toISOString());
                    if (created) await loadNotionTasks();
                } catch (err) {
                    console.error('Failed to import Notion page:', err);
                }
                return;
            }

            // Drop on Day column -> import without time
            if (overData?.type === 'DayColumn') {
                const newDate = overData.date.toISOString().split('T')[0];
                try {
                    const created = await importNotionPage(page.id, databaseId, newDate);
                    if (created) await loadNotionTasks();
                } catch (err) {
                    console.error('Failed to import Notion page:', err);
                }
                return;
            }

            // Drop on Inbox -> import as inbox task
            if (overData?.type === 'InboxColumn') {
                try {
                    // Import without planned date (will go to inbox)
                    const created = await importNotionPage(page.id, databaseId);
                    if (created) await loadNotionTasks();
                } catch (err) {
                    console.error('Failed to import Notion page:', err);
                }
                return;
            }
        }

        // If dragging a Calendar Event
        if (activeData?.type === 'calendar-event') {
            const { event } = activeData;

            // Drop on Day Column or Calendar Slot -> create task with time info
            if (overData?.type === 'DayColumn' || overData?.type === 'CalendarSlot') {
                let targetDate: Date;
                let startTime: string | undefined;
                let endTime: string | undefined;
                let isTimeboxed = false;

                if (overData.type === 'CalendarSlot') {
                    targetDate = new Date(overData.date);
                    targetDate.setHours(overData.hour, 0, 0, 0);

                    startTime = targetDate.toISOString();
                    const end = new Date(targetDate);
                    end.setHours(overData.hour + 1);
                    endTime = end.toISOString();
                    isTimeboxed = true;
                } else {
                    targetDate = new Date(overData.date);

                    // Try to preserve original times if dragging to a new day
                    if (event.startTime) {
                        const origStart = new Date(event.startTime);
                        const newStart = new Date(targetDate);
                        newStart.setHours(origStart.getHours(), origStart.getMinutes());
                        startTime = newStart.toISOString();

                        if (event.endTime) {
                            const origEnd = new Date(event.endTime);
                            const newEnd = new Date(targetDate);
                            newEnd.setHours(origEnd.getHours(), origEnd.getMinutes());
                            endTime = newEnd.toISOString();
                        }
                        isTimeboxed = true;
                    }
                }

                await onTaskCreate({
                    title: event.title,
                    date: targetDate,
                    startTime,
                    endTime,
                    isTimeboxed
                });
            }

            // Drop on Inbox -> create inbox task
            if (overData?.type === 'InboxColumn') {
                await onTaskCreate({
                    title: event.title,
                    // No date, no time -> Inbox
                });
            }
        }
    };

    return {
        activeDragItem,
        setActiveDragItem,
        sensors,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
    };
}
