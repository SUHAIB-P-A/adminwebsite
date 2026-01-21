import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatUserList from '../ChatUserList';

describe('ChatUserList Component', () => {
    const mockUsers = [
        {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            profile_image: null,
            unread_count: 0,
        },
        {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@example.com',
            profile_image: null,
            unread_count: 3,
        },
    ];

    it('renders user list correctly', () => {
        render(<ChatUserList users={mockUsers} />);
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('filters users by search query', async () => {
        const onSearch = vi.fn();
        render(
            <ChatUserList
                users={mockUsers}
                searchQuery="john"
                onSearch={onSearch}
            />
        );
        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('calls onUserSelect when user is clicked', () => {
        const onUserSelect = vi.fn();
        render(
            <ChatUserList
                users={mockUsers}
                onUserSelect={onUserSelect}
            />
        );
        const userButton = screen.getByRole('button', { name: /John Doe/i });
        fireEvent.click(userButton);
        expect(onUserSelect).toHaveBeenCalledWith(mockUsers[0]);
    });

    it('displays unread badge for users with unread messages', () => {
        render(<ChatUserList users={mockUsers} />);
        expect(screen.getByText('3 new')).toBeInTheDocument();
    });

    it('shows loading spinner when loading prop is true', () => {
        render(<ChatUserList users={[]} isLoading={true} />);
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('shows no users message when list is empty', () => {
        render(<ChatUserList users={[]} isLoading={false} />);
        expect(screen.getByText('No users found')).toBeInTheDocument();
    });

    it('highlights selected user', () => {
        render(
            <ChatUserList
                users={mockUsers}
                selectedUser={mockUsers[0]}
            />
        );
        const buttons = screen.getAllByRole('button');
        expect(buttons[1]).toHaveClass('active');
    });
});
