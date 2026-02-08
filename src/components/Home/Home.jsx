import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="d-flex flex-column align-items-center justify-content-center vh-100 bg-light page-anime">
            <div className="text-center mb-5">
                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center shadow-lg mb-4" style={{ width: '80px', height: '80px' }}>
                    <i className="bi bi-buildings fs-1"></i>
                </div>
                <h1 className="display-4 fw-bold text-dark">Welcome</h1>
                <p className="lead text-muted">Admin & Staff Management Portal</p>
            </div>

            <div className="row g-4 justify-content-center w-100" style={{ maxWidth: '800px' }}>
                <div className="col-md-5">
                    <div
                        className="card h-100 border-0 shadow-lg hover-scale cursor-pointer"
                        onClick={() => navigate('/login?role=admin')}
                        style={{ borderRadius: '20px', transition: 'transform 0.2s' }}
                    >
                        <div className="card-body p-5 text-center">
                            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '70px', height: '70px' }}>
                                <i className="bi bi-shield-lock fs-2"></i>
                            </div>
                            <h3 className="fw-bold mb-3">Admin Login</h3>
                            <p className="text-muted small">Manage staff, view all students, and system configuration.</p>
                            <button className="btn btn-primary rounded-pill px-4 mt-2">Login as Admin</button>
                        </div>
                    </div>
                </div>

                <div className="col-md-5">
                    <div
                        className="card h-100 border-0 shadow-lg hover-scale cursor-pointer"
                        onClick={() => navigate('/login?role=staff')}
                        style={{ borderRadius: '20px', transition: 'transform 0.2s' }}
                    >
                        <div className="card-body p-5 text-center">
                            <div className="bg-success bg-opacity-10 text-success rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '70px', height: '70px' }}>
                                <i className="bi bi-person-badge fs-2"></i>
                            </div>
                            <h3 className="fw-bold mb-3">Staff Login</h3>
                            <p className="text-muted small">View assigned students and manage your daily tasks.</p>
                            <button className="btn btn-success rounded-pill px-4 mt-2">Login as Staff</button>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="mt-5 text-muted small">
                &copy; {new Date().getFullYear()} Admin Portal
            </footer>
        </div>
    );
};

export default Home;
