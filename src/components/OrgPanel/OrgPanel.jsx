import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './OrgPanel.css';

const OrgPanel = () => {
    const navigate = useNavigate();
    const orgName = localStorage.getItem('org_name') || 'Organization';

    const handleLogout = () => {
        localStorage.removeItem('org_id');
        localStorage.removeItem('org_name');
        localStorage.removeItem('org_login_id');
        localStorage.removeItem('role');
        navigate('/');
    };

    return (
        <div className="org-root">
            {/* Sidebar */}
            <aside className="org-sidebar">
                <div className="org-sidebar-header">
                    <img src="/neuca.jpg" alt="Logo" className="org-sidebar-logo" />
                    <div>
                        <div className="org-sidebar-title">Org Portal</div>
                        <div className="org-sidebar-name">{orgName}</div>
                    </div>
                </div>

                <nav className="org-nav">
                    <NavLink
                        to="/org/students"
                        className={({ isActive }) => `org-nav-item ${isActive ? 'active' : ''}`}
                    >
                        <i className="bi bi-people-fill" />
                        <span>Student Applications</span>
                    </NavLink>
                </nav>

                <div className="org-sidebar-footer">
                    <div className="org-user-badge">
                        <i className="bi bi-building-fill" />
                        <div>
                            <div className="org-user-name">{orgName}</div>
                            <div className="org-user-role">View Only Access</div>
                        </div>
                    </div>
                    <button className="org-logout-btn" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="org-main">
                <Outlet />
            </main>
        </div>
    );
};

export default OrgPanel;
