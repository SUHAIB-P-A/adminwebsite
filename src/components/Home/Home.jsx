import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();
    const [showSelector, setShowSelector] = useState(false);
    const [activeModal, setActiveModal] = useState(null); // 'admin' | 'employee' | 'organization'
    const [credentials, setCredentials] = useState({ login_id: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const resetForm = () => {
        setCredentials({ login_id: '', password: '' });
        setError('');
        setLoading(false);
        setShowPassword(false);
    };

    const openModal = (type) => {
        resetForm();
        setShowSelector(false);
        setActiveModal(type);
    };

    const closeAll = () => {
        setShowSelector(false);
        setActiveModal(null);
        resetForm();
    };

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (activeModal === 'organization') {
                // Organization login
                const { data } = await axios.post('/api/org-login/', credentials);
                localStorage.setItem('org_id', data.org_id);
                localStorage.setItem('org_name', data.org_name);
                localStorage.setItem('org_login_id', data.login_id);
                localStorage.setItem('role', 'organization');
                navigate('/org/students');
            } else {
                // Admin / Employee login (existing flow)
                const { data } = await axios.post('/api/staff-login/', credentials);
                const userRole = (data.role || '').toLowerCase();
                const intendedRole = activeModal === 'admin' ? 'admin' : 'staff';

                if (intendedRole === 'admin' && userRole !== 'admin') {
                    throw { response: { data: { error: 'Access Denied: Only Admins can login here.' } } };
                }
                if (intendedRole === 'staff' && userRole !== 'staff') {
                    throw { response: { data: { error: 'Access Denied: Admins must use the Admin Login portal.' } } };
                }

                localStorage.setItem('role', userRole);
                localStorage.setItem('staff_id', data.staff_id || '');
                localStorage.setItem('staff_name', data.name || (userRole === 'admin' ? 'Administrator' : 'User'));
                localStorage.setItem('staff_email', data.email || '');
                localStorage.setItem('staff_phone', data.phone || '');
                localStorage.setItem('staff_dob', data.dob || '');
                localStorage.setItem('staff_gender', data.gender || '');
                if (data.image) {
                    try { localStorage.setItem('staff_image', data.image); } catch { localStorage.removeItem('staff_image'); }
                } else {
                    localStorage.removeItem('staff_image');
                }
                navigate('/portal/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check credentials.');
        }
        setLoading(false);
    };

    const modalConfig = {
        admin: {
            title: 'Admin Login',
            icon: 'bi-shield-lock-fill',
            color: '#4f46e5',
            gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            desc: 'Access the full admin portal',
        },
        employee: {
            title: 'Employee Login',
            icon: 'bi-person-badge-fill',
            color: '#059669',
            gradient: 'linear-gradient(135deg, #059669, #10b981)',
            desc: 'Access your staff dashboard',
        },
        organization: {
            title: 'Organization Login',
            icon: 'bi-building-fill',
            color: '#d97706',
            gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
            desc: 'View student data for your college',
        },
    };

    const cfg = activeModal ? modalConfig[activeModal] : null;

    return (
        <div className="home-root">
            {/* Full-screen Background */}
            <div className="home-bg" style={{ backgroundImage: "url('/home.jpg')" }} />
            <div className="home-overlay" />

            {/* Center Content */}
            <div className="home-center">
                {/* Logo Card */}
                <div className="home-logo-card">
                    <img src="/neuca.jpg" alt="Neuca Logo" className="home-logo-img" />
                    <div className="home-logo-divider" />
                    <p className="home-tagline">Management Portal</p>
                    <button className="home-login-btn" onClick={() => setShowSelector(true)}>
                        <i className="bi bi-box-arrow-in-right me-2" />
                        Login
                    </button>
                </div>
            </div>

            {/* Login Selector Popup */}
            {showSelector && (
                <div className="home-modal-backdrop" onClick={closeAll}>
                    <div className="home-selector-popup" onClick={e => e.stopPropagation()}>
                        <button className="home-close-btn" onClick={closeAll}>
                            <i className="bi bi-x-lg" />
                        </button>
                        <h5 className="home-selector-title">Select Login Type</h5>
                        <p className="home-selector-sub">Choose how you want to log in</p>

                        <div className="home-selector-options">
                            <button className="home-option-btn admin-opt" onClick={() => openModal('admin')}>
                                <div className="home-opt-icon">
                                    <i className="bi bi-shield-lock-fill" />
                                </div>
                                <div className="home-opt-text">
                                    <span className="home-opt-title">Admin Login</span>
                                    <span className="home-opt-desc">Full system access</span>
                                </div>
                                <i className="bi bi-chevron-right home-opt-arrow" />
                            </button>

                            <button className="home-option-btn employee-opt" onClick={() => openModal('employee')}>
                                <div className="home-opt-icon">
                                    <i className="bi bi-person-badge-fill" />
                                </div>
                                <div className="home-opt-text">
                                    <span className="home-opt-title">Employee Login</span>
                                    <span className="home-opt-desc">Staff portal access</span>
                                </div>
                                <i className="bi bi-chevron-right home-opt-arrow" />
                            </button>

                            <button className="home-option-btn org-opt" onClick={() => openModal('organization')}>
                                <div className="home-opt-icon">
                                    <i className="bi bi-building-fill" />
                                </div>
                                <div className="home-opt-text">
                                    <span className="home-opt-title">Organization Login</span>
                                    <span className="home-opt-desc">College / Org access</span>
                                </div>
                                <i className="bi bi-chevron-right home-opt-arrow" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Login Modal */}
            {activeModal && cfg && (
                <div className="home-modal-backdrop" onClick={closeAll}>
                    <div className="home-login-modal" onClick={e => e.stopPropagation()}>
                        <button className="home-close-btn" onClick={closeAll}>
                            <i className="bi bi-x-lg" />
                        </button>

                        <div className="home-modal-header" style={{ background: cfg.gradient }}>
                            <div className="home-modal-icon">
                                <i className={`bi ${cfg.icon}`} />
                            </div>
                            <h4 className="home-modal-title">{cfg.title}</h4>
                            <p className="home-modal-desc">{cfg.desc}</p>
                        </div>

                        <div className="home-modal-body">
                            {error && (
                                <div className="home-error-alert">
                                    <i className="bi bi-exclamation-triangle-fill me-2" />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleLogin}>
                                <div className="home-form-group">
                                    <label className="home-form-label">
                                        <i className="bi bi-person me-1" /> Login ID
                                    </label>
                                    <input
                                        type="text"
                                        className="home-form-input"
                                        name="login_id"
                                        placeholder="Enter your login ID"
                                        value={credentials.login_id}
                                        onChange={handleChange}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="home-form-group">
                                    <label className="home-form-label">
                                        <i className="bi bi-key me-1" /> Password
                                    </label>
                                    <div className="home-input-wrapper">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className="home-form-input"
                                            name="password"
                                            placeholder="Enter your password"
                                            value={credentials.password}
                                            onChange={handleChange}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="home-eye-btn"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="home-submit-btn"
                                    style={{ background: cfg.gradient }}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Logging in...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-box-arrow-in-right me-2" />
                                            Login
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    className="home-back-btn"
                                    onClick={() => { setActiveModal(null); setShowSelector(true); resetForm(); }}
                                >
                                    <i className="bi bi-arrow-left me-1" /> Back to options
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <footer className="home-footer">
                © {new Date().getFullYear()} Neuca. All rights reserved.
            </footer>
        </div>
    );
};

export default Home;
