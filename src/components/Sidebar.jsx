import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './adminpanel/AdminPanel.css';

const Sidebar = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState('');
    const [name, setName] = useState('');

    useEffect(() => {
        setRole(localStorage.getItem('role') || 'staff');
        setName(localStorage.getItem('staff_name') || 'User');
    }, []);

    const handleLogout = () => {
        localStorage.clear();
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
        <div className="sidebar d-flex flex-column justify-content-between">
            <div>
                <div className="sidebar-header">
                    <div className="sidebar-logo-area">
                        <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
                            <i className="bi bi-person-circle fs-4"></i>
                        </div>
                        <div className="ms-3 text-white">
                            <small className="d-block opacity-75" style={{ fontSize: '0.75rem' }}>WELCOME</small>
                            <h5 className="mb-0 fw-bold">{name}</h5>
                        </div>
                    </div>
                </div>
                <ul className="nav flex-column sidebar-nav mt-3">
                    {menuItems.map((item) => (
                        <li className="nav-item" key={item.id}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
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
