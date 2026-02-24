import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Organizations.css';

const Organizations = () => {
    const [orgs, setOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editOrg, setEditOrg] = useState(null);
    const [form, setForm] = useState({ name: '', login_id: '', password: '', active_status: true });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const fetchOrgs = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/organizations/');
            setOrgs(data);
        } catch { }
        setLoading(false);
    };

    useEffect(() => { fetchOrgs(); }, []);

    const openAdd = () => {
        setEditOrg(null);
        setForm({ name: '', login_id: '', password: '', active_status: true });
        setFormError('');
        setShowForm(true);
    };

    const openEdit = (org) => {
        setEditOrg(org);
        setForm({ name: org.name, login_id: org.login_id, password: '', active_status: org.active_status });
        setFormError('');
        setShowForm(true);
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');
        try {
            const payload = { ...form };
            if (editOrg && !payload.password) delete payload.password; // Don't send empty password on edit
            if (editOrg) {
                await axios.patch(`/api/organizations/${editOrg.id}/`, payload);
            } else {
                await axios.post('/api/organizations/', payload);
            }
            setShowForm(false);
            fetchOrgs();
        } catch (err) {
            const errs = err.response?.data;
            if (errs) {
                const msg = Object.values(errs).flat().join(' ');
                setFormError(msg);
            } else {
                setFormError('Something went wrong.');
            }
        }
        setFormLoading(false);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/organizations/${id}/`);
            setDeleteConfirm(null);
            fetchOrgs();
        } catch { }
    };

    const filtered = orgs.filter(o =>
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.login_id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="orgs-page">
            <div className="orgs-header">
                <div>
                    <h2 className="orgs-title">
                        <i className="bi bi-buildings-fill me-2" />
                        Organizations
                    </h2>
                    <p className="orgs-sub">Manage college & organization login access</p>
                </div>
                <button className="orgs-add-btn" onClick={openAdd}>
                    <i className="bi bi-plus-lg me-1" /> Add Organization
                </button>
            </div>

            <div className="orgs-search-row">
                <div className="orgs-search-wrap">
                    <i className="bi bi-search orgs-search-icon" />
                    <input
                        className="orgs-search-input"
                        placeholder="Search by name or login ID..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <span className="orgs-count">{orgs.length} Organizations</span>
            </div>

            {loading ? (
                <div className="orgs-loading">
                    <div className="spinner-border text-primary" /><span>Loading...</span>
                </div>
            ) : (
                <div className="orgs-table-wrap">
                    <table className="orgs-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Organization Name</th>
                                <th>Login ID</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="orgs-empty">
                                        <i className="bi bi-buildings" />
                                        <span>{search ? 'No results found.' : 'No organizations added yet. Click "Add Organization" to get started.'}</span>
                                    </td>
                                </tr>
                            ) : filtered.map((org, i) => (
                                <tr key={org.id}>
                                    <td className="orgs-td-num">{i + 1}</td>
                                    <td>
                                        <div className="orgs-org-name">
                                            <div className="orgs-org-avatar">
                                                <i className="bi bi-building-fill" />
                                            </div>
                                            <span>{org.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <code className="orgs-login-id">{org.login_id}</code>
                                    </td>
                                    <td>
                                        <span className={`orgs-status ${org.active_status ? 'orgs-active' : 'orgs-inactive'}`}>
                                            <i className={`bi ${org.active_status ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} />
                                            {org.active_status ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="orgs-td-date">
                                        {new Date(org.created_at).toLocaleDateString('en-IN')}
                                    </td>
                                    <td>
                                        <div className="orgs-actions">
                                            <button className="orgs-btn-edit" onClick={() => openEdit(org)} title="Edit">
                                                <i className="bi bi-pencil-fill" />
                                            </button>
                                            <button className="orgs-btn-delete" onClick={() => setDeleteConfirm(org)} title="Delete">
                                                <i className="bi bi-trash-fill" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add / Edit Form Modal */}
            {showForm && (
                <div className="orgs-modal-backdrop" onClick={() => setShowForm(false)}>
                    <div className="orgs-modal" onClick={e => e.stopPropagation()}>
                        <div className="orgs-modal-header">
                            <h5 className="orgs-modal-title">
                                <i className={`bi ${editOrg ? 'bi-pencil-fill' : 'bi-plus-circle-fill'} me-2`} />
                                {editOrg ? 'Edit Organization' : 'Add Organization'}
                            </h5>
                            <button className="orgs-close-btn" onClick={() => setShowForm(false)}>
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="orgs-modal-body">
                            {formError && (
                                <div className="orgs-form-error">
                                    <i className="bi bi-exclamation-triangle-fill me-2" />{formError}
                                </div>
                            )}
                            <div className="orgs-form-group">
                                <label>Organization Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="orgs-form-input"
                                    placeholder="e.g. Nehru College of Engineering"
                                    value={form.name}
                                    onChange={handleFormChange}
                                    required
                                    autoFocus
                                />
                                <small className="orgs-form-hint">
                                    <i className="bi bi-info-circle me-1" />
                                    Must exactly match the college name as entered in student applications
                                </small>
                            </div>
                            <div className="orgs-form-group">
                                <label>Login ID *</label>
                                <input
                                    type="text"
                                    name="login_id"
                                    className="orgs-form-input"
                                    placeholder="e.g. nehrueng2024"
                                    value={form.login_id}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>
                            <div className="orgs-form-group">
                                <label>{editOrg ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
                                <input
                                    type="password"
                                    name="password"
                                    className="orgs-form-input"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={handleFormChange}
                                    required={!editOrg}
                                />
                            </div>
                            <div className="orgs-form-check">
                                <input
                                    type="checkbox"
                                    id="active_status"
                                    name="active_status"
                                    checked={form.active_status}
                                    onChange={handleFormChange}
                                />
                                <label htmlFor="active_status">Active (can login)</label>
                            </div>
                            <div className="orgs-modal-footer">
                                <button type="button" className="orgs-cancel-btn" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="orgs-save-btn" disabled={formLoading}>
                                    {formLoading ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : <><i className="bi bi-check-lg me-1" />{editOrg ? 'Update' : 'Create'}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteConfirm && (
                <div className="orgs-modal-backdrop" onClick={() => setDeleteConfirm(null)}>
                    <div className="orgs-confirm-modal" onClick={e => e.stopPropagation()}>
                        <div className="orgs-confirm-icon">
                            <i className="bi bi-trash3-fill" />
                        </div>
                        <h5>Delete Organization?</h5>
                        <p>Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This will revoke their login access.</p>
                        <div className="orgs-confirm-actions">
                            <button className="orgs-cancel-btn" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="orgs-delete-confirm-btn" onClick={() => handleDelete(deleteConfirm.id)}>
                                <i className="bi bi-trash-fill me-1" /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Organizations;
