import React from 'react';
import './adminpanel/AdminPanel.css'; // Reusing AdminPanel css for now, or could share styles

const Sidebar = ({ activeTab, setActiveTab }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
        { id: 'students', label: 'Students', icon: 'bi-people' },
        { id: 'enquiries', label: 'Enquiries', icon: 'bi-file-text' },
        { id: 'settings', label: 'Settings', icon: 'bi-gear' },
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
                        <button
                            className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            <i className={`bi ${item.icon} me-2`}></i>
                            {item.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;
