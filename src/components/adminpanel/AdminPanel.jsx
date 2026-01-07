import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import './AdminPanel.css';

const AdminPanel = () => {
    const navigate = useNavigate();
    const [showAccountCard, setShowAccountCard] = useState(false);
    const [user, setUser] = useState({
        name: '',
        role: '',
        image: null,
        email: '',
        phone: ''
    });

    useEffect(() => {
        const loadUserInfo = () => {
            setUser({
                name: localStorage.getItem('staff_name') || 'User',
                role: localStorage.getItem('role') || 'Staff',
                image: localStorage.getItem('staff_image'),
                email: localStorage.getItem('staff_email') || '',
                phone: localStorage.getItem('staff_phone') || ''
            });
        };

        loadUserInfo();

        const handleUserInfoUpdate = () => {
            loadUserInfo();
        };

        window.addEventListener('userInfoUpdated', handleUserInfoUpdate);
        return () => window.removeEventListener('userInfoUpdated', handleUserInfoUpdate);
    }, []);

    const toggleAccountCard = () => {
        setShowAccountCard(!showAccountCard);
    };

    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                {/* Top header */}
                <div className="d-flex justify-content-end p-3 position-relative">
                    <div className="d-flex gap-3 align-items-center">
                        {/* Icons */}
                        <button className="btn btn-light rounded-circle shadow-sm"><i className="bi bi-chat"></i></button>
                        <button className="btn btn-light rounded-circle shadow-sm"><i className="bi bi-bell"></i></button>

                        <div className="position-relative">
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
                                                navigate('/portal/settings?edit=true');
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
