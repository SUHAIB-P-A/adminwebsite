import React from 'react';
import PropTypes from 'prop-types';

/**
 * Chat User List Component
 * Displays list of available chat users/contacts
 */
const ChatUserList = ({
    users = [],
    selectedUser,
    isLoading = false,
    searchQuery = '',
    onUserSelect,
    onSearch,
}) => {
    const filteredUsers = users.filter(
        (user) =>
            user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="d-flex flex-column" style={{ height: '100%', maxWidth: '300px', borderRight: '1px solid #ddd' }}>
            {/* Search Bar */}
            <div className="p-3 border-bottom">
                <input
                    type="text"
                    className="form-control rounded-pill bg-light border-0"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => onSearch?.(e.target.value)}
                />
            </div>

            {/* User List */}
            <div className="flex-grow-1 overflow-auto">
                {isLoading ? (
                    <div className="text-center p-5">
                        <div className="spinner-border text-primary"></div>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center p-5 text-muted">
                        <i className="bi bi-search fs-3 mb-3 d-block opacity-50"></i>
                        <small>No users found</small>
                    </div>
                ) : (
                    <div className="list-group list-group-flush">
                        {filteredUsers.map((user) => (
                            <button
                                key={user.id}
                                className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${
                                    selectedUser?.id === user.id ? 'active' : ''
                                }`}
                                onClick={() => onUserSelect?.(user)}
                            >
                                {user.profile_image ? (
                                    <img
                                        src={user.profile_image}
                                        alt={user.name}
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            backgroundColor: '#e9ecef',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <i className="bi bi-person-circle"></i>
                                    </div>
                                )}
                                <div className="flex-grow-1 text-start min-w-0">
                                    <h6 className="mb-1">{user.name}</h6>
                                    <small className="text-muted text-truncate d-block">
                                        {user.unread_count > 0 ? (
                                            <span className="badge bg-danger">{user.unread_count} new</span>
                                        ) : (
                                            user.last_message_time || 'No messages'
                                        )}
                                    </small>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

ChatUserList.propTypes = {
    users: PropTypes.arrayOf(PropTypes.object),
    selectedUser: PropTypes.object,
    isLoading: PropTypes.bool,
    searchQuery: PropTypes.string,
    onUserSelect: PropTypes.func,
    onSearch: PropTypes.func,
};

export default ChatUserList;
