import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import './AdminPanel.css';

const NotificationPopover = ({ onClose }) => {
    const navigate = useNavigate();
    const [view, setView] = useState('list'); // 'list' or 'send'
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    // Send Mode State
    const [sendData, setSendData] = useState({ title: '', message: '', recipient_id: 'all' });
    const [sendLoading, setSendLoading] = useState(false);
    const [role, setRole] = useState(localStorage.getItem('role'));

    const fetchNotifications = async () => {
        const staffId = localStorage.getItem('staff_id');
        if (!staffId) return;

        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
            const response = await fetch(`${API_BASE_URL}/api/notifications/`, {
                headers: { 'X-Staff-ID': staffId }
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error("Error fetching notifications", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleItemClick = async (notif) => {
        if (!notif.is_read) {
            try {
                const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
                await fetch(`${API_BASE_URL}/api/notifications/${notif.id}/read/`, { method: 'POST' });
                // Optimistically update
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
            } catch (error) {
                console.error("Failed to mark read");
            }
        }

        if (notif.link) {
            navigate(notif.link);
            onClose();
        }
    };

    const handleSendNotification = async (e) => {
        e.preventDefault();
        const staffId = localStorage.getItem('staff_id');
        if (!staffId) return;

        setSendLoading(true);
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
            const response = await fetch(`${API_BASE_URL}/api/notifications/send/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Staff-ID': staffId
                },
                body: JSON.stringify({
                    sender_id: staffId,
                    ...sendData
                })
            });

            if (response.ok) {
                alert("Notification sent!");
                setSendData({ title: '', message: '', recipient_id: 'all' });
                setView('list');
            } else {
                alert("Failed to send.");
            }
        } catch (error) {
            console.error("Error sending notification");
        } finally {
            setSendLoading(false);
        }
    };

    return (
        <div className="card position-absolute shadow-lg p-0 border-0 fade-in"
            style={{
                top: '50px',
                right: '50px',
                width: '320px',
                zIndex: 1050,
                borderRadius: '15px',
                maxHeight: '450px',
                overflowY: 'auto'
            }}>
            <div className="p-3 border-bottom bg-light sticky-top d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold">{view === 'send' ? 'Send Alert' : 'Notifications'}</h6>
                {(role === 'admin' || role === 'Admin') && (
                    <button
                        className="btn btn-sm btn-outline-primary py-0"
                        style={{ fontSize: '0.8rem' }}
                        onClick={() => setView(view === 'list' ? 'send' : 'list')}
                    >
                        {view === 'list' ? '+ Send' : 'Cancel'}
                    </button>
                )}
            </div>

            {view === 'send' ? (
                <div className="p-3">
                    <form onSubmit={handleSendNotification}>
                        <div className="mb-2">
                            <label className="form-label small">Recipient</label>
                            <select
                                className="form-select form-select-sm"
                                value={sendData.recipient_id}
                                onChange={(e) => setSendData({ ...sendData, recipient_id: e.target.value })}
                            >
                                <option value="all">All Staff</option>
                                {/* We could fetch staff list here, but keeping it simple for now */}
                            </select>
                        </div>
                        <div className="mb-2">
                            <label className="form-label small">Title</label>
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                required
                                value={sendData.title}
                                onChange={(e) => setSendData({ ...sendData, title: e.target.value })}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small">Message</label>
                            <textarea
                                className="form-control form-control-sm"
                                rows="3"
                                required
                                value={sendData.message}
                                onChange={(e) => setSendData({ ...sendData, message: e.target.value })}
                            ></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm w-100" disabled={sendLoading}>
                            {sendLoading ? 'Sending...' : 'Send Notification'}
                        </button>
                    </form>
                </div>
            ) : (
                loading ? (
                    <div className="p-4 text-center text-muted">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted">
                        <i className="bi bi-bell-slash fs-4 d-block mb-2"></i>
                        No notifications
                    </div>
                ) : (
                    <div className="list-group list-group-flush">
                        {notifications.map(notif => (
                            <div
                                key={notif.id}
                                className={`list-group-item list-group-item-action p-3 ${!notif.is_read ? 'bg-primary-subtle' : ''}`}
                                onClick={() => handleItemClick(notif)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="d-flex w-100 justify-content-between mb-1">
                                    <small className={`fw-bold ${!notif.is_read ? 'text-primary' : 'text-muted'}`}>
                                        {notif.title}
                                    </small>
                                    <small className="text-muted" style={{ fontSize: '0.7em' }}>
                                        {new Date(notif.created_at).toLocaleDateString()}
                                    </small>
                                </div>
                                <p className="mb-1 small text-secondary">{notif.message}</p>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
};

NotificationPopover.propTypes = {
    onClose: PropTypes.func.isRequired,
};

export default NotificationPopover;
