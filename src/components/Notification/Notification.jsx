import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../adminpanel/AdminPanel.css'; // Reuse existing styles or specific ones

const Notification = () => {
    const role = localStorage.getItem('role');
    const isAdmin = role === 'admin' || role === 'Admin';
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        body: '',
        category: 'Event',
        priority: 'Normal',
        recipient: 'all' // Default to broadcast
    });
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
    const [staffList, setStaffList] = useState([]); // For selecting specific recipient if needed

    useEffect(() => {
        if (!isAdmin) {
            fetchNotifications();
        } else {
            // If admin, maybe fetch staff list for dropdown if we want specific selection
            fetchStaff();
            setLoading(false);
        }
    }, [isAdmin]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            // Ensure we are getting notifications for the logged in staff
            // Backend should handle filtering by user from auth token or session
            // But since we used query_param in view, we might need to pass ID if auth is not implicit
            const staffId = localStorage.getItem('staff_id');
            const params = staffId ? { recipient_id: staffId } : {};
            const { data } = await axios.get('/api/notifications/', { params });
            // Sort by created_at desc
            const sorted = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setNotifications(sorted);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
        setLoading(false);
    };

    const fetchStaff = async () => {
        try {
            const { data } = await axios.get('/api/staff/');
            setStaffList(data);
        } catch (err) {
            console.error("Failed to fetch staff", err);
        }
    };

    const showToast = (msg, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/notifications/', formData);
            showToast('Notification sent successfully!');
            setFormData({ title: '', body: '', category: 'Event', priority: 'Normal', recipient: 'all' });
        } catch (err) {
            console.error("Failed to send notification", err);
            showToast('Failed to send notification', 'danger');
        }
    };

    const handleMarkRead = async (id) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        try {
            await axios.patch(`/api/notifications/${id}/`, { is_read: true });
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    return (
        <div className="p-4 page-anime">
            <h1 className="page-title mb-4">Notifications</h1>

            {toast.show && (
                <div className={`toast-container position-fixed top-0 end-0 p-3`} style={{ zIndex: 1100 }}>
                    <div className={`toast show align-items-center text-white bg-${toast.type} border-0`} role="alert">
                        <div className="d-flex">
                            <div className="toast-body">{toast.msg}</div>
                            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast({ show: false })}></button>
                        </div>
                    </div>
                </div>
            )}

            {isAdmin ? (
                // Admin View: Send Form
                <div className="row justify-content-center">
                    <div className="col-md-8 col-lg-6">
                        <div className="custom-card card border-0 shadow-sm rounded-4">
                            <div className="card-body p-4">
                                <h5 className="card-title fw-bold mb-4 text-primary"><i className="bi bi-send-fill me-2"></i>Compose Notification</h5>
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold small text-secondary">Title</label>
                                        <input
                                            type="text"
                                            className="form-control rounded-pill"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            required
                                            placeholder="e.g. Staff Meeting Reminder"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold small text-secondary">Message</label>
                                        <textarea
                                            className="form-control rounded-4"
                                            rows="4"
                                            value={formData.body}
                                            onChange={e => setFormData({ ...formData, body: e.target.value })}
                                            required
                                            placeholder="Enter your message here..."
                                        ></textarea>
                                    </div>

                                    <div className="row g-3 mb-4">
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small text-secondary">Category</label>
                                            <select
                                                className="form-select rounded-pill"
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            >
                                                <option value="Event">Event</option>
                                                <option value="Alert">Alert</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small text-secondary">Priority</label>
                                            <select
                                                className="form-select rounded-pill"
                                                value={formData.priority}
                                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                            >
                                                <option value="Normal">Normal</option>
                                                <option value="High">High</option>
                                                <option value="Low">Low</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-bold small text-secondary">Recipient</label>
                                        <select
                                            className="form-select rounded-pill"
                                            value={formData.recipient}
                                            onChange={e => setFormData({ ...formData, recipient: e.target.value })}
                                        >
                                            <option value="all">All Staff</option>
                                            {/* Optional: Map individual staff if needed in future */}
                                            {staffList.map(s => (
                                                <option key={s.id} value={s.id}>{s.name} ({s.login_id})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <button type="submit" className="btn btn-primary w-100 rounded-pill py-2 fw-bold shadow-sm">
                                        Send Notification <i className="bi bi-arrow-right ms-2"></i>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // Staff View: List
                <div className="custom-card card border-0 shadow-sm rounded-4">
                    <div className="card-body p-0">
                        {loading ? (
                            <div className="text-center p-5">
                                <div className="spinner-border text-primary" role="status"></div>
                                <p className="mt-2 text-muted">Loading notifications...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center p-5 text-muted">
                                <i className="bi bi-bell-slash fs-1 d-block mb-3 text-secondary opacity-50"></i>
                                No notifications found.
                            </div>
                        ) : (
                            <div className="list-group list-group-flush rounded-4 overflow-hidden">
                                {notifications.map(n => (
                                    <div
                                        key={n.id}
                                        className={`list-group-item p-4 border-bottom ${!n.is_read ? 'bg-light' : ''}`}
                                        onClick={() => !n.is_read && handleMarkRead(n.id)}
                                        style={{ cursor: 'pointer', transition: 'all 0.2s', borderLeft: n.priority === 'High' ? '4px solid #dc3545' : n.category === 'Alert' ? '4px solid #ffc107' : '4px solid transparent' }}
                                    >
                                        <div className="d-flex w-100 justify-content-between align-items-center mb-2">
                                            <h5 className={`mb-1 ${!n.is_read ? 'fw-bold text-dark' : 'text-secondary'}`}>
                                                {n.title}
                                                {!n.is_read && <span className="badge bg-danger rounded-pill ms-2 small" style={{ fontSize: '0.6rem' }}>NEW</span>}
                                            </h5>
                                            <small className="text-muted">{new Date(n.created_at).toLocaleString()}</small>
                                        </div>
                                        <p className="mb-2 text-dark opacity-75">{n.body}</p>
                                        <div className="d-flex gap-2">
                                            <span className={`badge rounded-pill ${n.category === 'Alert' ? 'bg-warning text-dark' : 'bg-info text-white'}`} style={{ fontSize: '0.7rem' }}>
                                                {n.category}
                                            </span>
                                            {n.priority === 'High' && (
                                                <span className="badge rounded-pill bg-danger" style={{ fontSize: '0.7rem' }}>High Priority</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notification;
