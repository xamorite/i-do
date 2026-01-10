import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskCard } from '../TaskCard';
import { Task } from '@/lib/types';

const mockTask: Task = {
    id: 'test-task-1',
    title: 'Test Task',
    status: 'planned',
    plannedDate: '2026-01-10',
    createdAt: '2026-01-10T10:00:00Z',
    userId: 'user-1',
};

describe('TaskCard', () => {
    it('renders task title correctly', () => {
        render(<TaskCard task={mockTask} />);
        expect(screen.getByText('Test Task')).toBeDefined();
    });

    it('calls onClick when clicked', () => {
        const handleClick = vi.fn();
        render(<TaskCard task={mockTask} onClick={handleClick} />);

        fireEvent.click(screen.getByText('Test Task'));
        expect(handleClick).toHaveBeenCalledWith(mockTask);
    });

    it('calls onStatusToggle when status icon is clicked', () => {
        const handleToggle = vi.fn();
        render(<TaskCard task={mockTask} onStatusToggle={handleToggle} />);

        // The status icon button has a title "Toggle Status"
        const toggleButton = screen.getByTitle('Toggle Status');
        fireEvent.click(toggleButton);
        expect(handleToggle).toHaveBeenCalledWith(mockTask);
    });

    it('renders estimate if provided', () => {
        const taskWithEstimate: Task = { ...mockTask, estimateMinutes: 90 };
        render(<TaskCard task={taskWithEstimate} />);
        expect(screen.getByText('1:30')).toBeDefined();
    });

    it('shows category label if provided', () => {
        const taskWithCategory: Task = { ...mockTask, channel: 'Work' };
        render(<TaskCard task={taskWithCategory} />);
        expect(screen.getByText('Work')).toBeDefined();
    });
});
