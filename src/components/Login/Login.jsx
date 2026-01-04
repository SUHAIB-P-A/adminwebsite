import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './adminpanel/AdminPanel.css';

const Login = () => {
    const [credentials, setCredentials] = useState({ login_id: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const roleParam = searchParams.get('role'); // 'admin' or 'staff'
    const roleTitle = roleParam === 'admin' ? 'Admin Login' : (roleParam === 'staff' ? 'Staff Login' : 'Portal Login');
    const roleIcon = roleParam === 'admin' ? 'bi-shield-lock' : (roleParam === 'staff' ? 'bi-person-badge' : 'bi-person-lock');
    const accentColor = roleParam === 'admin' ? 'primary' : (roleParam === 'staff' ? 'success' : 'primary');

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data } = await axios.post('/api/staff-login/', credentials);

            // Strict Role Enforcement
            const userRole = (data.role || '').toLowerCase();
            const intendedRole = (roleParam || '').toLowerCase();

            if (intendedRole === 'admin' && userRole !== 'admin') {
                throw { response: { data: { error: 'Access Denied: Only Admins can login here.' } } };
            }

            if (intendedRole === 'staff' && userRole !== 'staff') {
                throw { response: { data: { error: 'Access Denied: Admins must use the Admin Login portal.' } } };
            }

            localStorage.setItem('role', userRole);
            localStorage.setItem('staff_id', data.staff_id || '');
            localStorage.setItem('staff_name', data.name || 'User');

            navigate('/portal/students');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check credentials.');
        }
        setLoading(false);
    };

    return (
        <div className="d-flex align-items-center justify-content-center vh-100 bg-light page-anime">
            <div className="card border-0 shadow-lg p-4" style={{ maxWidth: '400px', width: '100%', borderRadius: '15px' }}>
                <div className="text-center mb-4">
                    <div className={`bg-${accentColor} text-white rounded-circle d-inline-flex align-items-center justify-content-center shadow-sm`} style={{ width: '64px', height: '64px' }}>
                        <i className={`bi ${roleIcon} fs-2`}></i>
                    </div>
                    <h3 className="fw-bold mt-3">{roleTitle}</h3>
                    <p className="text-muted small">Enter your credentials to access</p>
                </div>

                {error && <div className="alert alert-danger py-2 small">{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label className="form-label small fw-bold text-secondary">Login ID</label>
                        <div className="input-group">
                            <span className={`input-group-text bg-light border-end-0 text-${accentColor}`}><i className="bi bi-person"></i></span>
                            <input
                                type="text"
                                className="form-control border-start-0 ps-0"
                                name="login_id"
                                placeholder="e.g. admin or staff"
                                value={credentials.login_id}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="form-label small fw-bold text-secondary">Password</label>
                        <div className="input-group">
                            <span className={`input-group-text bg-light border-end-0 text-${accentColor}`}><i className="bi bi-key"></i></span>
                            <input
                                type="password"
                                className="form-control border-start-0 ps-0"
                                name="password"
                                placeholder="••••••••"
                                value={credentials.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                    <button className={`btn btn-${accentColor} w-100 rounded-pill fw-bold`} disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>

                    <div className="text-center mt-3">
                        <span className="text-muted small cursor-pointer hover-underline" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                            <i className="bi bi-arrow-left me-1"></i> Back to Home
                        </span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
