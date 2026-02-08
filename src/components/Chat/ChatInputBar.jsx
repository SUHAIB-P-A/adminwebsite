import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Chat Input Bar Component
 * Message input field with send button
 */
const ChatInputBar = forwardRef(({ 
    selectedUser,
    message = '',
    isDisabled = false,
    onMessageChange,
    onSendMessage,
}, ref) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        onSendMessage?.();
    };

    return (
        <div className="p-3 border-top bg-white">
            <form onSubmit={handleSubmit} className="d-flex gap-2">
                <input
                    ref={ref}
                    type="text"
                    className="form-control rounded-pill bg-light border-0 px-4"
                    placeholder={`Message ${selectedUser?.name || 'user'}...`}
                    value={message}
                    onChange={(e) => onMessageChange?.(e.target.value)}
                    disabled={isDisabled}
                />
                <button
                    type="submit"
                    className="btn btn-primary rounded-circle shadow-sm d-flex align-items-center justify-content-center"
                    style={{ width: '45px', height: '45px' }}
                    disabled={!message.trim() || isDisabled}
                >
                    <i className="bi bi-send-fill fs-5 ps-1"></i>
                </button>
            </form>
        </div>
    );
});

ChatInputBar.displayName = 'ChatInputBar';

ChatInputBar.propTypes = {
    selectedUser: PropTypes.object,
    message: PropTypes.string,
    isDisabled: PropTypes.bool,
    onMessageChange: PropTypes.func,
    onSendMessage: PropTypes.func,
};

export default ChatInputBar;
