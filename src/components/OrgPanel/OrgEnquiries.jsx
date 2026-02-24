import React, { useEffect, useState } from 'react';
import axios from 'axios';

const OrgEnquiries = () => {
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const orgName = localStorage.getItem('org_name') || '';

    useEffect(() => {
        const fetchEnquiries = async () => {
            try {
                const { data } = await axios.get('/api/org-enquiries/', {
                    headers: { 'X-Org-Name': orgName },
                });
                setEnquiries(data);
            } catch {
                setError('Failed to load enquiry data.');
            }
            setLoading(false);
        };
        fetchEnquiries();
    }, [orgName]);

    const filtered = enquiries.filter(e =>
        e.name?.toLowerCase().includes(search.toLowerCase()) ||
        e.phone?.includes(search) ||
        e.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="org-page">
            <div className="org-page-header">
                <div>
                    <h2 className="org-page-title">
                        <i className="bi bi-chat-dots-fill me-2" />
                        Enquiries
                    </h2>
                    <p className="org-page-sub">
                        Enquiries related to <strong>{orgName}</strong>
                    </p>
                </div>
                <div className="org-stat-badge">
                    <span>{enquiries.length}</span> Total
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
                    <span>Loading enquiry data...</span>
                </div>
            )}

            {error && <div className="org-error">{error}</div>}

            {!loading && !error && (
                <div className="org-table-wrap">
                    <table className="org-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>Location</th>
                                <th>Message</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="org-empty">
                                        <i className="bi bi-inbox" />
                                        <span>No enquiries found</span>
                                    </td>
                                </tr>
                            ) : filtered.map((e, i) => (
                                <tr key={e.id}>
                                    <td className="org-td-num">{i + 1}</td>
                                    <td className="org-td-bold">{e.name}</td>
                                    <td>{e.phone}</td>
                                    <td>{e.email || '—'}</td>
                                    <td>{e.location || '—'}</td>
                                    <td className="org-td-msg">{e.message || '—'}</td>
                                    <td>
                                        <span className={`org-status-badge org-status-${(e.status || '').toLowerCase().replace(' ', '-')}`}>
                                            {e.status || 'Pending'}
                                        </span>
                                    </td>
                                    <td>{e.created_at ? new Date(e.created_at).toLocaleDateString('en-IN') : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default OrgEnquiries;
