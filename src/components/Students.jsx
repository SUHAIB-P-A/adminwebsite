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

const Students = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ type: null, data: null }); // types: 'view', 'add', 'edit', 'delete'
    const [selection, setSelection] = useState({ active: false, ids: [] });
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
    const [errors, setErrors] = useState({});

    const longPressTimer = useRef(null);

    const [staffList, setStaffList] = useState([]);

    const fetchStudents = async () => {
        try {
            const staffId = localStorage.getItem('staff_id');
            const role = localStorage.getItem('role');

            // Send staff_id as query param for robust filtering
            const params = (role !== 'admin' && role !== 'Admin') ? { staff_id: staffId } : {};

            // Security Safeguard: If Staff but no ID, don't fetch
            if ((role !== 'admin' && role !== 'Admin') && (!staffId || staffId === 'null' || staffId === 'undefined')) {
                console.warn("Staff ID missing or invalid. Aborting fetch to prevent data leak.");
                setLoading(false);
                return;
            }

            const { data } = await axios.get('/api/submit/', { params });
            setStudents(data);

            // If Admin, also fetch staff list for dropdown
            if (role === 'admin' || role === 'Admin') {
                const staffResp = await axios.get('/api/staff/');
                setStaffList(staffResp.data);
            }
        } catch (err) { showToast("Failed to load data", "danger"); }
        setLoading(false);
    };

    useEffect(() => { fetchStudents(); }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
    };

    const handleAction = async (method, url, payload = null, successMsg) => {
        setErrors({}); // Clear previous errors
        try {
            // Pass header for edit/delete if needed
            const staffId = localStorage.getItem('staff_id');
            const role = localStorage.getItem('role');
            // Use params for consistency
            const params = (role !== 'admin' && role !== 'Admin') ? { staff_id: staffId } : {};

            if (payload) await axios[method](url, payload, { params });
            else await axios[method](url, { params });

            setModal({ type: 'success', data: { message: successMsg } }); // Show success modal
            fetchStudents();
            if (selection.active) setSelection({ active: false, ids: [] });
        } catch (err) {
            const errorData = err.response?.data;
            if (errorData && typeof errorData === 'object') {
                setErrors(errorData);
                // Keep toast for generic errors or if no specific field errors
                if (errorData.error || errorData.detail) {
                    showToast(errorData.error || errorData.detail || "Operation failed", "danger");
                } else {
                    showToast("Please check the form for errors.", "danger");
                }
            } else {
                showToast("Operation failed", "danger");
            }
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

    const confirmDelete = () => {
        const isBulk = modal.data?.type === 'bulk';
        const url = (id) => `/api/submit/${id}/`;
        isBulk
            ? Promise.all(selection.ids.map(id => axios.delete(url(id)))).then(() => { showToast("Deleted successfully"); fetchStudents(); setSelection({ active: false, ids: [] }); setModal({ type: null }); })
            : handleAction('delete', url(modal.data.id), null, "Student deleted");
    };

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

    return (
        <div className="p-4 page-anime">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="page-title mb-0">Student-forms</h1>
                <button className="btn btn-primary rounded-pill px-4" onClick={() => setModal({ type: 'add', data: {} })}>
                    <i className="bi bi-plus-lg me-2"></i> Add Student
                </button>
            </div>

            <div className="custom-card table-responsive bg-white rounded shadow-sm custom-scrollbar" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                <table className="table table-hover mb-0 align-middle">
                    <thead className="bg-light sticky-top">
                        <tr>
                            {selection.active && <th className="px-2 text-center" style={{ width: '5%' }}><input type="checkbox" className="form-check-input" checked={selection.ids.length === students.length} onChange={(e) => setSelection(p => ({ ...p, ids: e.target.checked ? students.map(s => s.id) : [] }))} /></th>}
                            <th style={{ width: '5%' }}>#ID</th>
                            <th style={{ width: selection.active ? '19%' : '20%' }}>Name</th>
                            <th style={{ width: '20%' }}>Course</th>
                            <th style={{ width: '15%' }}>Status</th>
                            <th style={{ width: '20%' }}>Assigned Staff</th>
                            <th style={{ width: '20%' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan="7" className="text-center p-4">Loading...</td></tr> : students.map((s, index) => (
                            <tr key={s.id}
                                onMouseDown={() => handleLongPress(s.id)} onMouseUp={() => clearTimeout(longPressTimer.current)}
                                onClick={() => selection.active && toggleId(s.id)}
                                className={selection.ids.includes(s.id) ? "table-active" : ""}>
                                {selection.active && <td className="text-center"><input type="checkbox" checked={selection.ids.includes(s.id)} readOnly className="form-check-input" /></td>}
                                <td className="fw-bold text-secondary">{index + 1}</td>
                                <td>{s.first_name} {s.last_name}</td>
                                <td>{s.course_selected || 'N/A'}</td>
                                <td>
                                    <span className={`badge rounded-pill ${s.status === 'Completed' ? 'bg-success' :
                                        s.status === 'In Progress' ? 'bg-primary' :
                                            s.status === 'Pending' ? 'bg-warning text-dark' :
                                                'bg-secondary'
                                        }`}>
                                        {s.status || 'Pending'}
                                    </span>
                                </td>
                                <td>
                                    {s.assigned_staff_name ? (
                                        <span className="badge badge-assigned-staff border">
                                            <i className="bi bi-person-fill me-1"></i>
                                            {(() => {
                                                if (staffList.length > 0) {
                                                    const idx = staffList.findIndex(st => st.id === s.assigned_staff);
                                                    // Use the name from the fresh staffList to ensure consistency
                                                    if (idx !== -1) return `${staffList[idx].name} (#STF${String(idx + 1).padStart(3, '0')})`;
                                                }
                                                return s.assigned_staff_name;
                                            })()}
                                        </span>
                                    ) : (
                                        <span className="text-muted small"><em>Unassigned</em></span>
                                    )}
                                </td>
                                <td>
                                    <div className="d-flex gap-1">
                                        <button className="action-btn btn-view" onClick={(e) => { e.stopPropagation(); setModal({ type: 'view', data: s }); }}><i className="bi bi-eye"></i></button>
                                        <button className="action-btn btn-edit" onClick={(e) => { e.stopPropagation(); setModal({ type: 'edit', data: s }); }}><i className="bi bi-pencil-square"></i></button>
                                        <button className="action-btn btn-delete" onClick={(e) => { e.stopPropagation(); setModal({ type: 'delete', data: { id: s.id } }); }}><i className="bi bi-trash"></i></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selection.active && (
                <div className="position-fixed bottom-0 start-50 translate-middle-x mb-4 bg-dark text-white p-3 rounded-pill shadow-lg d-flex gap-3" style={{ zIndex: 1050 }}>
                    <span className="fw-bold">{selection.ids.length} Selected</span>
                    {/* Hide Bulk Delete for Staff to prevent accidents, or allow if they really want? Prompt says they can delete assigned. keeping safe. */}
                    <button className="btn btn-danger btn-sm rounded-pill" onClick={() => setModal({ type: 'delete', data: { type: 'bulk' } })}>Delete</button>
                    <button className="btn btn-secondary btn-sm rounded-pill" onClick={() => setSelection({ active: false, ids: [] })}>Cancel</button>
                </div>
            )}

            {/* View/Add/Edit Modal Combined Logic */}
            {['view', 'add', 'edit'].includes(modal.type) && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                            <div className="modal-header">
                                <h5 className="fw-bold">{modal.type.toUpperCase()} Student</h5>
                                <button className="btn-close" onClick={() => setModal({ type: null })}></button>
                            </div>
                            <div className="modal-body">
                                {modal.type === 'view' ? (
                                    <div className="row g-3">
                                        {Object.entries(modal.data).map(([k, v]) => v && k !== 'plus_two_percentage' && (
                                            <div className="col-6" key={k}>
                                                <label className="text-secondary small text-capitalize">{k.replace(/_/g, ' ')}</label>
                                                <div className="fw-medium">{v}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        let payload = { ...modal.data };
                                        if (payload.assigned_staff === 'auto') {
                                            payload.assigned_staff = null;
                                            payload.auto_allocate = true;
                                        }
                                        modal.type === 'add'
                                            ? handleAction('post', '/api/submit/', payload, "Added!")
                                            : handleAction('put', `/api/submit/${modal.data.id}/`, payload, "Updated!");
                                    }}>
                                        <div className="row g-3">
                                            {FIELD_CONFIG.map(f => (
                                                <div className={f.half ? "col-6" : "col-12"} key={f.name}>
                                                    <label className="form-label small fw-bold">{f.label} {f.required && '*'}</label>
                                                    {renderInput(f, modal.data, (e) => setModal({ ...modal, data: { ...modal.data, [e.target.name]: e.target.value } }))}
                                                </div>
                                            ))}

                                            {(localStorage.getItem('role') === 'admin' || localStorage.getItem('role') === 'Admin') && (
                                                <div className="col-12">
                                                    <label className="form-label small fw-bold">Assigned Staff</label>
                                                    <select
                                                        className="form-select"
                                                        value={modal.data.assigned_staff || ''}
                                                        onChange={(e) => setModal({ ...modal, data: { ...modal.data, assigned_staff: e.target.value } })}
                                                    >
                                                        <option value="auto">Auto Allocate (Auto-assign to least loaded)</option>
                                                        <option value="">Unassigned</option>
                                                        {staffList.map((s, index) => (
                                                            <option key={s.id} value={s.id}>
                                                                {s.name} (#STF{String(index + 1).padStart(3, '0')})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="form-text small">Selecting "Auto Allocate" will automatically assign this student to the staff member with the lowest workload.</div>
                                                </div>
                                            )}

                                            <div className="col-12">
                                                <label className="form-label small fw-bold">Status</label>
                                                <select
                                                    className="form-select"
                                                    value={modal.data.status || 'Pending'}
                                                    onChange={(e) => setModal({ ...modal, data: { ...modal.data, status: e.target.value } })}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Completed">Completed</option>
                                                </select>
                                            </div>
                                        </div>

                                        <button className="btn btn-primary w-100 rounded-pill mt-4">{modal.type === 'add' ? 'Add' : 'Update'} Student</button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {modal.type === 'delete' && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-sm modal-dialog-centered">
                        <div className="modal-content text-center p-3">
                            <i className="bi bi-exclamation-circle text-danger display-4"></i>
                            <h5 className="fw-bold">Confirm Delete</h5>
                            <p className="small text-muted">This action is permanent.</p>
                            <div className="d-flex gap-2 justify-content-center">
                                <button className="btn btn-light rounded-pill" onClick={() => setModal({ type: null })}>Cancel</button>
                                <button className="btn btn-danger rounded-pill px-4" onClick={confirmDelete}>Delete</button>
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

            {toast.show && <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1100 }}><div className={`toast show bg-${toast.type} text-white p-2 px-3 rounded shadow`}>{toast.msg}</div></div>}
        </div>
    );
};

export default Students;