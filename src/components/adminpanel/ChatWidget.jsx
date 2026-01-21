import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './AdminPanel.css';

const ChatWidget = ({ onClose }) => {
    const [view, setView] = useState('contacts'); // 'contacts' or 'chat'
    const [contacts, setContacts] = useState([]);
    const [activeContact, setActiveContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef(null);
    const staffId = localStorage.getItem('staff_id');

    // Scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch Contacts
    const fetchContacts = async () => {
        if (!staffId) return;
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
            const response = await fetch(`${API_BASE_URL}/api/chat/contacts/`, {
                headers: { 'X-Staff-ID': staffId }
            });
            if (response.ok) {
                const data = await response.json();
                setContacts(data);
            }
        } catch (error) {
            console.error("Error fetching contacts");
        }
    };

    // Fetch Messages
    const fetchMessages = async () => {
        if (!activeContact || !staffId) return;
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
            const response = await fetch(`${API_BASE_URL}/api/chat/messages/${activeContact.id}/`, {
                headers: { 'X-Staff-ID': staffId }
            });
            if (response.ok) {
                const data = await response.json();
                setMessages(data);
            }
        } catch (error) {
            console.error("Error fetching messages");
        }
    };

    useEffect(() => {
        fetchContacts();
        const interval = setInterval(fetchContacts, 5000); // Poll contacts every 5s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let interval;
        if (activeContact) {
            setLoading(true);
            fetchMessages().finally(() => setLoading(false));
            interval = setInterval(fetchMessages, 3000); // Poll messages every 3s
        }
        return () => clearInterval(interval);
    }, [activeContact]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeContact) return;

        try {
            const payload = {
                sender: staffId,
                receiver: activeContact.id,
                message: newMessage
            };

            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
            const response = await fetch(`${API_BASE_URL}/api/chat/send/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setNewMessage('');
                fetchMessages(); // Refresh immediately
            }
        } catch (error) {
            console.error("Error sending message");
        }
    };

    return (
        <div className="card position-absolute shadow-lg border-0 fade-in d-flex flex-column"
            style={{
                top: '50px',
                right: '100px',
                width: '350px',
                height: '500px',
                zIndex: 1050,
                borderRadius: '15px',
                overflow: 'hidden'
            }}>

            {/* Header */}
            <div className="p-3 bg-primary text-white d-flex justify-content-between align-items-center">
                {view === 'chat' ? (
                    <div className="d-flex align-items-center gap-2">
                        <button className="btn btn-sm btn-light rounded-circle" onClick={() => { setView('contacts'); setActiveContact(null); }}>
                            <i className="bi bi-arrow-left"></i>
                        </button>
                        <span className="fw-bold">{activeContact?.name}</span>
                    </div>
                ) : (
                    <span className="fw-bold"><i className="bi bi-chat-dots me-2"></i> Team Chat</span>
                )}
                <button className="btn btn-sm text-white" onClick={onClose}><i className="bi bi-x-lg"></i></button>
            </div>

            {/* Body */}
            <div className="flex-grow-1 overflow-auto bg-light">
                {view === 'contacts' ? (
                    <div className="list-group list-group-flush">
                        {contacts.map(contact => (
                            <button
                                key={contact.id}
                                className="list-group-item list-group-item-action border-0 d-flex justify-content-between align-items-center p-3"
                                onClick={() => { setActiveContact(contact); setView('chat'); }}
                            >
                                <div className="d-flex align-items-center">
                                    <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-3"
                                        style={{ width: '40px', height: '40px' }}>
                                        {contact.name.charAt(0)}
                                    </div>
                                    <div className="text-start">
                                        <div className="fw-bold">{contact.name}</div>
                                        <small className="text-muted">{contact.role}</small>
                                    </div>
                                </div>
                                {contact.unread_chat_count > 0 && (
                                    <span className="badge bg-danger rounded-pill">{contact.unread_chat_count}</span>
                                )}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="p-3 d-flex flex-column gap-2">
                        {messages.map((msg, idx) => {
                            const isMe = msg.sender.toString() === staffId.toString();
                            return (
                                <div key={idx} className={`d-flex ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
                                    <div
                                        className={`p-2 px-3 rounded-3 shadow-sm ${isMe ? 'bg-primary text-white' : 'bg-white text-dark'}`}
                                        style={{ maxWidth: '80%', wordBreak: 'break-word' }}
                                    >
                                        <p className="mb-0 small">{msg.message}</p>
                                        <small className={`d-block text-end ${isMe ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.6rem' }}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </small>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area (Only in Chat view) */}
            {view === 'chat' && (
                <div className="p-2 border-top bg-white">
                    <form onSubmit={handleSendMessage} className="d-flex gap-2">
                        <input
                            type="text"
                            className="form-control form-control-sm rounded-pill"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary btn-sm rounded-circle shadow-sm" disabled={!newMessage.trim()}>
                            <i className="bi bi-send-fill"></i>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

ChatWidget.propTypes = {
    onClose: PropTypes.func.isRequired,
};

export default ChatWidget;
