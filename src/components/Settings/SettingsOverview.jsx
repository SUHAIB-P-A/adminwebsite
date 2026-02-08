import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useOutletContext } from 'react-router-dom';

const SettingsOverview = () => {
    const { user, notifications, toggleNotification, openLegalModal } = useOutletContext();
    const navigate = useNavigate();

    return (
        <div className="fade-in">
            <h2 className="settings-title mb-4">Settings</h2>

            {/* 1. Account Section */}
            <section className="settings-section">
                <h4 className="section-title"><i className="bi bi-person-circle me-2"></i> Account</h4>
                <div className="card settings-card account-card">
                    <div className="card-body d-flex align-items-center">
                        <div className="account-avatar">
                            {user.image ? (
                                <img src={user.image} alt="Profile" className="rounded-circle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <i className="bi bi-person-fill"></i>
                            )}
                        </div>
                        <div className="account-info ms-3">
                            <h5 className="mb-1">{user.name}</h5>
                            <p className="mb-0 text-muted role-badge">{user.role}</p>
                            {(user.email || user.phone) && (
                                <small className="d-block text-muted mt-1">
                                    {user.email && <span><i className="bi bi-envelope me-1"></i>{user.email}</span>}
                                    {user.email && user.phone && <span className="mx-2">|</span>}
                                    {user.phone && <span><i className="bi bi-telephone me-1"></i>{user.phone}</span>}
                                </small>
                            )}
                        </div>
                        <button
                            className="btn btn-outline-primary ms-auto btn-sm"
                            onClick={() => navigate('/portal/settings/profile/edit')}
                        >
                            View Profile
                        </button>
                    </div>
                </div>
            </section>

            {/* 2. Notifications Section */}
            <section className="settings-section mt-4">
                <h4 className="section-title"><i className="bi bi-bell me-2"></i> Notifications</h4>
                <div className="card settings-card">
                    <div className="card-body">
                        {user.role !== 'admin' && user.role !== 'Admin' && (
                            <div className="setting-item d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <h6 className="mb-0">Admin Notifications</h6>
                                    <small className="text-muted">Receive administrative updates and alerts</small>
                                </div>
                                <div className="form-check form-switch">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={notifications.admin}
                                        onChange={() => toggleNotification('admin')}
                                    />
                                </div>
                            </div>
                        )}
                        <div className="setting-item d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <h6 className="mb-0">Students Notifications</h6>
                                <small className="text-muted">Receive updates about new and existing students</small>
                            </div>
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={notifications.students}
                                    onChange={() => toggleNotification('students')}
                                />
                            </div>
                        </div>
                        <div className="setting-item d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="mb-0">Enquiry Notifications</h6>
                                <small className="text-muted">Receive notifications for new enquiries</small>
                            </div>
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={notifications.enquiry}
                                    onChange={() => toggleNotification('enquiry')}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Legal Section */}
            <section className="settings-section mt-4 mb-5">
                <h4 className="section-title"><i className="bi bi-shield-check me-2"></i> Legal</h4>
                <div className="card settings-card">
                    <div className="list-group list-group-flush">
                        <button
                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                            onClick={() => openLegalModal('privacy')}
                        >
                            Privacy Policy
                            <i className="bi bi-chevron-right"></i>
                        </button>
                        <button
                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                            onClick={() => openLegalModal('terms')}
                        >
                            Terms and Conditions
                            <i className="bi bi-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

SettingsOverview.propTypes = {};

export default SettingsOverview;
