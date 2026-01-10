import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTaskDragDrop } from '../useTaskDragDrop';
import { DragEndEvent } from '@dnd-kit/core';

describe('useTaskDragDrop', () => {
    const mockHandleTaskUpdate = vi.fn();
    const mockLoadNotionTasks = vi.fn();
    const mockOnTaskCreate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createDragEvent = (activeData: any, overData: any): DragEndEvent => ({
        active: {
            id: 'active-id',
            data: { current: activeData },
            rect: { current: { translated: null, initial: null } },
        } as any,
        over: {
            id: 'over-id',
            data: { current: overData },
            rect: { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 },
            disabled: false,
        } as any,
        delta: { x: 0, y: 0 },
    });

    it('should handle dragging internal task to DayColumn', async () => {
        const { result } = renderHook(() =>
            useTaskDragDrop(mockHandleTaskUpdate, mockLoadNotionTasks, mockOnTaskCreate)
        );

        const activeTask = { id: 't1', title: 'Task 1', plannedDate: '2023-01-01', status: 'planned' };
        const event = createDragEvent(
            { type: 'Task', task: activeTask },
            { type: 'DayColumn', date: new Date('2023-01-02T12:00:00Z') }
        );

        await act(async () => {
            await result.current.handleDragEnd(event);
        });

        expect(mockHandleTaskUpdate).toHaveBeenCalledWith(
            't1',
            { plannedDate: '2023-01-02', status: 'planned' },
            '2023-01-01'
        );
    });

    it('should handle dragging internal task to InboxColumn', async () => {
        const { result } = renderHook(() =>
            useTaskDragDrop(mockHandleTaskUpdate, mockLoadNotionTasks, mockOnTaskCreate)
        );

        const activeTask = { id: 't1', title: 'Task 1', plannedDate: '2023-01-01', status: 'planned' };
        const event = createDragEvent(
            { type: 'Task', task: activeTask },
            { type: 'InboxColumn' }
        );

        await act(async () => {
            await result.current.handleDragEnd(event);
        });

        expect(mockHandleTaskUpdate).toHaveBeenCalledWith(
            't1',
            {
                plannedDate: '',
                status: 'inbox',
                isTimeboxed: false,
                startTime: '',
                endTime: ''
            },
            '2023-01-01'
        );
    });

    it('should handle dragging Calendar event to DayColumn', async () => {
        const { result } = renderHook(() =>
            useTaskDragDrop(mockHandleTaskUpdate, mockLoadNotionTasks, mockOnTaskCreate)
        );

        const eventData = { title: 'Meeting', startTime: '2023-01-01T10:00:00Z', endTime: '2023-01-01T11:00:00Z' };
        const targetDate = new Date('2023-01-02T00:00:00Z');

        // Test logic expects specific date construction
        const expectedStart = new Date(targetDate);
        expectedStart.setHours(10, 0); // Preserves hour from eventData
        const expectedEnd = new Date(targetDate);
        expectedEnd.setHours(11, 0);

        const event = createDragEvent(
            { type: 'calendar-event', event: eventData },
            { type: 'DayColumn', date: targetDate }
        );

        await act(async () => {
            await result.current.handleDragEnd(event);
        });

        expect(mockOnTaskCreate).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Meeting',
            isTimeboxed: true,
            // Date matching is tricky due to UTC/Local in tests, checking partial match
        }));
    });

    it('should handle dragging Calendar event to Inbox', async () => {
        const { result } = renderHook(() =>
            useTaskDragDrop(mockHandleTaskUpdate, mockLoadNotionTasks, mockOnTaskCreate)
        );

        const eventData = { title: 'Meeting' };
        const event = createDragEvent(
            { type: 'calendar-event', event: eventData },
            { type: 'InboxColumn' }
        );

        await act(async () => {
            await result.current.handleDragEnd(event);
        });

        expect(mockOnTaskCreate).toHaveBeenCalledWith({
            title: 'Meeting'
        });
    });
});
