import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../adminpanel/AdminPanel.css'; // Reuse existing styles

const Dashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState({
        stats: {
            total_enquiries: 0, pending_enquiries: 0,
            total_students: 0, pending_students: 0
        },
        recent_enquiries: [],
        recent_students: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const userName = localStorage.getItem('staff_name') || 'Admin';

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const staffId = localStorage.getItem('staff_id');
                const role = localStorage.getItem('role');
                const params = { role, staff_id: staffId };

                const response = await axios.get('/api/dashboard/', { params });
                setData(response.data);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const StatCard = ({ title, count, pending, icon, color, onClick }) => (
        <div className="col-md-6 col-lg-6 mb-4" onClick={onClick} style={{ cursor: 'pointer' }}>
            <div className={`card border-0 shadow-sm h-100 overflow-hidden`}>
                <div className="card-body p-4 position-relative">
                    <div className="d-flex justify-content-between align-items-start">
                        <div>
                            <p className="text-secondary fw-bold text-uppercase small mb-1">{title}</p>
                            <h2 className="display-4 fw-bold mb-0">{count}</h2>
                            {pending > 0 && (
                                <span className="badge rounded-pill bg-danger bg-opacity-10 text-danger mt-2">
                                    {pending} Remaining Actions
                                </span>
                            )}
                        </div>
                        <div className={`rounded-circle bg-${color} bg-opacity-10 p-3 d-flex align-items-center justify-content-center`} style={{ width: '60px', height: '60px' }}>
                            <i className={`bi ${icon} text-${color} fs-3`}></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const RecentItem = ({ title, items, type, onViewAll }) => (
        <div className="col-lg-6 mb-4">
            <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">{title}</h5>
                    <button className="btn btn-sm btn-light text-primary rounded-pill fw-bold" onClick={onViewAll}>View All</button>
                </div>
                <div className="card-body p-0">
                    <div className="list-group list-group-flush">
                        {items.length === 0 ? (
                            <div className="text-center p-4 text-muted">No recent activity.</div>
                        ) : (
                            items.map((item, idx) => (
                                <div key={idx} className="list-group-item border-0 py-3 px-4 d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center">
                                        <div className={`avatar-initials me-3 bg-light text-dark fw-bold`}>
                                            {(item.first_name || item.name || '?').charAt(0)}
                                        </div>
                                        <div>
                                            <h6 className="mb-0 fw-bold">{item.first_name ? `${item.first_name} ${item.last_name}` : item.name}</h6>
                                            <small className="text-muted d-block text-truncate" style={{ maxWidth: '200px' }}>
                                                {item.course_selected || item.message || 'No details'}
                                            </small>
                                        </div>
                                    </div>
                                    <span className={`badge rounded-pill ${(item.status === 'Pending') ? 'bg-warning text-dark' :
                                        (item.status === 'Completed' || item.status === 'Connected') ? 'bg-success' : 'bg-secondary'
                                        }`}>
                                        {item.status || 'Pending'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) return <div className="p-5 text-center"><div className="spinner-border text-primary" role="status"></div></div>;

    return (
        <div className="p-4 page-anime">
            <div className="mb-4">
                <h1 className="fw-bold">Hello, {userName} 👋</h1>
                <p className="text-secondary">Here's what's happening with your leads today.</p>
            </div>

            <div className="row g-4">
                <StatCard
                    title="Student Applications"
                    count={data.stats.total_students}
                    pending={data.stats.pending_students}
                    icon="bi-journal-medical"
                    color="primary"
                    onClick={() => navigate('../students')}
                />
                <StatCard
                    title="Enquiries"
                    count={data.stats.total_enquiries}
                    pending={data.stats.pending_enquiries}
                    icon="bi-chat-quote-fill"
                    color="info"
                    onClick={() => navigate('../enquiries')}
                />
            </div>

            <div className="row mt-2">
                <RecentItem
                    title="Recent Applications"
                    items={data.recent_students}
                    type="student"
                    onViewAll={() => navigate('../students')}
                />
                <RecentItem
                    title="Recent Enquiries"
                    items={data.recent_enquiries}
                    type="enquiry"
                    onViewAll={() => navigate('../enquiries')}
                />
            </div>
        </div>
    );
};

export default Dashboard;
