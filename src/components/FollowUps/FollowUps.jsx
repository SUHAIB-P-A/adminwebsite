import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../adminpanel/AdminPanel.css';

// Reuse configuration from Students.jsx
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 21 }, (_, i) => currentYear - i);

const FIELD_CONFIG = [
    { name: 'full_name', label: 'Full Name', required: true, half: false },
    { name: 'email', label: 'Email', type: 'email', required: true, half: true },
    { name: 'phone_number', label: 'Phone', required: true, half: true },
    { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Others'], half: true },
    { name: 'dob', label: 'Date of Birth', type: 'date', half: true },
    { name: 'highest_qualification', label: 'Qualification', type: 'select', options: ['10th Standard', '12th Standard', 'Diploma', "Bachelor's Degree", "Master's Degree", 'Others'], half: true },
    { name: 'year_of_passing', label: 'Year of Passing', type: 'select', options: years, half: true },
    { name: 'aggregate_percentage', label: 'Aggregate %', half: true },
    { name: 'city', label: 'City' },
    { name: 'course_selected', label: 'Course Selected' },
    { name: 'colleges_selected', label: 'Colleges Selected', type: 'textarea' },
    { name: 'notes', label: 'Comments / Notes', type: 'textarea' },
];

const FollowUps = () => {
    const [activeTab, setActiveTab] = useState('students');
    const [students, setStudents] = useState([]);
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal & Action State
    const [modal, setModal] = useState({ type: null, data: null, category: null }); // category: 'student' or 'enquiry'
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
    const [errors, setErrors] = useState({});
    const [staffList, setStaffList] = useState([]); // Needed for Student Edit Modal

    // Role Check
    const role = localStorage.getItem('role');
    const isAdmin = role === 'admin' || role === 'Admin';

    const showToast = (msg, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
    };

    const fetchFollowUps = async () => {
        setLoading(true);
        try {
            const staffId = localStorage.getItem('staff_id');
            const params = (role !== 'admin' && role !== 'Admin') ? { staff_id: staffId } : {};

            const [studentsRes, enquiriesRes] = await Promise.all([
                axios.get('/api/submit/', { params }),
                axios.get('/api/enquiries/', { params })
            ]);

            // Filter for 'Follow Up' status
            const followUpStudents = studentsRes.data.filter(s => s.status === 'Follow Up').sort((a, b) => new Date(a.follow_up_date) - new Date(b.follow_up_date));
            const followUpEnquiries = enquiriesRes.data.filter(e => e.status === 'Follow Up').sort((a, b) => new Date(a.follow_up_date) - new Date(b.follow_up_date));

            setStudents(followUpStudents);
            setEnquiries(followUpEnquiries);

            if (isAdmin && staffList.length === 0) {
                const staffResp = await axios.get('/api/staff/');
                setStaffList(staffResp.data);
            }
        } catch (err) {
            console.error("Failed to fetch follow ups", err);
            showToast("Failed to load data", "danger");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchFollowUps();
    }, []);

    const handleAction = async (method, url, payload = null, successMsg, isEnquiry = false) => {
        setErrors({});
        try {
            const staffId = localStorage.getItem('staff_id');
            const params = (!isAdmin) ? { staff_id: staffId } : {};

            if (payload) await axios[method](url, payload, { params });
            else await axios[method](url, { params });

            // If success, we don't need a success modal, just a toast and refresh
            showToast(successMsg, "success");
            setModal({ type: null, data: null, category: null });
            fetchFollowUps();
        } catch (err) {
            const errorData = err.response?.data;
            if (errorData && typeof errorData === 'object') {
                setErrors(errorData);
                if (errorData.error || errorData.detail) {
                    showToast(errorData.error || errorData.detail || "Operation failed", "danger");
                } else {
                    showToast("Check form for errors", "danger");
                }
            } else {
                showToast("Operation failed", "danger");
            }
        }
    };

    const confirmDelete = () => {
        const { data, category } = modal;
        if (category === 'student') {
            handleAction('delete', `/api/submit/${data.id}/`, null, "Student deleted");
        } else {
            handleAction('delete', `/api/enquiries/${data.id}/`, null, "Enquiry deleted", true);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Date not set';
        return new Date(dateString).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // --- RENDER HELPERS ---
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

        if (f.type === 'select') return (
            <>
                <select {...props} className={`form-select ${hasError ? 'is-invalid' : ''}`}>
                    <option value="">Select {f.label}</option>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {hasError && <div className="invalid-feedback">{errorMsg}</div>}
            </>
        );
        if (f.type === 'textarea') return (
            <>
                <textarea {...props} rows="2" />
                {hasError && <div className="invalid-feedback">{errorMsg}</div>}
            </>
        );
        return (
            <>
                <input {...props} type={f.type || 'text'} />
                {hasError && <div className="invalid-feedback">{errorMsg}</div>}
            </>
        );
    };

    const renderList = (items, type) => {
        if (loading) return <div className="text-center p-5">Loading...</div>;
        if (items.length === 0) return <div className="text-center p-5 text-muted">No {type} follow ups found.</div>;

        return (
            <div className="list-group">
                {items.map((item) => (
                    <div key={item.id} className="list-group-item list-group-item-action d-flex flex-wrap justify-content-between align-items-center p-3 border-0 mb-2 shadow-sm rounded gap-3">
                        <div className="d-flex align-items-center gap-3">
                            <div className={`avatar-initials text-white rounded-circle d-flex align-items-center justify-content-center fw-bold ${type === 'Student' ? 'bg-primary' : 'bg-warning'}`} style={{ width: '50px', height: '50px', flexShrink: 0 }}>
                                {(item.name || item.full_name || '?').charAt(0)}
                            </div>
                            <div>
                                <h6 className="mb-0 fw-bold">{item.name || item.full_name || 'N/A'}</h6>
                                <div className="text-muted small">
                                    <i className="bi bi-clock-history me-1"></i>
                                    {formatDate(item.follow_up_date)}
                                </div>
                                <div className="text-muted small">
                                    {type === 'Student' ? (
                                        <span>Course: {item.course_selected || 'N/A'}</span>
                                    ) : (
                                        <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>{item.message}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="d-flex gap-2">
                            <button className="btn btn-outline-primary btn-sm rounded-circle" style={{ width: '32px', height: '32px' }} onClick={() => setModal({ type: 'view', data: item, category: type.toLowerCase() })} title="View"><i className="bi bi-eye"></i></button>
                            <button className="btn btn-outline-secondary btn-sm rounded-circle" style={{ width: '32px', height: '32px' }} onClick={() => setModal({ type: 'edit', data: item, category: type.toLowerCase() })} title="Edit"><i className="bi bi-pencil"></i></button>
                            <button className="btn btn-outline-danger btn-sm rounded-circle" style={{ width: '32px', height: '32px' }} onClick={() => setModal({ type: 'delete', data: item, category: type.toLowerCase() })} title="Delete"><i className="bi bi-trash"></i></button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="p-4 page-anime">
            {toast.show && (
                <div className={`toast-container position-fixed top-0 end-0 p-3`} style={{ zIndex: 1100 }}>
                    <div className={`toast show align-items-center text-white bg-${toast.type} border-0`}>
                        <div className="d-flex">
                            <div className="toast-body">{toast.msg}</div>
                            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast({ show: false, msg: '', type: 'success' })}></button>
                        </div>
                    </div>
                </div>
            )}

            <h1 className="page-title mb-4">Follow Ups</h1>

            <ul className="nav nav-pills mb-4 gap-2">
                <li className="nav-item">
                    <button
                        className={`nav-link rounded-pill px-4 ${activeTab === 'students' ? 'active bg-dark' : 'bg-white text-dark border'}`}
                        onClick={() => setActiveTab('students')}
                    >
                        Students <span className="badge bg-light text-dark ms-2 rounded-pill">{students.length}</span>
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link rounded-pill px-4 ${activeTab === 'enquiries' ? 'active bg-dark' : 'bg-white text-dark border'}`}
                        onClick={() => setActiveTab('enquiries')}
                    >
                        Enquiries <span className="badge bg-light text-dark ms-2 rounded-pill">{enquiries.length}</span>
                    </button>
                </li>
            </ul>

            <div className="custom-card p-3 bg-light rounded">
                {activeTab === 'students' ? renderList(students, 'Student') : renderList(enquiries, 'Enquiry')}
            </div>

            {/* DELETE MODAL */}
            {modal.type === 'delete' && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-sm modal-dialog-centered">
                        <div className="modal-content text-center p-3">
                            <i className="bi bi-exclamation-circle text-danger display-4"></i>
                            <h5 className="fw-bold">Confirm Delete</h5>
                            <p className="small text-muted">This action is permanent.</p>
                            <div className="d-flex gap-2 justify-content-center">
                                <button className="btn btn-light rounded-pill" onClick={() => setModal({ type: null, data: null, category: null })}>Cancel</button>
                                <button className="btn btn-danger rounded-pill px-4" onClick={confirmDelete}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT/VIEW MODAL - DYNAMIC */}
            {['view', 'edit'].includes(modal.type) && modal.data && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                            <div className="modal-header">
                                <h5 className="fw-bold text-capitalize">{modal.type} {modal.category}</h5>
                                <button className="btn-close" onClick={() => setModal({ type: null, data: null, category: null })}></button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    if (modal.type === 'view') return;

                                    const isStudent = modal.category === 'student';
                                    const url = isStudent ? `/api/submit/${modal.data.id}/` : `/api/enquiries/${modal.data.id}/`;
                                    const payload = { ...modal.data };

                                    if (isStudent && payload.assigned_staff === 'auto') {
                                        payload.assigned_staff = null;
                                        payload.auto_allocate = true;
                                    }

                                    handleAction('put', url, payload, "Updated successfully", !isStudent);
                                }}>

                                    {/* STUDENT FORM */}
                                    {modal.category === 'student' && (
                                        <div className="row g-3">
                                            {/* Render Fields */}
                                            {FIELD_CONFIG.map(f => (
                                                <div className={f.half ? "col-md-6 col-12" : "col-12"} key={f.name}>
                                                    <label className="form-label small fw-bold">{f.label}</label>
                                                    {modal.type === 'view' ? (
                                                        <div className="form-control-plaintext border-bottom">{modal.data[f.name] || '-'}</div>
                                                    ) : (
                                                        renderInput(f, modal.data, (e) => setModal({ ...modal, data: { ...modal.data, [e.target.name]: e.target.value } }))
                                                    )}
                                                </div>
                                            ))}

                                            {/* Staff Assignment (Admin Only) */}
                                            {isAdmin && (
                                                <div className="col-12">
                                                    <label className="form-label small fw-bold">Assigned Staff</label>
                                                    {modal.type === 'view' ? (
                                                        <div className="fw-medium">{modal.data.assigned_staff_name || 'Unassigned'}</div>
                                                    ) : (
                                                        <select className="form-select" value={modal.data.assigned_staff || ''} onChange={(e) => setModal({ ...modal, data: { ...modal.data, assigned_staff: e.target.value } })}>
                                                            <option value="auto">Auto Allocate</option>
                                                            <option value="">Unassigned</option>
                                                            {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                        </select>
                                                    )}
                                                </div>
                                            )}

                                            {/* Status & Date */}
                                            <div className="col-12">
                                                <label className="form-label small fw-bold">Status</label>
                                                {modal.type === 'view' && modal.data.status !== 'Follow Up' ? (
                                                    <span className={`badge ms-2 ${modal.data.status === 'Completed' ? 'bg-success' : 'bg-warning'}`}>{modal.data.status}</span>
                                                ) : (
                                                    <>
                                                        {!['view'].includes(modal.type) ? (
                                                            <select className="form-select" value={modal.data.status || 'Pending'} onChange={(e) => setModal({ ...modal, data: { ...modal.data, status: e.target.value } })}>
                                                                <option value="Pending">Pending</option>
                                                                <option value="In Progress">In Progress</option>
                                                                <option value="Completed">Completed</option>
                                                                <option value="Follow Up">Follow Up</option>
                                                            </select>
                                                        ) : (
                                                            <div className="fw-bold">{modal.data.status}</div>
                                                        )}

                                                        {modal.data.status === 'Follow Up' && (
                                                            <div className="mt-2">
                                                                <label className="form-label small fw-bold mb-1">Follow Up Date</label>
                                                                {modal.type === 'view' ? (
                                                                    <div>{formatDate(modal.data.follow_up_date)}</div>
                                                                ) : (
                                                                    <input
                                                                        type="datetime-local"
                                                                        className="form-control"
                                                                        value={modal.data.follow_up_date ? new Date(modal.data.follow_up_date).toISOString().slice(0, 16) : ''}
                                                                        onChange={(e) => setModal({ ...modal, data: { ...modal.data, follow_up_date: e.target.value } })}
                                                                        required
                                                                    />
                                                                )}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* ENQUIRY FORM */}
                                    {modal.category === 'enquiry' && (
                                        <div className="row g-3">
                                            <div className="col-12">
                                                <label className="form-label small fw-bold">Name</label>
                                                <input className="form-control bg-light" value={modal.data.name} readOnly />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Email</label>
                                                <input className="form-control bg-light" value={modal.data.email || ''} readOnly />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Phone</label>
                                                <input className="form-control bg-light" value={modal.data.phone} readOnly />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label small fw-bold">Message</label>
                                                <div className="p-2 bg-white border rounded text-muted">{modal.data.message}</div>
                                            </div>

                                            <div className="col-12">
                                                <label className="form-label small fw-bold">Status</label>
                                                {modal.type === 'view' ? (
                                                    <div className="mt-1"><span className="badge bg-info text-dark">{modal.data.status}</span></div>
                                                ) : (
                                                    <>
                                                        <select className="form-select" value={modal.data.status || 'Pending'} onChange={(e) => setModal({ ...modal, data: { ...modal.data, status: e.target.value } })}>
                                                            <option value="Pending">Pending</option>
                                                            <option value="Connected">Connected</option>
                                                            <option value="Follow Up">Follow Up</option>
                                                        </select>
                                                        {modal.data.status === 'Follow Up' && (
                                                            <div className="mt-2">
                                                                <label className="form-label small fw-bold mb-1">Follow Up Date</label>
                                                                <input
                                                                    type="datetime-local"
                                                                    className="form-control"
                                                                    value={modal.data.follow_up_date ? new Date(modal.data.follow_up_date).toISOString().slice(0, 16) : ''}
                                                                    onChange={(e) => setModal({ ...modal, data: { ...modal.data, follow_up_date: e.target.value } })}
                                                                    required
                                                                />
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {modal.type === 'edit' && (
                                        <button className="btn btn-primary w-100 rounded-pill mt-4">Save Changes</button>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FollowUps;
