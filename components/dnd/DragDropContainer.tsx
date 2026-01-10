"use client";
/* eslint-disable */

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/lib/types';
import { TaskCard } from '@/components/task/TaskCard';

interface DragDropContainerProps {
  tasks: Task[];
  onReorder: (newTasks: Task[]) => void;
  onTaskClick?: (task: Task) => void;
  onStatusToggle?: (task: Task) => void;
}

interface SortableTaskProps {
  task: Task;
  onTaskClick?: (task: Task) => void;
  onStatusToggle?: (task: Task) => void;
  currentUserId?: string;
  onAction?: (task: Task, action: string) => void;
  userProfiles?: Record<string, any>;
}

export const SortableTask: React.FC<SortableTaskProps> = ({ task, onTaskClick, onStatusToggle, currentUserId, onAction, userProfiles }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    }
  });

  const elRef = React.useRef<HTMLDivElement | null>(null);
  const combinedRef = React.useCallback((node: HTMLDivElement | null) => {
    setNodeRef(node);
    elRef.current = node;
  }, [setNodeRef]);

  React.useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    el.style.transform = CSS.Transform.toString(transform) || '';
    if (transition) el.style.transition = transition as string;
    el.style.zIndex = isDragging ? '10' : '0';
    el.style.opacity = isDragging ? '0.3' : '1';
  }, [transform, transition, isDragging]);

  return (
    <div ref={combinedRef} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        onClick={onTaskClick}
        onStatusToggle={onStatusToggle}
        currentUserId={currentUserId}
        onAction={onAction}
        userProfiles={userProfiles}
      />
    </div>
  );
};

export const DragDropContainer: React.FC<DragDropContainerProps> = ({
  tasks,
  onReorder,
  onTaskClick,
  onStatusToggle
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Avoid accidental drags when clicking
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over?.id);

      onReorder(arrayMove(tasks, oldIndex, newIndex));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {tasks.map((task) => (
            <SortableTask
              key={task.id}
              task={task}
              onTaskClick={onTaskClick}
              onStatusToggle={onStatusToggle}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
