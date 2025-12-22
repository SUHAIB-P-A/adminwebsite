import React, { useState } from 'react';
import Sidebar from '../Sidebar';
import Students from '../Students';
import Enquiries from '../Enquiries';
import './AdminPanel.css';

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState('students'); // Default to students for now

    const renderContent = () => {
        switch (activeTab) {
            case 'students':
                return <Students />;
            case 'enquiries':
                return <Enquiries />;
            case 'dashboard':
                return <div className="p-4"><h2>Dashboard</h2></div>;
            case 'settings':
                return <div className="p-4"><h2>Settings</h2></div>;
            default:
                return <Students />;
        }
    };

    return (
        <div className="app-container">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
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
                {renderContent()}
            </main>
        </div>
    );
};

export default AdminPanel;
