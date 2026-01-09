import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import './AdminPanel.css';
import axios from 'axios';

const AdminPanel = () => {
    const navigate = useNavigate();
    const [showAccountCard, setShowAccountCard] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [user, setUser] = useState({
        name: '', role: '', image: null, email: '', phone: ''
    });
    const [notificationCount, setNotificationCount] = useState(0);
    const [chatCount, setChatCount] = useState(0);
    const accountRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (accountRef.current && !accountRef.current.contains(event.target)) {
                setShowAccountCard(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const loadUserInfo = async () => {
            // 1. Initial Load from Local Storage (Fast)
            const localUser = {
                name: localStorage.getItem('staff_name') || 'User',
                role: localStorage.getItem('role') || 'Staff',
                image: localStorage.getItem('staff_image'),
                email: localStorage.getItem('staff_email') || '',
                phone: localStorage.getItem('staff_phone') || ''
            };
            setUser(prev => ({ ...prev, ...localUser }));

            // 2. Background Fetch for Fresh Data
            const staffId = localStorage.getItem('staff_id');
            if (staffId && staffId !== 'local') {
                try {
                    const response = await axios.get(`/api/staff/${staffId}/`);
                    const data = response.data;
                    setUser(prev => ({
                        ...prev,
                        name: data.name || prev.name,
                        role: data.role || prev.role,
                        email: data.email || prev.email,
                        phone: data.phone || prev.phone,
                        image: data.profile_image || prev.image
                    }));
                } catch (error) {
                    console.error("Failed to fetch background user info", error);
                }
            }
        };

        loadUserInfo();

        const handleUserInfoUpdate = () => {
            loadUserInfo();
        };

        window.addEventListener('userInfoUpdated', handleUserInfoUpdate);
        return () => window.removeEventListener('userInfoUpdated', handleUserInfoUpdate);
    }, []);

    // Chat Count Polling
    useEffect(() => {
        const fetchChatCount = async () => {
            const staffId = localStorage.getItem('staff_id');
            if (staffId && staffId !== 'local') {
                try {
                    const { data } = await axios.get('/api/chat/unread_count/', { params: { user_id: staffId } });
                    setChatCount(data.count);
                } catch (err) {
                    // Suppress
                }
            }
        };

        fetchChatCount();
        const interval = setInterval(fetchChatCount, 5000); // Poll more frequently for chat (5s)

        const handleChatRead = (e) => {
            // Optimistic update
            if (e.detail && e.detail.count) {
                setChatCount(prev => Math.max(0, prev - e.detail.count));
            }
            // Fetch fresh data after a short delay to ensure DB consistency
            setTimeout(fetchChatCount, 1000);
        };
        window.addEventListener('chatRead', handleChatRead);

        return () => {
            clearInterval(interval);
            window.removeEventListener('chatRead', handleChatRead);
        };
    }, []);

    // Notification Polling
    useEffect(() => {
        const fetchNotificationCount = async () => {
            const staffId = localStorage.getItem('staff_id');
            const role = localStorage.getItem('role');

            // Don't fetch for admin
            if (role === 'admin' || role === 'Admin') return;

            if (staffId && staffId !== 'local') {
                try {
                    const { data } = await axios.get('/api/notifications/', { params: { recipient_id: staffId } });
                    // Filter unread
                    const unread = data.filter(n => !n.is_read).length;
                    setNotificationCount(unread);
                } catch (err) {
                    // console.error("Failed to fetch notifications", err); // Suppress frequent errors
                }
            }
        };

        fetchNotificationCount();
        const interval = setInterval(fetchNotificationCount, 15000); // Poll every 15s to keep count updated

        const handleNotificationRead = () => {
            fetchNotificationCount();
        };
        window.addEventListener('notificationRead', handleNotificationRead);

        return () => {
            clearInterval(interval);
            window.removeEventListener('notificationRead', handleNotificationRead);
        };
    }, []);

    const toggleAccountCard = () => {
        setShowAccountCard(!showAccountCard);
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="app-container">
            {/* Backdrop for mobile */}
            {isSidebarOpen && <div className="sidebar-backdrop d-md-none" onClick={closeSidebar}></div>}

            <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} user={user} />

            <main className="main-content">
                {/* Top header */}
                <div className="d-flex justify-content-between justify-content-md-end p-3 position-relative align-items-center">
                    {/* Hamburger Menu (Mobile Only) */}
                    <button className="btn btn-light d-md-none rounded shadow-sm me-3" onClick={toggleSidebar}>
                        <i className="bi bi-list fs-4"></i>
                    </button>

                    <div className="d-flex gap-3 align-items-center">
                        {/* Icons */}
                        <button className="btn btn-light rounded-circle shadow-sm position-relative" onClick={() => navigate('/portal/chat')}>
                            <i className="bi bi-chat"></i>
                            {chatCount > 0 && (
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                                    {chatCount}
                                    <span className="visually-hidden">unread messages</span>
                                </span>
                            )}
                        </button>
                        <button className="btn btn-light rounded-circle shadow-sm position-relative" onClick={() => navigate('/portal/notifications')}>
                            <i className="bi bi-bell"></i>
                            {notificationCount > 0 && user.role !== 'admin' && user.role !== 'Admin' && (
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                                    {notificationCount}
                                    <span className="visually-hidden">unread messages</span>
                                </span>
                            )}
                        </button>

                        <div className="position-relative" ref={accountRef}>
                            <button
                                className={`btn ${showAccountCard ? 'btn-primary' : 'btn-light'} rounded-circle shadow-sm`}
                                onClick={toggleAccountCard}
                            >
                                <i className="bi bi-person"></i>
                            </button>

                            {/* Account Details Card Popover */}
                            {showAccountCard && (
                                <div className="card position-absolute shadow-lg p-3 border-0 fade-in"
                                    style={{
                                        top: '50px',
                                        right: '0',
                                        width: '300px',
                                        zIndex: 1050,
                                        borderRadius: '15px'
                                    }}>
                                    <div className="text-center mb-3">
                                        <div className="mx-auto mb-2" style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {user.image ? (
                                                <img src={user.image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <i className="bi bi-person-fill fs-1 text-secondary"></i>
                                            )}
                                        </div>
                                        <h5 className="fw-bold mb-1">{user.name}</h5>
                                        <span className="badge bg-primary-subtle text-primary rounded-pill px-3">{user.role}</span>
                                    </div>

                                    <div className="list-group list-group-flush small mb-3">
                                        {(user.email || user.phone) ? (
                                            <>
                                                {user.email && (
                                                    <div className="list-group-item px-0 py-2 border-0 d-flex align-items-center">
                                                        <i className="bi bi-envelope text-muted me-3 fs-6"></i>
                                                        <span className="text-truncate">{user.email}</span>
                                                    </div>
                                                )}
                                                {user.phone && (
                                                    <div className="list-group-item px-0 py-2 border-0 d-flex align-items-center">
                                                        <i className="bi bi-telephone text-muted me-3 fs-6"></i>
                                                        <span>{user.phone}</span>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-center text-muted small my-2">No contact info available</p>
                                        )}
                                    </div>

                                    <div className="d-grid">
                                        <button
                                            className="btn btn-outline-primary btn-sm rounded-pill"
                                            onClick={() => {
                                                navigate('/portal/settings/profile/edit');
                                                setShowAccountCard(false);
                                            }}
                                        >
                                            <i className="bi bi-gear me-2"></i> Manage Account
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminPanel;
