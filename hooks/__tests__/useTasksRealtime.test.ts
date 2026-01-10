import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTasksRealtime } from '../useTasksRealtime';
import { useAuth } from '@/contexts/AuthContext';

// Mock Auth
vi.mock('@/contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

// Mock the entire firebase module to avoid initialization issues
vi.mock('@/lib/firebase', () => ({
    db: { type: 'firestore' },
    auth: { type: 'auth' },
}));

describe('useTasksRealtime', () => {
    const mockUser = { uid: 'user-123' };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns empty tasks when user is not authenticated', () => {
        (useAuth as any).mockReturnValue({ user: null });
        const { result } = renderHook(() => useTasksRealtime());

        expect(result.current.loading).toBe(false);
        expect(result.current.tasks).toEqual([]);
    });

    it('provides createTask, updateTask, and deleteTask functions', () => {
        (useAuth as any).mockReturnValue({ user: mockUser });
        const { result } = renderHook(() => useTasksRealtime());

        expect(typeof result.current.createTask).toBe('function');
        expect(typeof result.current.updateTask).toBe('function');
        expect(typeof result.current.deleteTask).toBe('function');
    });

    it('starts in loading state when user is authenticated', () => {
        (useAuth as any).mockReturnValue({ user: mockUser });
        const { result } = renderHook(() => useTasksRealtime());

        expect(result.current.loading).toBe(true);
    });
});
