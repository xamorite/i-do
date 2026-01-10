import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardHeader } from '../DashboardHeader';

// Mock sub-components if they cause issues
vi.mock('@/components/layout/UserMenu', () => ({
    UserMenu: () => <div data-testid="user-menu" />
}));

vi.mock('@/components/notifications/NotificationCenter', () => ({
    NotificationCenter: () => <div data-testid="notification-center" />
}));

describe('DashboardHeader', () => {
    const defaultProps = {
        greetingName: 'John',
        username: 'john_doe',
        searchQuery: '',
        onSearchChange: vi.fn(),
        onNewTaskClick: vi.fn(),
        onMobileMenuClick: vi.fn(),
        isRightPaneOpen: true,
        onToggleRightPane: vi.fn(),
        onOpenPartners: vi.fn(),
        onNotificationSelect: vi.fn(),
    };

    it('renders greeting and username', () => {
        render(<DashboardHeader {...defaultProps} />);
        expect(screen.getByText(/Hey John/i)).toBeDefined();
        expect(screen.getByText(/@john_doe/i)).toBeDefined();
    });

    it('triggers onNewTaskClick when button is clicked', () => {
        render(<DashboardHeader {...defaultProps} />);
        const newTaskBtn = screen.getByRole('button', { name: /New Task/i });
        fireEvent.click(newTaskBtn);
        expect(defaultProps.onNewTaskClick).toHaveBeenCalled();
    });

    it('triggers onSearchChange when typing in search input', () => {
        render(<DashboardHeader {...defaultProps} />);
        const searchInput = screen.getByPlaceholderText(/Search.../i);
        fireEvent.change(searchInput, { target: { value: 'test query' } });
        expect(defaultProps.onSearchChange).toHaveBeenCalledWith('test query');
    });

    it('triggers onToggleRightPane when toggle button is clicked', () => {
        render(<DashboardHeader {...defaultProps} />);
        const toggleBtn = screen.getByTitle(/Close right pane/i);
        fireEvent.click(toggleBtn);
        expect(defaultProps.onToggleRightPane).toHaveBeenCalled();
    });

    it('renders correctly when right pane is closed', () => {
        render(<DashboardHeader {...defaultProps} isRightPaneOpen={false} />);
        expect(screen.queryByTitle(/Open right pane/i)).toBeDefined();
    });
});
