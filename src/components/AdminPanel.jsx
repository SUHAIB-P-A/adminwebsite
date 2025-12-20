import React, { useState } from 'react';
import './AdminPanel.css';

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState('enquiry');

    // Mock data for Enquiry List
    const enquiryData = [
        { id: 1, name: "Alice Johnson", phone: "+1 555-0101", email: "alice@example.com", address: "123 Maple Ave", city: "New York", status: "Active" },
        { id: 2, name: "Bob Smith", phone: "+1 555-0102", email: "bob@example.com", address: "456 Oak Dr", city: "Los Angeles", status: "Review" },
        { id: 3, name: "Charlie Brown", phone: "+1 555-0103", email: "charlie@example.com", address: "789 Pine Ln", city: "Chicago", status: "Closed" },
        { id: 4, name: "Diana Prince", phone: "+1 555-0104", email: "diana@example.com", address: "321 Cedar Blvd", city: "Houston", status: "Active" },
        { id: 5, name: "Evan Wright", phone: "+1 555-0105", email: "evan@example.com", address: "654 Elm St", city: "Phoenix", status: "Review" },
    ];

    // Mock data for Collage Enquiry List
    const collageData = [
        { id: 1, name: "Michael Scott", phone: "+1 555-0201", email: "michael@dunder.com", address: "1725 Slough Ave", city: "Scranton", status: "Active" },
        { id: 2, name: "Pam Beesly", phone: "+1 555-0202", email: "pam@dunder.com", address: "123 Art Way", city: "New York", status: "Active" },
        { id: 3, name: "Jim Halpert", phone: "+1 555-0203", email: "jim@dunder.com", address: "456 Sport Rd", city: "Philadelphia", status: "Closed" },
        { id: 4, name: "Dwight Schrute", phone: "+1 555-0204", email: "dwight@farms.com", address: "99 Beet Farm", city: "Scranton", status: "Review" },
    ];

    const getStatusBadge = (status) => {
        let className = 'status-badge ';
        if (status === 'Active') className += 'active';
        else if (status === 'Review') className += 'maintenance';
        else className += 'error';
        return <span className={className}>{status}</span>;
    };

    const currentData = activeTab === 'enquiry' ? enquiryData : collageData;

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center stat-header">
                <div>
                    <h1 className="page-title">Admin Dashboard</h1>
                    <p className="text-secondary mb-0">Manage your enquiries and listings</p>
                </div>
                <div>
                    <input
                        type="text"
                        className="form-control search-input"
                        placeholder="Search enquiries..."
                    />
                </div>
            </div>

            <div className="custom-card">
                {/* Tabs */}
                <ul className="nav custom-tabs mb-4">
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'enquiry' ? 'active' : ''}`}
                            onClick={() => setActiveTab('enquiry')}
                        >
                            Enquiry List
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'collage' ? 'active' : ''}`}
                            onClick={() => setActiveTab('collage')}
                        >
                            Collage Enquiry List
                        </button>
                    </li>
                </ul>

                {/* Table */}
                <div className="table-responsive">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>Address</th>
                                <th>City</th>
                                <th>Status</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map((row, index) => (
                                <tr key={row.id}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <div className="avatar-initials">
                                                {row.name.charAt(0)}
                                            </div>
                                            <span className="fw-bold">{row.name}</span>
                                        </div>
                                    </td>
                                    <td>{row.phone}</td>
                                    <td>{row.email}</td>
                                    <td>{row.address}</td>
                                    <td>{row.city}</td>
                                    <td>{getStatusBadge(row.status)}</td>
                                    <td className="text-end">
                                        <button className="btn btn-link text-secondary p-0">
                                            <i className="bi bi-three-dots-vertical"></i>
                                            ⋮
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {currentData.length === 0 && (
                        <div className="text-center p-5 text-secondary">
                            No enquiries found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
