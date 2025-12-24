import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';
import './AdminPanel.css';

const AdminPanel = () => {
    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                {/* Top header can be added here if needed, or inside pages */}
                <div className="d-flex justify-content-end p-3">
                    <div className="d-flex gap-3">
                        {/* Icons similar to top right of image */}
                        <button className="btn btn-light rounded-circle shadow-sm"><i className="bi bi-chat"></i></button>
                        <button className="btn btn-light rounded-circle shadow-sm"><i className="bi bi-bell"></i></button>
                        <button className="btn btn-light rounded-circle shadow-sm"><i className="bi bi-person"></i></button>
                    </div>
                </div>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminPanel;
