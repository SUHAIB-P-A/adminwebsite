import React from 'react';
import { NavLink } from 'react-router-dom';
import './adminpanel/AdminPanel.css'; // Reusing AdminPanel css for now, or could share styles

const Sidebar = () => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2', path: '/dashboard' },
        { id: 'students', label: 'Students', icon: 'bi-people', path: '/students' },
        { id: 'enquiries', label: 'Enquiries', icon: 'bi-file-text', path: '/enquiries' },
        { id: 'settings', label: 'Settings', icon: 'bi-gear', path: '/settings' },
    ];

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                {/* Placeholder for Logo if needed, uses abstract shape or text for now */}
                <div className="sidebar-logo-area">
                    <span className="logo-placeholder"></span>
                </div>
            </div>
            <ul className="nav flex-column sidebar-nav">
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
    );
};

export default Sidebar;
