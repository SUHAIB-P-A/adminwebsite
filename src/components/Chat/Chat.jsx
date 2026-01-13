import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ClearChatModal from './ClearChatModal';
import '../adminpanel/AdminPanel.css'; // Inherit main styles

const Chat = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);

    // Message Selection State
    const [isMessageSelectionMode, setIsMessageSelectionMode] = useState(false);
    const [selectedMessageIds, setSelectedMessageIds] = useState(new Set());
    const [longPressTimer, setLongPressTimer] = useState(null);

    // User/Conversation Selection State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedChatIds, setSelectedChatIds] = useState(new Set());
    const [showChatMenu, setShowChatMenu] = useState(false);

    // Prevents onClick from firing immediately after long press
    const longPressTriggered = useRef(false);

    const scrollRef = useRef();

    const currentUserId = localStorage.getItem('staff_id'); // We need this to differentiate sent/received styles

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        let interval;
        if (selectedUser) {
            fetchMessages(selectedUser.id);
            // Poll for new messages every 3 seconds
            interval = setInterval(() => {
                fetchMessages(selectedUser.id, true);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [selectedUser]);

    // Poll for users list updates (unread counts & sorting) every 10s
    useEffect(() => {
        const interval = setInterval(() => {
            // Only fetch if we are not currently searching/filtering? 
            // Ideally we merge state, but for now simple re-fetch
            fetchUsers(true);
        }, 10000);
        return () => clearInterval(interval);
    }, [currentUserId]);

    useEffect(() => {
        // Auto-scroll to bottom
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchUsers = async (silent = false) => {
        if (!silent) setLoadingUsers(true);
        try {
            // exclude current user from the list
            const { data } = await axios.get('/api/chat/users/', { params: { exclude_id: currentUserId } });
            setUsers(data);
        } catch (err) {
            console.error("Failed to fetch chat users", err);
        }
        if (!silent) setLoadingUsers(false);
    };

    const fetchMessages = async (targetUserId, silent = false) => {
        if (!silent) setLoadingMessages(true);
        try {
            const { data } = await axios.get('/api/chat/conversation/', {
                params: { user1: currentUserId, user2: targetUserId }
            });
            // Check if we need to update state to avoid re-rendering if data is same? 
            // For now, React handles diffing well enough for small lists.
            setMessages(data);

            // Mark unread messages as read
            const unreadIds = data.filter(m => !m.is_read && parseInt(m.receiver) === parseInt(currentUserId)).map(m => m.id);
            if (unreadIds.length > 0) {
                // Fire and forget updates
                Promise.all(unreadIds.map(id => axios.patch(`/api/chat/${id}/`, { is_read: true })));

                // Dispatch event with count for optimistic update
                const event = new CustomEvent('chatRead', { detail: { count: unreadIds.length } });
                window.dispatchEvent(event);

                // Optimistically update local user list to clear badge
                setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, unread_count: 0 } : u));
            } else {
                // Optimization: If no unread messages, maybe we don't need to refresh users immediately?
                // But wait, if we received a NEW message while chat was open, fetchUsers() would be needed to show it on top/update timestamp?
                // Actually, fetchUsers is called on mount. We should probably poll "users" endpoint too if we want real-time sorting updates.
                // For now, let's keep it simple.
            }
        } catch (err) {
            console.error("Failed to fetch messages", err);
        }
        if (!silent) setLoadingMessages(false);
    };

    // Message Handlers
    const handleMessageLongPress = (msg) => {
        const timer = setTimeout(() => {
            longPressTriggered.current = true;
            setIsMessageSelectionMode(true);
            toggleMessageSelection(msg.id);
        }, 500);
        setLongPressTimer(timer);
    };

    const toggleMessageSelection = (msgId) => {
        setSelectedMessageIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(msgId)) {
                newSet.delete(msgId);
                if (newSet.size === 0) setIsMessageSelectionMode(false);
            } else {
                newSet.add(msgId);
            }
            return newSet;
        });
    };

    const handleMessageClick = (msg) => {
        if (longPressTriggered.current) {
            longPressTriggered.current = false;
            return;
        }
        if (isMessageSelectionMode) {
            toggleMessageSelection(msg.id);
        }
    };

    const handleDeleteSelectedMessages = () => {
        const canDeleteForEveryone = Array.from(selectedMessageIds).every(id => {
            const msg = messages.find(m => m.id === id);
            return msg && parseInt(msg.sender) === parseInt(currentUserId);
        });

        setDeleteContext({
            type: 'messages',
            title: `Delete ${selectedMessageIds.size} Message(s)?`,
            description: (
                <>
                    You are about to delete {selectedMessageIds.size} selected message(s).
                </>
            ),
            canDeleteForEveryone
        });
        setShowClearModal(true);
    };

    // User Selection Handlers
    const handleLongPress = (user) => {
        const timer = setTimeout(() => {
            longPressTriggered.current = true;
            setIsSelectionMode(true);
            toggleSelection(user.id);
        }, 500);
        setLongPressTimer(timer);
    };

    const cancelLongPress = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    const toggleSelection = (userId) => {
        setSelectedChatIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
                if (newSet.size === 0) setIsSelectionMode(false);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    const handleUserClick = (user) => {
        if (longPressTriggered.current) {
            longPressTriggered.current = false;
            return;
        }
        if (isSelectionMode) {
            toggleSelection(user.id);
        } else {
            setSelectedUser(user);
        }
    };

    const handleDeleteSelectedChats = () => {
        setDeleteContext({
            type: 'chats',
            title: `Delete ${selectedChatIds.size} Conversation(s)?`,
            description: (
                <>
                    You are about to delete {selectedChatIds.size} selected conversation(s).
                </>
            )
        });
        setShowClearModal(true);
    };

    const [showClearModal, setShowClearModal] = useState(false);
    const [showToast, setShowToast] = useState({ show: false, message: '' });
    const [deleteContext, setDeleteContext] = useState({ type: 'single', title: '', description: '' });

    // ... (existing helper functions)

    const handleClearChatClick = () => {
        if (!selectedUser) return;
        setShowChatMenu(false);
        setDeleteContext({
            type: 'single',
            title: 'Clear Chat History?',
            description: null // Use default
        });
        setShowClearModal(true);
    };

    const confirmClearChat = async (mode) => {
        setShowClearModal(false);

        if (deleteContext.type === 'messages') {
            await confirmDeleteMessages(mode);
        } else if (deleteContext.type === 'chats') {
            await confirmDeleteChats(mode);
        } else {
            // Default 'single' chat clear
            await confirmClearSingleChat(mode);
        }
    };

    const confirmClearSingleChat = async (mode) => {
        // Optimistic update
        setMessages([]);
        setUsers(prev => prev.map(u =>
            u.id === selectedUser.id
                ? { ...u, last_message_time: null, unread_count: 0 }
                : u
        ));

        try {
            await axios.post('/api/chat/delete_conversation/', {
                user_id: currentUserId,
                target_user_id: selectedUser.id,
                mode: mode
            });
            setShowToast({ show: true, message: 'Chat cleared successfully' });
            setTimeout(() => setShowToast({ show: false, message: '' }), 3000);
            fetchUsers(true);
        } catch (err) {
            console.error("Failed to clear chat", err);
            alert("Failed to clear chat");
            // Revert
            fetchMessages(selectedUser.id);
            fetchUsers(true);
        }
    };

    const confirmDeleteMessages = async (mode) => {
        const idsToDelete = Array.from(selectedMessageIds);

        // Optimistic UI
        if (mode === 'everyone') {
            setMessages(prev => prev.map(m => {
                if (selectedMessageIds.has(m.id)) {
                    return { ...m, content: "You deleted this message", is_revoked_placeholder: true };
                }
                return m;
            }));
        } else {
            setMessages(prev => prev.filter(m => !selectedMessageIds.has(m.id)));
        }

        setIsMessageSelectionMode(false);
        setSelectedMessageIds(new Set());

        try {
            await axios.post('/api/chat/delete_messages/', {
                message_ids: idsToDelete,
                mode: mode,
                user_id: currentUserId
            });
            fetchUsers(true);
            setShowToast({ show: true, message: 'Messages deleted successfully' });
            setTimeout(() => setShowToast({ show: false, message: '' }), 3000);

            // Re-fetch messages to ensure server state is synced (especially for the placeholder text)
            if (mode === 'everyone') {
                fetchMessages(selectedUser.id, true);
            }
        } catch (err) {
            console.error("Failed to delete messages", err);
            fetchMessages(selectedUser.id, true); // Revert
        }
    };

    const confirmDeleteChats = async (mode) => {
        const idsToDelete = Array.from(selectedChatIds);

        // Optimistic UI (approximate)
        setIsSelectionMode(false);
        setSelectedChatIds(new Set());
        setUsers(prev => prev.filter(u => !idsToDelete.includes(u.id))); // Temporarily hide? actually soft delete might not hide user, just messages. 
        // Better: updates to generic "cleared" state if 'local', or remove if 'everyone' logic implies removal from list? 
        // For now, let's just refresh after API call. "Clear for me" usually keeps the user in list but empty chat.

        try {
            await Promise.all(idsToDelete.map(id => axios.post('/api/chat/delete_conversation/', {
                user_id: currentUserId,
                target_user_id: id,
                mode: mode
            })));

            if (selectedUser && idsToDelete.includes(selectedUser.id)) {
                setMessages([]);
                setSelectedUser(null);
            }
            setShowToast({ show: true, message: 'Conversations deleted successfully' });
            setTimeout(() => setShowToast({ show: false, message: '' }), 3000);
            fetchUsers();
        } catch (err) {
            console.error("Failed to delete conversations", err);
            alert("Failed to delete some conversations.");
            fetchUsers();
        }
    };

    // ... (rest of the file)

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        const payload = {
            sender: currentUserId,
            receiver: selectedUser.id,
            content: newMessage,
            is_read: false
        };

        // Optimistic UI update
        const tempMsg = {
            id: Date.now(), // temp id
            sender: parseInt(currentUserId),
            receiver: selectedUser.id,
            content: newMessage,
            timestamp: new Date().toISOString(),
            is_read: false
        };
        setMessages([...messages, tempMsg]);
        setNewMessage('');

        try {
            await axios.post('/api/chat/', payload);
            fetchMessages(selectedUser.id, true); // Sync correct data

            // Move this user to top of list and update timestamp
            setUsers(prevUsers => {
                const otherUsers = prevUsers.filter(u => u.id !== selectedUser.id);
                const updatedUser = { ...selectedUser, last_message_time: new Date().toISOString() };
                return [updatedUser, ...otherUsers];
            });
        } catch (err) {
            console.error("Failed to send message", err);
            // Optionally remove the optimistic message on failure
        }
    };

    const inputRef = useRef(null);

    // Auto-focus input when user changes
    useEffect(() => {
        if (selectedUser && inputRef.current) {
            inputRef.current.focus();
        }
    }, [selectedUser]);

    return (
        <div className="p-4 page-anime h-100 position-relative">
            {/* ... toast code ... */}
            {/* ... rest of the code ... */}
            {showToast.show && (
                <div className="position-fixed bottom-0 start-50 translate-middle-x mb-4 anime-fade-in-up" style={{ zIndex: 2000 }}>
                    <div className="bg-dark text-white px-4 py-2 rounded-pill shadow d-flex align-items-center">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                        {showToast.message}
                    </div>
                </div>
            )}

            <h1 className="page-title mb-4">Messages</h1>

            {/* Use ClearChatModal */}
            <ClearChatModal
                show={showClearModal}
                onHide={() => setShowClearModal(false)}
                onClear={confirmClearChat}
                title={deleteContext.title}
                description={deleteContext.description}
                canDeleteForEveryone={deleteContext.canDeleteForEveryone}
            />

            <div className="custom-card card border-0 shadow-sm rounded-4 overflow-hidden" style={{ height: 'calc(100vh - 150px)' }}>

                <div className="row g-0 h-100">
                    {/* User List Sidebar */}
                    <div className="col-md-4 col-lg-3 border-end bg-light d-flex flex-column h-100">
                        <div className="p-3 border-bottom bg-white d-flex align-items-center" style={{ minHeight: '70px' }}>
                            {isSelectionMode ? (
                                <div className="d-flex align-items-center w-100 justify-content-between anime-fade-in">
                                    <div className="d-flex align-items-center">
                                        <button className="btn btn-link text-dark p-0 me-3" onClick={() => { setIsSelectionMode(false); setSelectedChatIds(new Set()); }}>
                                            <i className="bi bi-x-lg"></i>
                                        </button>
                                        <span className="fw-bold">{selectedChatIds.size} Selected</span>
                                    </div>
                                    <button className="btn btn-danger btn-sm rounded-pill" onClick={handleDeleteSelectedChats}>
                                        <i className="bi bi-trash-fill"></i>
                                    </button>
                                </div>
                            ) : (
                                <input type="text" className="form-control rounded-pill" placeholder="Search people..." />
                            )}
                        </div>
                        <div className="flex-grow-1 overflow-auto custom-scrollbar">
                            {loadingUsers ? (
                                <div className="text-center p-4"><div className="spinner-border spinner-border-sm text-primary"></div></div>
                            ) : users.length === 0 ? (
                                <div className="text-center p-4 text-muted small">No active users found.</div>
                            ) : (
                                <div className="list-group list-group-flush">
                                    {users.map(u => (
                                        <div
                                            key={u.id}
                                            className={`list-group-item list-group-item-action border-0 py-3 px-4 d-flex align-items-center user-select-none ${selectedUser?.id === u.id && !isSelectionMode ? 'active bg-primary-subtle text-primary fw-bold' : ''} ${selectedChatIds.has(u.id) ? 'bg-primary-subtle' : ''}`}
                                            onClick={() => handleUserClick(u)}
                                            onMouseDown={() => handleLongPress(u)}
                                            onMouseUp={cancelLongPress}
                                            onMouseLeave={() => { cancelLongPress(); longPressTriggered.current = false; }}
                                            onTouchStart={() => handleLongPress(u)}
                                            onTouchEnd={cancelLongPress}
                                            style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                                        >
                                            <div className="position-relative me-3">
                                                {isSelectionMode && (
                                                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-black bg-opacity-50 rounded-circle anime-zoom-in" style={{ zIndex: 10 }}>
                                                        {selectedChatIds.has(u.id) && <i className="bi bi-check-lg text-white fs-4"></i>}
                                                    </div>
                                                )}
                                                <div className="rounded-circle d-flex align-items-center justify-content-center bg-secondary-subtle text-secondary fw-bold" style={{ width: '40px', height: '40px', overflow: 'hidden' }}>
                                                    {u.profile_image ? <img src={u.profile_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.name.charAt(0)}
                                                </div>
                                            </div>
                                            <div className="flex-grow-1 text-truncate">
                                                <div className="d-flex justify-content-between align-items-center mb-0">
                                                    <div className="text-truncate fw-bold">{u.name}</div>
                                                    {!isSelectionMode && u.unread_count > 0 && (
                                                        <span className="badge rounded-circle bg-success d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px', fontSize: '0.7rem' }}>
                                                            {u.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="d-flex justify-content-between align-items-center small">
                                                    <div className="text-truncate opacity-75 fw-normal">{u.role}</div>
                                                    {!isSelectionMode && u.last_message_time && (
                                                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                            {new Date(u.last_message_time).toLocaleDateString() === new Date().toLocaleDateString()
                                                                ? new Date(u.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                                : new Date(u.last_message_time).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="col-md-8 col-lg-9 d-flex flex-column bg-white h-100">
                        {selectedUser ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-3 border-bottom d-flex align-items-center bg-white justify-content-between">
                                    <div className="d-flex align-items-center">
                                        <div className="rounded-circle d-flex align-items-center justify-content-center bg-light text-primary me-3 fw-bold" style={{ width: '40px', height: '40px', overflow: 'hidden' }}>
                                            {selectedUser.profile_image ? <img src={selectedUser.profile_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : selectedUser.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h6 className="mb-0 fw-bold">{selectedUser.name}</h6>
                                            <div className="small text-muted">{selectedUser.role}</div>
                                        </div>
                                    </div>
                                    {isMessageSelectionMode ? (
                                        <div className="d-flex align-items-center anime-fade-in">
                                            <span className="me-3 fw-bold">{selectedMessageIds.size} Selected</span>
                                            <button className="btn btn-danger btn-sm rounded-pill me-2" onClick={handleDeleteSelectedMessages}>
                                                <i className="bi bi-trash-fill"></i>
                                            </button>
                                            <button className="btn btn-secondary btn-sm rounded-pill" onClick={() => { setIsMessageSelectionMode(false); setSelectedMessageIds(new Set()); }}>
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="position-relative">
                                            <button
                                                className="btn btn-light rounded-circle text-secondary"
                                                onClick={() => setShowChatMenu(!showChatMenu)}
                                                style={{ width: '40px', height: '40px' }}
                                                title="More options"
                                            >
                                                <i className="bi bi-three-dots-vertical"></i>
                                            </button>
                                            {showChatMenu && (
                                                <>
                                                    <div
                                                        className="position-absolute end-0 top-100 mt-2 bg-white rounded shadow-sm border py-2"
                                                        style={{ width: '180px', zIndex: 1000 }}
                                                    >
                                                        <button
                                                            className="dropdown-item px-3 py-2 text-danger d-flex align-items-center"
                                                            onClick={handleClearChatClick}
                                                        >
                                                            <i className="bi bi-trash3 me-2"></i> Clear Chat
                                                        </button>
                                                    </div>
                                                    <div
                                                        className="position-fixed top-0 start-0 w-100 h-100"
                                                        style={{ zIndex: 999 }}
                                                        onClick={() => setShowChatMenu(false)}
                                                    ></div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Messages */}
                                <div className="flex-grow-1 p-4 overflow-auto custom-scrollbar bg-light bg-opacity-25" ref={scrollRef}>
                                    {loadingMessages && messages.length === 0 ? (
                                        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                                    ) : messages.length === 0 ? (
                                        <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                                            <i className="bi bi-chat-dots fs-1 mb-3 opacity-50"></i>
                                            <p>No messages yet. Say hello!</p>
                                        </div>
                                    ) : (
                                        <div className="d-flex flex-column gap-3">
                                            {messages.map((msg, index) => {
                                                const isMine = parseInt(msg.sender) === parseInt(currentUserId);
                                                const isSelected = selectedMessageIds.has(msg.id);
                                                return (
                                                    <div
                                                        key={index}
                                                        className={`d-flex ${isMine ? 'justify-content-end' : 'justify-content-start'} ${isMessageSelectionMode ? 'cursor-pointer' : ''}`}
                                                        onClick={() => handleMessageClick(msg)}
                                                        onMouseDown={() => handleMessageLongPress(msg)}
                                                        onMouseUp={cancelLongPress}
                                                        onMouseLeave={() => { cancelLongPress(); longPressTriggered.current = false; }}
                                                        onTouchStart={() => handleMessageLongPress(msg)}
                                                        onTouchEnd={cancelLongPress}
                                                    >
                                                        <div
                                                            className={`p-3 rounded-4 shadow-sm border position-relative ${isMine ? 'bg-primary text-white rounded-br-0' : 'bg-white text-dark rounded-bl-0'} ${isSelected ? 'opacity-75 ring-2 ring-primary' : ''}`}
                                                            style={{
                                                                maxWidth: '70%',
                                                                borderRadius: '1rem',
                                                                borderBottomRightRadius: isMine ? '0' : '1rem',
                                                                borderBottomLeftRadius: isMine ? '1rem' : '0',
                                                                backgroundColor: isSelected ? (isMine ? '#0d6efd' : '#f8f9fa') : undefined,
                                                                border: isSelected ? '2px solid #0d6efd' : undefined
                                                            }}
                                                        >
                                                            {isSelected && (
                                                                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-black bg-opacity-10 rounded-4">
                                                                    <i className="bi bi-check-circle-fill text-white fs-4 shadow"></i>
                                                                </div>
                                                            )}
                                                            <div className={`text-break ${msg.is_revoked_placeholder ? 'fst-italic opacity-50' : ''}`}>{msg.content}</div>
                                                            <div className={`text-end mt-1 small ${isMine ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.7rem' }}>
                                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Input Area */}
                                <div className="p-3 border-top bg-white">
                                    <form onSubmit={handleSendMessage} className="d-flex gap-2">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            className="form-control rounded-pill bg-light border-0 px-4"
                                            placeholder={`Message ${selectedUser.name}...`}
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            disabled={isMessageSelectionMode}
                                        />
                                        <button type="submit" className="btn btn-primary rounded-circle shadow-sm d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }} disabled={!newMessage.trim() || isMessageSelectionMode}>
                                            <i className="bi bi-send-fill fs-5 ps-1"></i>
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted bg-light bg-opacity-50">
                                <div className="bg-white p-4 rounded-circle shadow-sm mb-4">
                                    <i className="bi bi-chat-square-text fs-1 text-primary"></i>
                                </div>
                                <h4 className="fw-bold text-dark">Select a conversation</h4>
                                <p>Choose a person from the left to start chatting.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
