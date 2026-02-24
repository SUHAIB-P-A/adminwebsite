import React, { useEffect, useState } from 'react';
import axios from 'axios';

const OrgStudents = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const orgName = localStorage.getItem('org_name') || '';

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const { data } = await axios.get('/api/org-students/', {
                    headers: { 'X-Org-Name': orgName },
                });
                setStudents(data);
            } catch {
                setError('Failed to load student data.');
            }
            setLoading(false);
        };
        fetchStudents();
    }, [orgName]);

    const filtered = students.filter(s =>
        s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.phone_number?.includes(search) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="org-page">
            <div className="org-page-header">
                <div>
                    <h2 className="org-page-title">
                        <i className="bi bi-people-fill me-2" />
                        Student Applications
                    </h2>
                    <p className="org-page-sub">
                        Students who selected <strong>{orgName}</strong> as a preferred college
                    </p>
                </div>
                <div className="org-stat-badge">
                    <span>{students.length}</span> Total
                </div>
            </div>

            <div className="org-search-bar">
                <i className="bi bi-search org-search-icon" />
                <input
                    type="text"
                    placeholder="Search by name, phone or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="org-search-input"
                />
            </div>

            {loading && (
                <div className="org-loading">
                    <div className="spinner-border text-primary" />
                    <span>Loading student data...</span>
                </div>
            )}

            {error && <div className="org-error">{error}</div>}

            {!loading && !error && (
                <div className="org-table-wrap">
                    <table className="org-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Full Name</th>
                                <th>Phone</th>
                                <th>Course</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="org-empty">
                                        <i className="bi bi-inbox" />
                                        <span>No student applications found</span>
                                    </td>
                                </tr>
                            ) : filtered.map((s, i) => (
                                <tr key={s.id}>
                                    <td className="org-td-num">{i + 1}</td>
                                    <td className="org-td-bold">{s.full_name}</td>
                                    <td>{s.phone_number}</td>
                                    <td>{s.course_selected || '—'}</td>
                                    <td>
                                        <span className={`org-status-badge org-status-${(s.status || '').toLowerCase().replace(' ', '-')}`}>
                                            {s.status || 'Pending'}
                                        </span>
                                    </td>
                                    <td>{s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN') : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default OrgStudents;
