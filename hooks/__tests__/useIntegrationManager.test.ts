import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useIntegrationManager } from '../useIntegrationManager';
import { fetchCalendarEvents } from '@/hooks/useCalendarSync';
import { fetchSlackMessages } from '@/hooks/useSlack';
import { fetchNotionTasks } from '@/hooks/useNotion';

// Mock dependencies
vi.mock('@/hooks/useCalendarSync', () => ({
    fetchCalendarEvents: vi.fn(),
}));
vi.mock('@/hooks/useSlack', () => ({
    fetchSlackMessages: vi.fn(),
}));
vi.mock('@/hooks/useNotion', () => ({
    fetchNotionTasks: vi.fn(),
}));

describe('useIntegrationManager', () => {
    const mockDate = new Date('2026-01-10T12:00:00Z');
    const mockVisibleSources = new Set(['google', 'slack']);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('loads data on mount and updates loading state', async () => {
        (fetchCalendarEvents as any).mockResolvedValue([]);
        (fetchSlackMessages as any).mockResolvedValue([]);

        const { result } = renderHook(() =>
            useIntegrationManager(mockDate, 'today', mockVisibleSources)
        );

        await waitFor(() => {
            expect(result.current.isCalendarLoading).toBe(false);
        });

        expect(result.current.calendarEvents).toEqual([]);
        expect(result.current.slackMessages).toEqual([]);
    });

    it('populates data correctly after loading', async () => {
        const mockEvents = [{ id: '1', title: 'Test Event' }];
        const mockMsgs = [{ id: 's1', text: 'Hello' }];

        (fetchCalendarEvents as any).mockResolvedValue(mockEvents);
        (fetchSlackMessages as any).mockResolvedValue(mockMsgs);

        const { result } = renderHook(() =>
            useIntegrationManager(mockDate, 'today', mockVisibleSources)
        );

        await waitFor(() => {
            expect(result.current.calendarEvents).toEqual(mockEvents);
            expect(result.current.slackMessages).toEqual(mockMsgs);
        });
    });

    it('loads Notion tasks only if visible', async () => {
        (fetchCalendarEvents as any).mockResolvedValue([]);
        (fetchSlackMessages as any).mockResolvedValue([]);
        (fetchNotionTasks as any).mockResolvedValue([{ id: 'n1', title: 'Notion Task' }]);

        const { result, rerender } = renderHook(
            ({ sources }) => useIntegrationManager(mockDate, 'today', sources),
            { initialProps: { sources: new Set(['google']) } }
        );

        // Initial load finishes
        await waitFor(() => expect(result.current.isCalendarLoading).toBe(false));
        expect(fetchNotionTasks).not.toHaveBeenCalled();

        // Change sources
        rerender({ sources: new Set(['google', 'notion']) });

        await waitFor(() => {
            expect(fetchNotionTasks).toHaveBeenCalled();
        });
    });
});
