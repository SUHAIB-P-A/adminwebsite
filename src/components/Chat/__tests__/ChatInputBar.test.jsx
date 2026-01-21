import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatInputBar from '../ChatInputBar';

describe('ChatInputBar Component', () => {
    const mockUser = { name: 'John Doe' };

    it('renders input field and send button', () => {
        render(<ChatInputBar selectedUser={mockUser} />);
        expect(screen.getByPlaceholderText(/Message John Doe/i)).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('updates message on input change', () => {
        const onMessageChange = vi.fn();
        render(
            <ChatInputBar
                selectedUser={mockUser}
                onMessageChange={onMessageChange}
            />
        );
        const input = screen.getByPlaceholderText(/Message/i);
        fireEvent.change(input, { target: { value: 'Hello' } });
        expect(onMessageChange).toHaveBeenCalledWith('Hello');
    });

    it('disables send button when message is empty', () => {
        render(<ChatInputBar selectedUser={mockUser} message="" />);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('enables send button when message is not empty', () => {
        render(<ChatInputBar selectedUser={mockUser} message="Hello" />);
        expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('calls onSendMessage when form is submitted', () => {
        const onSendMessage = vi.fn();
        render(
            <ChatInputBar
                selectedUser={mockUser}
                message="Test"
                onSendMessage={onSendMessage}
            />
        );
        const form = screen.getByRole('button').closest('form');
        fireEvent.submit(form);
        expect(onSendMessage).toHaveBeenCalled();
    });

    it('disables input when disabled prop is true', () => {
        render(
            <ChatInputBar
                selectedUser={mockUser}
                isDisabled={true}
            />
        );
        expect(screen.getByPlaceholderText(/Message/i)).toBeDisabled();
        expect(screen.getByRole('button')).toBeDisabled();
    });
});
