import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../adminpanel/AdminPanel.css';

const Sidebar = ({ isOpen, closeSidebar }) => {
    const navigate = useNavigate();
    const [role, setRole] = useState('');
    const [name, setName] = useState('');
    const [image, setImage] = useState(null);

    useEffect(() => {
        const loadUserInfo = () => {
            setRole(localStorage.getItem('role') || 'staff');
            setName(localStorage.getItem('staff_name') || 'User');
            setImage(localStorage.getItem('staff_image'));
        };

        loadUserInfo();

        const handleUserInfoUpdate = () => {
            loadUserInfo();
        };

        window.addEventListener('userInfoUpdated', handleUserInfoUpdate);

        return () => {
            window.removeEventListener('userInfoUpdated', handleUserInfoUpdate);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('staff_id');
        localStorage.removeItem('role');
        navigate('/');
    };

    const isAdmin = role === 'admin' || role === 'Admin';

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2', path: '/portal/dashboard' },
        ...(isAdmin ? [{ id: 'staff', label: 'Staff Management', icon: 'bi-people-fill', path: '/portal/staff' }] : []),
        { id: 'students', label: 'Students', icon: 'bi-people', path: '/portal/students' },
        { id: 'enquiries', label: 'Enquiries', icon: 'bi-file-text', path: '/portal/enquiries' },
        { id: 'settings', label: 'Settings', icon: 'bi-gear', path: '/portal/settings' },
    ];

    return (
        <div className={`sidebar d-flex flex-column justify-content-between ${isOpen ? 'show' : ''}`}>
            <div>
                <div className="sidebar-header d-flex justify-content-between align-items-start">
                    <div className="sidebar-logo-area d-flex flex-column align-items-center text-center w-100">
                        <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', color: '#333' }}>
                            {image ? (
                                <img src={image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <i className="bi bi-person-circle fs-1"></i>
                            )}
                        </div>
                        <div className="mt-2 text-white">
                            <small className="d-block opacity-75" style={{ fontSize: '0.75rem' }}>WELCOME</small>
                            <h5 className="mb-0 fw-bold">{name}</h5>
                        </div>
                    </div>
                    {/* Close button for mobile */}
                    <button className="btn btn-link text-white d-md-none position-absolute top-0 end-0 p-3" onClick={closeSidebar}>
                        <i className="bi bi-x-lg fs-4"></i>
                    </button>
                </div>
                <ul className="nav flex-column sidebar-nav mt-3">
                    {menuItems.map((item) => (
                        <li className="nav-item" key={item.id}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                onClick={() => {
                                    if (window.innerWidth < 768) closeSidebar();
                                }}
                            >
                                <i className={`bi ${item.icon} me-2`}></i>
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="p-3">
                <button className="btn btn-outline-light w-100 rounded-pill d-flex align-items-center justify-content-center gap-2" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right"></i> Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
