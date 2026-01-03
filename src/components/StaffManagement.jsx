import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './adminpanel/AdminPanel.css';

const FIELD_CONFIG = [
    { name: 'first_name', label: 'First Name', required: true, half: true },
    { name: 'last_name', label: 'Last Name', required: true, half: true },
    { name: 'email', label: 'Email', type: 'email', required: true, half: true },
    { name: 'phone_number', label: 'Phone', required: true, half: true },
    { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], half: true },
    { name: 'dob', label: 'Date of Birth', type: 'date', half: true },
    { name: 'highest_qualification', label: 'Qualification', half: true },
    { name: 'year_of_passing', label: 'Year of Passing', type: 'number', half: true },
    { name: 'aggregate_percentage', label: 'Aggregate %', half: true },
    { name: 'city', label: 'City' },
    { name: 'course_selected', label: 'Course Selected' },
    { name: 'colleges_selected', label: 'Colleges Selected', type: 'textarea' },
];

const StaffManagement = () => {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ type: null, data: null });
    const [studentModal, setStudentModal] = useState({ type: null, data: null }); // For nested student actions
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
    const [selection, setSelection] = useState({ active: false, ids: [] });
    const [errors, setErrors] = useState({});
    const longPressTimer = useRef(null);

    const renderInput = (f, val, handler) => {
        const errorMsg = errors[f.name];
        const hasError = !!errorMsg;
        const props = {
            name: f.name,
            value: val[f.name] || '',
            onChange: handler,
            required: f.required,
            className: `form-control ${hasError ? 'is-invalid' : ''}`,
            placeholder: f.label
        };

        let inputElem;
        if (f.type === 'select') inputElem = <select {...props} className={`form-select ${hasError ? 'is-invalid' : ''}`}><option value="">Select {f.label}</option>{f.options.map(o => <option key={o} value={o}>{o}</option>)}</select>;
        else if (f.type === 'textarea') inputElem = <textarea {...props} rows="2" />;
        else inputElem = <input {...props} type={f.type || 'text'} />;

        return (
            <>
                {inputElem}
                {hasError && <div className="invalid-feedback">{Array.isArray(errorMsg) ? errorMsg[0] : errorMsg}</div>}
            </>
        );
    };

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
        setErrors({});
        const payload = { ...modal.data };
        const isEdit = modal.type === 'edit';

        try {
            if (isEdit) {
                if (!payload.password) delete payload.password;
                await axios.put(`/api/staff/${payload.id}/`, payload);
                setModal({ type: 'success', data: { message: "Staff updated successfully" } });
            } else {
                await axios.post('/api/staff/', payload);
                setModal({ type: 'success', data: { message: "Staff created successfully" } });
            }
            fetchStaff();
        } catch (err) {
            const errorData = err.response?.data;
            if (errorData && typeof errorData === 'object') {
                setErrors(errorData);
                if (errorData.error || errorData.detail) {
                    showToast(errorData.error || errorData.detail, "danger");
                } else {
                    showToast("Please check the form for errors.", "danger");
                }
            } else {
                showToast("Operation failed", "danger");
            }
        }
    };


    const handleDelete = async (id = null) => {
        const isBulk = id === 'bulk';
        const count = isBulk ? selection.ids.length : 1;

        if (!window.confirm(`Are you sure you want to delete ${count} staff member(s)? This will redistribute their assigned students.`)) return;

        try {
            if (isBulk) {
                await Promise.all(selection.ids.map(staffId => axios.delete(`/api/staff/${staffId}/`)));
                showToast("Selected staff deleted and workload redistributed");
                setSelection({ active: false, ids: [] });
            } else {
                await axios.delete(`/api/staff/${id}/`);
                showToast("Staff deleted and workload redistributed");
            }
            fetchStaff();
        } catch (err) {
            showToast("Delete failed", "danger");
        }
    };

    const toggleId = (id) => setSelection(prev => ({
        ...prev,
        ids: prev.ids.includes(id) ? prev.ids.filter(i => i !== id) : [...prev.ids, id]
    }));

    const handleLongPress = (id) => {
        longPressTimer.current = setTimeout(() => {
            setSelection(p => ({ ...p, active: true }));
            toggleId(id);
        }, 800);
    };

    const viewStaffStudents = async (staffId, staffName) => {
        setModal({ type: 'view_students', data: { id: staffId, name: staffName, students: [], enquiries: [], loading: true, activeTab: 'students' } });
        try {
            const [studentsRes, enquiriesRes] = await Promise.all([
                axios.get('/api/submit/', { params: { staff_id: staffId } }),
                axios.get('/api/enquiries/', { params: { staff_id: staffId } })
            ]);
            setModal(prev => ({
                ...prev,
                data: { ...prev.data, students: studentsRes.data, enquiries: enquiriesRes.data, loading: false }
            }));
        } catch (err) {
            showToast("Failed to load assignments", "danger");
            setModal({ type: null });
        }
    };

    const handleStudentAction = async (method, url, payload = null, successMsg) => {
        setErrors({});
        try {
            if (payload) await axios[method](url, payload);
            else await axios[method](url);

            setStudentModal({ type: 'success', data: { message: successMsg } });

            // Refresh the list in the parent modal
            if (modal.type === 'view_students' && modal.data?.id) {
                const [studentsRes, enquiriesRes] = await Promise.all([
                    axios.get('/api/submit/', { params: { staff_id: modal.data.id } }),
                    axios.get('/api/enquiries/', { params: { staff_id: modal.data.id } })
                ]);
                setModal(prev => ({
                    ...prev,
                    data: { ...prev.data, students: studentsRes.data, enquiries: enquiriesRes.data }
                }));
            }
        } catch (err) {
            const errorData = err.response?.data;
            if (errorData && typeof errorData === 'object') {
                setErrors(errorData);
                if (errorData.error || errorData.detail) showToast(errorData.error || errorData.detail, "danger");
                else showToast("Please check the form for errors.", "danger");
            } else {
                showToast("Operation failed", "danger");
            }
        }
    };

    const handleEnquiryAction = async (method, url, payload = null, successMsg) => {
        try {
            if (payload) await axios[method](url, payload);
            else await axios[method](url);

            setStudentModal({ type: 'success', data: { message: successMsg } });

            // Refresh the list in the parent modal
            if (modal.type === 'view_students' && modal.data?.id) {
                const [studentsRes, enquiriesRes] = await Promise.all([
                    axios.get('/api/submit/', { params: { staff_id: modal.data.id } }),
                    axios.get('/api/enquiries/', { params: { staff_id: modal.data.id } })
                ]);
                setModal(prev => ({
                    ...prev,
                    data: { ...prev.data, students: studentsRes.data, enquiries: enquiriesRes.data }
                }));
            }
        } catch (err) {
            showToast("Enquiry action failed", "danger");
        }
    };

    const viewStaffProfile = (staff) => {
        setModal({ type: 'view_profile', data: staff });
    };

    const renderError = (field) => {
        return errors[field] ? <div className="invalid-feedback d-block">{Array.isArray(errors[field]) ? errors[field][0] : errors[field]}</div> : null;
    };

    return (
        <div className="p-4 page-anime">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="page-title mb-0">Staff Management</h1>
                <button className="btn btn-primary rounded-pill px-4" onClick={() => { setErrors({}); setModal({ type: 'add', data: { active_status: true, document_links: {} } }); }}>
                    <i className="bi bi-plus-lg me-2"></i> Add Staff
                </button>
            </div>

            <div className="custom-card table-responsive bg-white rounded shadow-sm">
                <table className="table table-hover mb-0 align-middle">
                    <thead className="bg-light">
                        <tr>
                            {selection.active && (
                                <th className="px-2 text-center" style={{ width: '5%' }}>
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={selection.ids.length === staffList.length && staffList.length > 0}
                                        onChange={(e) => setSelection(p => ({ ...p, ids: e.target.checked ? staffList.map(s => s.id) : [] }))}
                                    />
                                </th>
                            )}
                            <th>ID</th>
                            <th>Name</th>
                            <th>Designation</th>
                            <th>Login ID</th>
                            <th>Status</th>
                            <th>Current Load</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan="8" className="text-center p-4">Loading...</td></tr> : staffList.map((s, index) => (
                            <tr key={s.id}
                                onMouseDown={() => handleLongPress(s.id)}
                                onMouseUp={() => clearTimeout(longPressTimer.current)}
                                onClick={() => selection.active && toggleId(s.id)}
                                className={selection.ids.includes(s.id) ? "table-active" : ""}
                                style={{ cursor: selection.active ? 'pointer' : 'default' }}
                            >
                                {selection.active && (
                                    <td className="text-center">
                                        <input type="checkbox" checked={selection.ids.includes(s.id)} readOnly className="form-check-input" />
                                    </td>
                                )}
                                <td><span className="fw-bold text-secondary">#STF{String(index + 1).padStart(3, '0')}</span></td>
                                <td className="fw-medium">{s.name}</td>
                                <td>{s.designation || <span className="text-muted small">N/A</span>}</td>
                                <td><span className="badge bg-light text-dark border">{s.login_id}</span></td>
                                <td>
                                    <span className={`badge ${s.active_status ? 'bg-success' : 'bg-secondary'}`}>
                                        {s.active_status ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="badge bg-info text-dark rounded-pill px-3">
                                            {s.student_count} Students
                                        </span>
                                        <button className="btn btn-sm btn-link text-info p-0" title="View Assigned Students" onClick={(e) => { e.stopPropagation(); viewStaffStudents(s.id, s.name); }}><i className="bi bi-eye"></i></button>
                                    </div>
                                </td>
                                <td>
                                    <div className="d-flex gap-1">
                                        <button className="btn btn-sm btn-link text-secondary" title="View Profile" onClick={(e) => { e.stopPropagation(); viewStaffProfile(s); }}><i className="bi bi-person-lines-fill fs-5"></i></button>
                                        <button className="btn btn-sm btn-link text-primary" onClick={(e) => { e.stopPropagation(); setErrors({}); setModal({ type: 'edit', data: s }); }}><i className="bi bi-pencil-square"></i></button>
                                        <button className="btn btn-sm btn-link text-danger" onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}><i className="bi bi-trash"></i></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {staffList.length === 0 && !loading && <div className="text-center p-4 text-muted">No staff members found.</div>}
            </div>

            {/* Bulk Action Bar */}
            {selection.active && (
                <div className="position-fixed bottom-0 start-50 translate-middle-x mb-4 bg-dark text-white p-3 rounded-pill shadow-lg d-flex gap-3" style={{ zIndex: 1050 }}>
                    <span className="fw-bold">{selection.ids.length} Selected</span>
                    <button className="btn btn-danger btn-sm rounded-pill" onClick={() => handleDelete('bulk')}>Delete</button>
                    <button className="btn btn-secondary btn-sm rounded-pill" onClick={() => setSelection({ active: false, ids: [] })}>Cancel</button>
                </div>
            )}

            {/* Add/Edit Modal */}
            {['add', 'edit'].includes(modal.type) && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                            <div className="modal-header">
                                <h5 className="fw-bold">{modal.type === 'add' ? 'Add Staff' : 'Edit Staff'}</h5>
                                <button className="btn-close" onClick={() => setModal({ type: null })}></button>
                            </div>
                            <form onSubmit={handleSave}>
                                <div className="modal-body">
                                    <h6 className="fw-bold text-primary mb-3">Personal & Professional Details</h6>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Full Name <span className="text-danger">*</span></label>
                                            <input className={`form-control ${errors.name ? 'is-invalid' : ''}`} required value={modal.data.name || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })} />
                                            {renderError('name')}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Phone Number</label>
                                            <input className={`form-control ${errors.phone_number ? 'is-invalid' : ''}`} value={modal.data.phone_number || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, phone_number: e.target.value } })} placeholder="+91..." />
                                            {renderError('phone_number')}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Email <span className="text-danger">*</span></label>
                                            <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} required value={modal.data.email || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, email: e.target.value } })} />
                                            {renderError('email')}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Date of Joining</label>
                                            <input type="date" className={`form-control ${errors.date_of_joining ? 'is-invalid' : ''}`} value={modal.data.date_of_joining || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, date_of_joining: e.target.value } })} />
                                            {renderError('date_of_joining')}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Designation</label>
                                            <input className={`form-control ${errors.designation ? 'is-invalid' : ''}`} value={modal.data.designation || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, designation: e.target.value } })} placeholder="e.g. Senior Counselor" />
                                            {renderError('designation')}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Department</label>
                                            <input className={`form-control ${errors.department ? 'is-invalid' : ''}`} value={modal.data.department || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, department: e.target.value } })} placeholder="e.g. Admissions" />
                                            {renderError('department')}
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label small fw-bold">Address</label>
                                            <textarea className={`form-control ${errors.address ? 'is-invalid' : ''}`} rows="2" value={modal.data.address || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, address: e.target.value } })} placeholder="Full residential address" />
                                            {renderError('address')}
                                        </div>
                                    </div>

                                    <hr className="my-4" />
                                    <h6 className="fw-bold text-primary mb-3">Account Settings</h6>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Login ID <span className="text-danger">*</span></label>
                                            <input className={`form-control ${errors.login_id ? 'is-invalid' : ''}`} required value={modal.data.login_id || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, login_id: e.target.value } })} />
                                            {renderError('login_id')}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Password {modal.type === 'edit' && '(Leave blank to keep)'}</label>
                                            <input className={`form-control ${errors.password ? 'is-invalid' : ''}`} type="password" required={modal.type === 'add'} value={modal.data.password || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, password: e.target.value } })} />
                                            {renderError('password')}
                                        </div>
                                        <div className="col-12">
                                            <div className="form-check form-switch">
                                                <input className="form-check-input" type="checkbox" id="activeSwitch" checked={modal.data.active_status} onChange={e => setModal({ ...modal, data: { ...modal.data, active_status: e.target.checked } })} />
                                                <label className="form-check-label" htmlFor="activeSwitch">Active Account</label>
                                            </div>
                                        </div>
                                    </div>

                                    <hr className="my-4" />
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="fw-bold text-primary mb-0">Documents & Links</h6>
                                        <button type="button" className="btn btn-sm btn-outline-primary rounded-pill" onClick={() => {
                                            const key = prompt("Enter Document Name (e.g. Resume, ID Proof):");
                                            if (key) {
                                                const val = prompt("Enter Document Link/URL:");
                                                if (val) setModal(prev => ({ ...prev, data: { ...prev.data, document_links: { ...(prev.data.document_links || {}), [key]: val } } }));
                                            }
                                        }}><i className="bi bi-plus-lg"></i> Add Link</button>
                                    </div>

                                    {modal.data.document_links && Object.keys(modal.data.document_links).length > 0 ? (
                                        <ul className="list-group list-group-flush">
                                            {Object.entries(modal.data.document_links).map(([key, val]) => (
                                                <li key={key} className="list-group-item d-flex justify-content-between align-items-center bg-light rounded mb-2 border-0">
                                                    <div>
                                                        <i className="bi bi-link-45deg me-2 text-primary"></i>
                                                        <span className="fw-medium">{key}</span>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <a href={val} target="_blank" rel="noopener noreferrer" className="text-decoration-none small text-truncate d-inline-block" style={{ maxWidth: '200px' }}>{val}</a>
                                                        <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => {
                                                            const newLinks = { ...modal.data.document_links };
                                                            delete newLinks[key];
                                                            setModal(prev => ({ ...prev, data: { ...prev.data, document_links: newLinks } }));
                                                        }}><i className="bi bi-x-circle"></i></button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-muted small text-center p-3 border rounded bg-light border-dashed">No documents added. Click 'Add Link' to attach files.</div>
                                    )}

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

            {/* View Profile Modal */}
            {modal.type === 'view_profile' && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                            <div className="modal-header border-0 pb-0">
                                <h5 className="fw-bold">Staff Profile</h5>
                                <button className="btn-close" onClick={() => setModal({ type: null })}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="d-flex align-items-center mb-4">
                                    <div className="bg-light rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '80px', height: '80px' }}>
                                        <i className="bi bi-person fs-1 text-secondary"></i>
                                    </div>
                                    <div>
                                        <h3 className="fw-bold mb-1">{modal.data.name}</h3>
                                        <span className={`badge ${modal.data.active_status ? 'bg-success' : 'bg-secondary'}`}>{modal.data.active_status ? 'Active' : 'Inactive'}</span>
                                        <span className="badge bg-primary ms-2">{modal.data.designation || 'Staff'}</span>
                                    </div>
                                </div>

                                <h6 className="text-muted small fw-bold text-uppercase tracking-wide mb-3">Details</h6>
                                <div className="row g-4 mb-4">
                                    <div className="col-md-6">
                                        <label className="text-secondary small d-block mb-1">Email</label>
                                        <div className="fw-medium">{modal.data.email}</div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="text-secondary small d-block mb-1">Phone</label>
                                        <div className="fw-medium">{modal.data.phone_number || 'N/A'}</div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="text-secondary small d-block mb-1">Department</label>
                                        <div className="fw-medium">{modal.data.department || 'N/A'}</div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="text-secondary small d-block mb-1">Date of Joining</label>
                                        <div className="fw-medium">{modal.data.date_of_joining ? new Date(modal.data.date_of_joining).toLocaleDateString() : 'N/A'}</div>
                                    </div>
                                    <div className="col-12">
                                        <label className="text-secondary small d-block mb-1">Address</label>
                                        <div className="fw-medium">{modal.data.address || 'N/A'}</div>
                                    </div>
                                </div>

                                <h6 className="text-muted small fw-bold text-uppercase tracking-wide mb-3">Documents</h6>
                                {modal.data.document_links && Object.keys(modal.data.document_links).length > 0 ? (
                                    <div className="row g-3">
                                        {Object.entries(modal.data.document_links).map(([key, val]) => (
                                            <div className="col-md-6" key={key}>
                                                <div className="p-3 border rounded d-flex align-items-center bg-light">
                                                    <i className="bi bi-file-earmark-text fs-4 text-primary me-3"></i>
                                                    <div className="flex-grow-1 overflow-hidden">
                                                        <div className="fw-bold text-truncate">{key}</div>
                                                    </div>
                                                    <a href={val} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary ms-2">View</a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-4 bg-light rounded text-muted">No documents uploaded.</div>
                                )}
                            </div>
                            <div className="modal-footer border-0">
                                <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setModal({ type: null })}>Close</button>
                            </div>
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
                                    <>
                                        <div className="px-3 pt-3">
                                            <ul className="nav nav-pills nav-fill mb-3 bg-light rounded p-1">
                                                <li className="nav-item">
                                                    <button
                                                        className={`nav-link rounded-pill ${modal.data.activeTab === 'students' ? 'active' : ''}`}
                                                        onClick={() => setModal(prev => ({ ...prev, data: { ...prev.data, activeTab: 'students' } }))}
                                                    >
                                                        Students ({modal.data.students.length})
                                                    </button>
                                                </li>
                                                <li className="nav-item">
                                                    <button
                                                        className={`nav-link rounded-pill ${modal.data.activeTab === 'enquiries' ? 'active' : ''}`}
                                                        onClick={() => setModal(prev => ({ ...prev, data: { ...prev.data, activeTab: 'enquiries' } }))}
                                                    >
                                                        Enquiries ({modal.data.enquiries.length})
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>

                                        <div className="table-responsive">
                                            {modal.data.activeTab === 'students' ? (
                                                <table className="table table-hover mb-0 align-middle table-striped">
                                                    <thead className="bg-light sticky-top">
                                                        <tr>
                                                            <th className="px-3">#</th>
                                                            <th>Student Name</th>
                                                            <th>Course</th>
                                                            <th>Status</th>
                                                            <th>Joined</th>
                                                            <th>Action</th>
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
                                                                    <td>
                                                                        <span className={`badge rounded-pill ${st.status === 'Completed' ? 'bg-success' :
                                                                            st.status === 'In Progress' ? 'bg-primary' :
                                                                                st.status === 'Pending' ? 'bg-warning text-dark' :
                                                                                    'bg-secondary'
                                                                            }`}>
                                                                            {st.status || 'Pending'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="small text-muted">{new Date(st.created_at).toLocaleDateString()}</td>
                                                                    <td>
                                                                        <div className="d-flex gap-1">
                                                                            <button className="btn btn-sm btn-link text-secondary" onClick={(e) => { e.stopPropagation(); setStudentModal({ type: 'view', data: st }); }}><i className="bi bi-eye"></i></button>
                                                                            <button className="btn btn-sm btn-link text-primary" onClick={(e) => { e.stopPropagation(); setStudentModal({ type: 'edit', data: st }); }}><i className="bi bi-pencil-square"></i></button>
                                                                            <button className="btn btn-sm btn-link text-danger" onClick={(e) => { e.stopPropagation(); setStudentModal({ type: 'delete', data: { id: st.id } }); }}><i className="bi bi-trash"></i></button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="6" className="text-center p-5 text-muted">
                                                                    <i className="bi bi-inbox display-4 d-block mb-3 text-secondary opacity-25"></i>
                                                                    No students assigned yet.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <table className="table table-hover mb-0 align-middle table-striped">
                                                    <thead className="bg-light sticky-top">
                                                        <tr>
                                                            <th className="px-3">#</th>
                                                            <th>Enquiry Name</th>
                                                            <th>Message</th>
                                                            <th>Status</th>
                                                            <th>Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {modal.data.enquiries.length > 0 ? (
                                                            modal.data.enquiries.map((enq, i) => (
                                                                <tr key={enq.id}>
                                                                    <td className="px-3 fw-bold text-secondary">{i + 1}</td>
                                                                    <td>
                                                                        <div className="fw-medium">{enq.name}</div>
                                                                        <div className="small text-muted">{enq.email}</div>
                                                                    </td>
                                                                    <td title={enq.message} className="text-truncate" style={{ maxWidth: '200px' }}>{enq.message || '-'}</td>
                                                                    <td>
                                                                        <span className={`badge ${enq.status === 'Connected' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                                                            {enq.status || 'Pending'}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <div className="d-flex gap-1">
                                                                            <button className="btn btn-sm btn-link text-secondary" onClick={(e) => { e.stopPropagation(); setStudentModal({ type: 'view_enquiry', data: enq }); }}><i className="bi bi-eye"></i></button>
                                                                            <button className="btn btn-sm btn-link text-primary" onClick={(e) => { e.stopPropagation(); setStudentModal({ type: 'edit_enquiry', data: enq }); }}><i className="bi bi-pencil-square"></i></button>
                                                                            <button className="btn btn-sm btn-link text-danger" onClick={(e) => { e.stopPropagation(); setStudentModal({ type: 'delete_enquiry', data: { id: enq.id } }); }}><i className="bi bi-trash"></i></button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="6" className="text-center p-5 text-muted">
                                                                    <i className="bi bi-question-circle display-4 d-block mb-3 text-secondary opacity-25"></i>
                                                                    No enquiries assigned yet.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="modal-footer border-0">
                                <button type="button" className="btn btn-secondary rounded-pill" onClick={() => setModal({ type: null })}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {modal.type === 'success' && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-sm modal-dialog-centered">
                        <div className="modal-content text-center p-4 border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                            <div className="mb-3">
                                <div className="mx-auto bg-success text-white d-flex align-items-center justify-content-center rounded-circle" style={{ width: '60px', height: '60px' }}>
                                    <i className="bi bi-check-lg" style={{ fontSize: '2rem' }}></i>
                                </div>
                            </div>
                            <h5 className="fw-bold mb-2">Success!</h5>
                            <p className="text-muted mb-4">{modal.data?.message || 'Operation completed successfully.'}</p>
                            <button className="btn btn-success rounded-pill px-4 w-100" onClick={() => setModal({ type: null })}>OK</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Action Modals - Nested */}
            {['view', 'edit'].includes(studentModal.type) && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                            <div className="modal-header">
                                <h5 className="fw-bold">{studentModal.type.toUpperCase()} Student</h5>
                                <button className="btn-close" onClick={() => setStudentModal({ type: null })}></button>
                            </div>
                            <div className="modal-body">
                                {studentModal.type === 'view' ? (
                                    <div className="row g-3">
                                        {Object.entries(studentModal.data).map(([k, v]) => v && k !== 'plus_two_percentage' && (
                                            <div className="col-6" key={k}>
                                                <label className="text-secondary small text-capitalize">{k.replace(/_/g, ' ')}</label>
                                                <div className="fw-medium">{v}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        handleStudentAction('put', `/api/submit/${studentModal.data.id}/`, studentModal.data, "Updated!");
                                    }}>
                                        <div className="row g-3">
                                            {FIELD_CONFIG.map(f => (
                                                <div className={f.half ? "col-6" : "col-12"} key={f.name}>
                                                    <label className="form-label small fw-bold">{f.label} {f.required && '*'}</label>
                                                    {renderInput(f, studentModal.data, (e) => setStudentModal({ ...studentModal, data: { ...studentModal.data, [e.target.name]: e.target.value } }))}
                                                </div>
                                            ))}
                                            <div className="col-12">
                                                <label className="form-label small fw-bold">Status</label>
                                                <select
                                                    className="form-select"
                                                    value={studentModal.data.status || 'Pending'}
                                                    onChange={(e) => setStudentModal({ ...studentModal, data: { ...studentModal.data, status: e.target.value } })}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Completed">Completed</option>
                                                </select>
                                            </div>
                                        </div>
                                        <button className="btn btn-primary w-100 rounded-pill mt-4">Update Student</button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Delete Confirmation */}
            {studentModal.type === 'delete' && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-sm modal-dialog-centered">
                        <div className="modal-content text-center p-3">
                            <i className="bi bi-exclamation-circle text-danger display-4"></i>
                            <h5 className="fw-bold">Confirm Delete</h5>
                            <p className="small text-muted">This action is permanent.</p>
                            <div className="d-flex gap-2 justify-content-center">
                                <button className="btn btn-light rounded-pill" onClick={() => setStudentModal({ type: null })}>Cancel</button>
                                <button className="btn btn-danger rounded-pill px-4" onClick={() => handleStudentAction('delete', `/api/submit/${studentModal.data.id}/`, null, "Student deleted")}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Success Modal */}
            {studentModal.type === 'success' && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1070 }}>
                    <div className="modal-dialog modal-sm modal-dialog-centered">
                        <div className="modal-content text-center p-4 border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                            <div className="mb-3">
                                <div className="mx-auto bg-success text-white d-flex align-items-center justify-content-center rounded-circle" style={{ width: '60px', height: '60px' }}>
                                    <i className="bi bi-check-lg" style={{ fontSize: '2rem' }}></i>
                                </div>
                            </div>
                            <h5 className="fw-bold mb-2">Success!</h5>
                            <p className="text-muted mb-4">{studentModal.data?.message || 'Operation completed successfully.'}</p>
                            <button className="btn btn-success rounded-pill px-4 w-100" onClick={() => setStudentModal({ type: null })}>OK</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Enquiry View Modal (Nested) */}
            {studentModal.type === 'view_enquiry' && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                            <div className="modal-header border-bottom-0">
                                <h5 className="modal-title fw-bold">Enquiry Details</h5>
                                <button type="button" className="btn-close" onClick={() => setStudentModal({ type: null })}></button>
                            </div>
                            <div className="modal-body">
                                <div className="text-center mb-4">
                                    <div className="avatar-initials mx-auto mb-3" style={{ width: '80px', height: '80px', fontSize: '2rem', backgroundColor: '#fd7e14', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                                        {studentModal.data.name.charAt(0)}
                                    </div>
                                    <h4 className="fw-bold">{studentModal.data.name}</h4>
                                    <p className="text-muted">{studentModal.data.location || 'Location not provided'}</p>
                                </div>
                                <div className="card bg-light border-0 p-3 mb-3">
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="text-secondary small fw-bold">Message</label>
                                            <div className="p-2 bg-white rounded border border-light">
                                                {studentModal.data.message || 'No message provided'}
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <label className="text-secondary small fw-bold">Email</label>
                                            <div className="fw-medium text-break">{studentModal.data.email || 'N/A'}</div>
                                        </div>
                                        <div className="col-6">
                                            <label className="text-secondary small fw-bold">Mobile</label>
                                            <div className="fw-medium">{studentModal.data.phone}</div>
                                        </div>
                                        <div className="col-6">
                                            <label className="text-secondary small fw-bold">Status</label>
                                            <span className={`badge ${studentModal.data.status === 'Connected' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                                {studentModal.data.status || 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex justify-content-center mt-4">
                                    <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setStudentModal({ type: null })}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Enquiry Edit Modal (Nested) */}
            {studentModal.type === 'edit_enquiry' && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                            <div className="modal-header border-bottom-0">
                                <h5 className="modal-title fw-bold">Edit Enquiry</h5>
                                <button type="button" className="btn-close" onClick={() => setStudentModal({ type: null })}></button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    handleEnquiryAction('put', `/api/enquiries/${studentModal.data.id}/`, studentModal.data, "Enquiry updated!");
                                }}>
                                    <div className="row g-3 mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Name</label>
                                            <input className="form-control bg-light" value={studentModal.data.name} readOnly />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Location</label>
                                            <input className="form-control bg-light" value={studentModal.data.location || ''} readOnly />
                                        </div>
                                    </div>
                                    <div className="card bg-light border-0 p-3 mb-3">
                                        <div className="row g-3">
                                            <div className="col-12">
                                                <label className="text-secondary small fw-bold">Message</label>
                                                <textarea className="form-control bg-light" rows="3" value={studentModal.data.message || ''} readOnly />
                                            </div>
                                            <div className="col-6">
                                                <label className="text-secondary small fw-bold">Email</label>
                                                <input className="form-control bg-light" value={studentModal.data.email || ''} readOnly />
                                            </div>
                                            <div className="col-6">
                                                <label className="text-secondary small fw-bold">Mobile</label>
                                                <input className="form-control bg-light" value={studentModal.data.phone} readOnly />
                                            </div>
                                            <div className="col-6">
                                                <label className="text-secondary small fw-bold">Status</label>
                                                <select
                                                    className="form-select"
                                                    value={studentModal.data.status || 'Pending'}
                                                    onChange={(e) => setStudentModal({ ...studentModal, data: { ...studentModal.data, status: e.target.value } })}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Connected">Connected</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="d-flex gap-2 justify-content-center mt-4">
                                        <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setStudentModal({ type: null })}>Close</button>
                                        <button type="submit" className="btn btn-primary rounded-pill px-4">Save Changes</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Enquiry Delete Confirmation */}
            {studentModal.type === 'delete_enquiry' && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-sm modal-dialog-centered">
                        <div className="modal-content text-center p-3">
                            <i className="bi bi-exclamation-circle text-danger display-4"></i>
                            <h5 className="fw-bold">Confirm Delete</h5>
                            <p className="small text-muted">This action is permanent.</p>
                            <div className="d-flex gap-2 justify-content-center">
                                <button className="btn btn-light rounded-pill" onClick={() => setStudentModal({ type: null })}>Cancel</button>
                                <button className="btn btn-danger rounded-pill px-4" onClick={() => handleEnquiryAction('delete', `/api/enquiries/${studentModal.data.id}/`, null, "Enquiry deleted")}>Delete</button>
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
