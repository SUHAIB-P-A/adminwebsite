import React from 'react';
import PropTypes from 'prop-types';

/**
 * Chat Message List Component
 * Displays messages with selection and interaction support
 */
const ChatMessageList = ({
    messages = [],
    selectedUser,
    currentUserId,
    isMessageSelectionMode,
    selectedMessageIds = new Set(),
    isLoading = false,
    scrollRef,
    onMessageClick,
    onMessageLongPress,
    onCancelLongPress,
}) => {
    if (isLoading && messages.length === 0) {
        return (
            <div className="flex-grow-1 p-4 overflow-auto custom-scrollbar bg-light bg-opacity-25 d-flex align-items-center justify-content-center">
                <div className="spinner-border text-primary"></div>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex-grow-1 p-4 overflow-auto custom-scrollbar bg-light bg-opacity-25 d-flex flex-column align-items-center justify-content-center text-muted">
                <i className="bi bi-chat-dots fs-1 mb-3 opacity-50"></i>
                <p>No messages yet. Say hello!</p>
            </div>
        );
    }

    return (
        <div className="flex-grow-1 p-4 overflow-auto custom-scrollbar bg-light bg-opacity-25" ref={scrollRef}>
            <div className="d-flex flex-column gap-3">
                {messages.map((msg) => {
                    const isMine = parseInt(msg.sender) === parseInt(currentUserId);
                    const isSelected = selectedMessageIds.has(msg.id);

                    return (
                        <div
                            key={msg.id}
                            className={`d-flex ${isMine ? 'justify-content-end' : 'justify-content-start'} ${
                                isMessageSelectionMode ? 'cursor-pointer' : ''
                            }`}
                            onClick={() => onMessageClick?.(msg)}
                            onMouseDown={() => onMessageLongPress?.(msg)}
                            onMouseUp={onCancelLongPress}
                            onMouseLeave={onCancelLongPress}
                            onTouchStart={() => onMessageLongPress?.(msg)}
                            onTouchEnd={onCancelLongPress}
                        >
                            <div
                                className={`p-3 rounded-4 shadow-sm border position-relative ${
                                    isMine ? 'bg-primary text-white rounded-br-0' : 'bg-white text-dark rounded-bl-0'
                                } ${isSelected ? 'opacity-75 ring-2 ring-primary' : ''}`}
                                style={{
                                    maxWidth: '70%',
                                    borderRadius: '1rem',
                                    borderBottomRightRadius: isMine ? '0' : '1rem',
                                    borderBottomLeftRadius: isMine ? '1rem' : '0',
                                    backgroundColor: isSelected ? (isMine ? '#0d6efd' : '#f8f9fa') : undefined,
                                    border: isSelected ? '2px solid #0d6efd' : undefined,
                                }}
                            >
                                {isSelected && (
                                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-black bg-opacity-10 rounded-4">
                                        <i className="bi bi-check-circle-fill text-white fs-4 shadow"></i>
                                    </div>
                                )}
                                <div className={`text-break ${msg.is_revoked_placeholder ? 'fst-italic opacity-50' : ''}`}>
                                    {msg.content}
                                </div>
                                <div
                                    className={`text-end mt-1 small ${isMine ? 'text-white-50' : 'text-muted'}`}
                                    style={{ fontSize: '0.7rem' }}
                                >
                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

ChatMessageList.propTypes = {
    messages: PropTypes.arrayOf(PropTypes.object),
    selectedUser: PropTypes.object,
    currentUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isMessageSelectionMode: PropTypes.bool,
    selectedMessageIds: PropTypes.instanceOf(Set),
    isLoading: PropTypes.bool,
    scrollRef: PropTypes.object,
    onMessageClick: PropTypes.func,
    onMessageLongPress: PropTypes.func,
    onCancelLongPress: PropTypes.func,
};

export default ChatMessageList;
