import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../adminpanel/AdminPanel.css'; // Inherit main styles

const Chat = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
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

    useEffect(() => {
        // Auto-scroll to bottom
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchUsers = async () => {
        try {
            // exclude current user from the list
            const { data } = await axios.get('/api/chat/users/', { params: { exclude_id: currentUserId } });
            setUsers(data);
        } catch (err) {
            console.error("Failed to fetch chat users", err);
        }
        setLoadingUsers(false);
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
        } catch (err) {
            console.error("Failed to fetch messages", err);
        }
        if (!silent) setLoadingMessages(false);
    };

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
        } catch (err) {
            console.error("Failed to send message", err);
            // Optionally remove the optimistic message on failure
        }
    };

    return (
        <div className="p-4 page-anime h-100">
            <h1 className="page-title mb-4">Messages</h1>

            <div className="custom-card card border-0 shadow-sm rounded-4 overflow-hidden" style={{ height: 'calc(100vh - 150px)' }}>
                <div className="row g-0 h-100">
                    {/* User List Sidebar */}
                    <div className="col-md-4 col-lg-3 border-end bg-light d-flex flex-column h-100">
                        <div className="p-3 border-bottom bg-white">
                            <input type="text" className="form-control rounded-pill" placeholder="Search people..." />
                        </div>
                        <div className="flex-grow-1 overflow-auto custom-scrollbar">
                            {loadingUsers ? (
                                <div className="text-center p-4"><div className="spinner-border spinner-border-sm text-primary"></div></div>
                            ) : users.length === 0 ? (
                                <div className="text-center p-4 text-muted small">No active users found.</div>
                            ) : (
                                <div className="list-group list-group-flush">
                                    {users.map(u => (
                                        <button
                                            key={u.id}
                                            className={`list-group-item list-group-item-action border-0 py-3 px-4 d-flex align-items-center ${selectedUser?.id === u.id ? 'active bg-primary-subtle text-primary fw-bold' : ''}`}
                                            onClick={() => setSelectedUser(u)}
                                        >
                                            <div className="position-relative me-3">
                                                <div className="rounded-circle d-flex align-items-center justify-content-center bg-secondary-subtle text-secondary fw-bold" style={{ width: '40px', height: '40px', overflow: 'hidden' }}>
                                                    {u.profile_image ? <img src={u.profile_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.name.charAt(0)}
                                                </div>
                                                {/* Online status indicator could go here */}
                                            </div>
                                            <div className="flex-grow-1 text-truncate">
                                                <div className="mb-0 text-truncate">{u.name}</div>
                                                <div className="small opacity-75 fw-normal">{u.role}</div>
                                            </div>
                                        </button>
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
                                <div className="p-3 border-bottom d-flex align-items-center bg-white">
                                    <div className="rounded-circle d-flex align-items-center justify-content-center bg-light text-primary me-3 fw-bold" style={{ width: '40px', height: '40px', overflow: 'hidden' }}>
                                        {selectedUser.profile_image ? <img src={selectedUser.profile_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : selectedUser.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h6 className="mb-0 fw-bold">{selectedUser.name}</h6>
                                        <div className="small text-muted">{selectedUser.role}</div>
                                    </div>
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
                                                return (
                                                    <div key={index} className={`d-flex ${isMine ? 'justify-content-end' : 'justify-content-start'}`}>
                                                        <div
                                                            className={`p-3 rounded-4 shadow-sm border ${isMine ? 'bg-primary text-white rounded-br-0' : 'bg-white text-dark rounded-bl-0'}`}
                                                            style={{ maxWidth: '70%', borderRadius: '1rem', borderBottomRightRadius: isMine ? '0' : '1rem', borderBottomLeftRadius: isMine ? '1rem' : '0' }}
                                                        >
                                                            <div className="text-break">{msg.content}</div>
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
                                            type="text"
                                            className="form-control rounded-pill bg-light border-0 px-4"
                                            placeholder={`Message ${selectedUser.name}...`}
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                        />
                                        <button type="submit" className="btn btn-primary rounded-circle shadow-sm d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }} disabled={!newMessage.trim()}>
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
