import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './adminpanel/AdminPanel.css';

const StaffManagement = () => {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ type: null, data: null }); // type: 'add', 'edit'
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const { data } = await axios.get('/api/staff/');
            setStaffList(data);
        } catch (err) {
            showToast("Failed to load staff", "danger");
        }
        setLoading(false);
    };

    const showToast = (msg, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const payload = { ...modal.data };
        const isEdit = modal.type === 'edit';

        try {
            if (isEdit) {
                if (!payload.password) delete payload.password; // Don't send empty password on edit
                await axios.put(`/api/staff/${payload.id}/`, payload);
                showToast("Staff updated successfully");
            } else {
                await axios.post('/api/staff/', payload);
                showToast("Staff created successfully");
            }
            setModal({ type: null, data: null });
            fetchStaff();
        } catch (err) {
            showToast(err.response?.data?.error || "Operation failed", "danger");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will redistribute their assigned students.")) return;
        try {
            await axios.delete(`/api/staff/${id}/`);
            showToast("Staff deleted and workload redistributed");
            fetchStaff();
        } catch (err) {
            showToast("Delete failed", "danger");
        }
    };

    const viewStaffStudents = async (staffId, staffName) => {
        setModal({ type: 'view_students', data: { name: staffName, students: [], loading: true } });
        try {
            // Using the existing API which supports filtering by staff_id
            const { data } = await axios.get(`/api/submit/?staff_id=${staffId}`);
            setModal(prev => ({
                type: 'view_students',
                data: { ...prev.data, students: data, loading: false }
            }));
        } catch (err) {
            showToast("Failed to load assigned students", "danger");
            setModal({ type: null });
        }
    };

    return (
        <div className="p-4 page-anime">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="page-title mb-0">Staff Management</h1>
                <button className="btn btn-primary rounded-pill px-4" onClick={() => setModal({ type: 'add', data: { active_status: true } })}>
                    <i className="bi bi-plus-lg me-2"></i> Add Staff
                </button>
            </div>

            <div className="custom-card table-responsive bg-white rounded shadow-sm">
                <table className="table table-hover mb-0 align-middle">
                    <thead className="bg-light">
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Login ID</th>
                            <th>Status</th>
                            <th>Current Load</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan="7" className="text-center p-4">Loading...</td></tr> : staffList.map((s, index) => (
                            <tr key={s.id}>
                                <td><span className="fw-bold text-secondary">#STF{String(index + 1).padStart(3, '0')}</span></td>
                                <td className="fw-medium">{s.name}</td>
                                <td>{s.email}</td>
                                <td><span className="badge bg-light text-dark border">{s.login_id}</span></td>
                                <td>
                                    <span className={`badge ${s.active_status ? 'bg-success' : 'bg-secondary'}`}>
                                        {s.active_status ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <span className="badge bg-info text-dark rounded-pill px-3">
                                        {s.student_count} Students
                                    </span>
                                </td>
                                <td>
                                    <button className="btn btn-sm btn-link text-info" title="View Assigned Students" onClick={() => viewStaffStudents(s.id, s.name)}><i className="bi bi-eye"></i></button>
                                    <button className="btn btn-sm btn-link text-primary" onClick={() => setModal({ type: 'edit', data: s })}><i className="bi bi-pencil-square"></i></button>
                                    <button className="btn btn-sm btn-link text-danger" onClick={() => handleDelete(s.id)}><i className="bi bi-trash"></i></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {staffList.length === 0 && !loading && <div className="text-center p-4 text-muted">No staff members found.</div>}
            </div>

            {/* Modal */}
            {modal.type && modal.type !== 'view_students' && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                            <div className="modal-header">
                                <h5 className="fw-bold">{modal.type === 'add' ? 'Add Staff' : 'Edit Staff'}</h5>
                                <button className="btn-close" onClick={() => setModal({ type: null })}></button>
                            </div>
                            <form onSubmit={handleSave}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Full Name</label>
                                        <input className="form-control" required value={modal.data.name || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Email</label>
                                        <input type="email" className="form-control" required value={modal.data.email || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, email: e.target.value } })} />
                                    </div>
                                    <div className="row">
                                        <div className="col-6 mb-3">
                                            <label className="form-label small fw-bold">Login ID</label>
                                            <input className="form-control" required value={modal.data.login_id || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, login_id: e.target.value } })} />
                                        </div>
                                        <div className="col-6 mb-3">
                                            <label className="form-label small fw-bold">Password {modal.type === 'edit' && '(Leave blank to keep)'}</label>
                                            <input className="form-control" type="password" required={modal.type === 'add'} value={modal.data.password || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, password: e.target.value } })} />
                                        </div>
                                    </div>
                                    <div className="form-check form-switch">
                                        <input className="form-check-input" type="checkbox" id="activeSwitch" checked={modal.data.active_status} onChange={e => setModal({ ...modal, data: { ...modal.data, active_status: e.target.checked } })} />
                                        <label className="form-check-label" htmlFor="activeSwitch">Active Account</label>
                                    </div>
                                </div>
                                <div className="modal-footer border-0">
                                    <button type="button" className="btn btn-light rounded-pill" onClick={() => setModal({ type: null })}>Cancel</button>
                                    <button type="submit" className="btn btn-primary rounded-pill px-4">Save Staff</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* View Students Modal */}
            {modal.type === 'view_students' && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                            <div className="modal-header">
                                <h5 className="fw-bold">Students Assigned to {modal.data.name}</h5>
                                <button className="btn-close" onClick={() => setModal({ type: null })}></button>
                            </div>
                            <div className="modal-body p-0">
                                {modal.data.loading ? (
                                    <div className="text-center p-5">
                                        <div className="spinner-border text-primary" role="status"></div>
                                        <p className="mt-2 text-muted">Loading assignments...</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0 align-middle table-striped">
                                            <thead className="bg-light sticky-top">
                                                <tr>
                                                    <th className="px-3">#</th>
                                                    <th>Student Name</th>
                                                    <th>Course</th>
                                                    <th>Contact</th>
                                                    <th>Joined</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {modal.data.students.length > 0 ? (
                                                    modal.data.students.map((st, i) => (
                                                        <tr key={st.id}>
                                                            <td className="px-3 fw-bold text-secondary">{i + 1}</td>
                                                            <td>
                                                                <div className="fw-medium">{st.first_name} {st.last_name}</div>
                                                                <div className="small text-muted">{st.email}</div>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-light text-dark border">{st.course_selected || 'N/A'}</span>
                                                            </td>
                                                            <td>{st.phone_number}</td>
                                                            <td className="small text-muted">{new Date(st.created_at).toLocaleDateString()}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="text-center p-5 text-muted">
                                                            <i className="bi bi-inbox display-4 d-block mb-3 text-secondary opacity-25"></i>
                                                            No students assigned to this staff member yet.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer border-0">
                                <button type="button" className="btn btn-secondary rounded-pill" onClick={() => setModal({ type: null })}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {toast.show && <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1100 }}><div className={`toast show bg-${toast.type} text-white p-2 px-3 rounded shadow`}>{toast.msg}</div></div>}
        </div>
    );
};

export default StaffManagement;
