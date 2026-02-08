import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../adminpanel/AdminPanel.css';



const currentYear = new Date().getFullYear();
const years = Array.from({ length: 21 }, (_, i) => currentYear - i);

const FIELD_CONFIG = [
    { name: 'first_name', label: 'First Name', required: true, half: true },
    { name: 'last_name', label: 'Last Name', required: true, half: true },
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

const Students = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ type: null, data: null }); // types: 'view', 'add', 'edit', 'delete'
    const [selection, setSelection] = useState({ active: false, ids: [] });
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
    const [errors, setErrors] = useState({});

    const longPressTimer = useRef(null);
    const longPressTriggered = useRef(false);

    const [staffList, setStaffList] = useState([]);
    const [filter, setFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('Pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'

    // Role check: hide Assigned Staff column for non-admin users
    const role = localStorage.getItem('role');
    const isAdmin = role === 'admin' || role === 'Admin';

    const showToast = (msg, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
    };

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
            longPressTriggered.current = true;
            setSelection(p => ({ ...p, active: true }));
            toggleId(id);
        }, 500);
    };

    const cancelLongPress = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    // Open view modal and mark student as read (optimistic update)
    const handleViewStudent = async (student) => {
        if (longPressTriggered.current) {
            longPressTriggered.current = false;
            return;
        }

        if (selection.active) {
            toggleId(student.id);
            return;
        }

        setModal({ type: 'view', data: student });

        // Optimistically mark as read so shading/NEW badge disappears immediately
        if (!student.is_read) {
            const now = new Date().toISOString();
            const updatedStudent = { ...student, is_read: true, viewed_at: now };
            setModal(prev => ({ ...prev, data: updatedStudent })); // Update modal data immediately
            setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s));

            try {
                const staffId = localStorage.getItem('staff_id');
                const role = localStorage.getItem('role');
                const params = (role !== 'admin' && role !== 'Admin') ? { staff_id: staffId } : {};

                await axios.put(`/api/submit/${student.id}/`, { ...student, is_read: true }, { params });
            } catch (err) {
                // Revert optimistic change on failure
                setStudents(prev => prev.map(s => s.id === student.id ? { ...s, is_read: false, viewed_at: null } : s));
                console.error('Failed to mark student as read', err);
                showToast("Failed to mark student as read", "danger");
            }
        }
    };

    const confirmDelete = async () => {
        const isBulk = modal.data?.type === 'bulk';
        try {
            if (isBulk) {
                await Promise.all(selection.ids.map(id => axios.delete(`/api/submit/${id}/`)));
                setModal({
                    type: 'success',
                    data: {
                        message: `Successfully deleted ${selection.ids.length} student record${selection.ids.length > 1 ? 's' : ''} from database`,
                        title: 'Bulk Deletion Complete'
                    }
                });
                setSelection({ active: false, ids: [] });
            } else {
                await axios.delete(`/api/submit/${modal.data.id}/`);
                setModal({
                    type: 'success',
                    data: {
                        message: 'Student record permanently deleted from database',
                        title: 'Student Deleted'
                    }
                });
            }
            fetchStudents();
        } catch (err) {
            showToast("Delete failed", "danger");
            setModal({ type: null });
        }
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

        // Special handling for phone number with +91 prefix
        if (f.name === 'phone_number') {
            inputElem = (
                <div className="input-group">
                    <span className="input-group-text bg-light">+91</span>
                    <input
                        {...props}
                        type="tel"
                        maxLength={10}
                        pattern="[0-9]{10}"
                        placeholder="10-digit mobile number"
                        onInput={(e) => {
                            // Allow only numbers
                            e.target.value = e.target.value.replace(/[^0-9]/g, '');
                        }}
                    />
                </div>
            );
        } else if (f.name === 'dob' && f.type === 'date') {
            // Special handling for Date of Birth - only allow past dates
            const today = new Date().toISOString().split('T')[0];
            const minDate = new Date();
            minDate.setFullYear(minDate.getFullYear() - 100); // Max 100 years old
            const minDateStr = minDate.toISOString().split('T')[0];

            inputElem = (
                <input
                    {...props}
                    type="date"
                    max={today}
                    min={minDateStr}
                    placeholder="Select date of birth"
                />
            );
        } else if (f.type === 'select') {
            inputElem = <select {...props} className={`form-select ${hasError ? 'is-invalid' : ''}`}><option value="">Select {f.label}</option>{f.options.map(o => <option key={o} value={o}>{o}</option>)}</select>;
        } else if (f.type === 'textarea') {
            inputElem = <textarea {...props} rows="2" />;
        } else {
            inputElem = <input {...props} type={f.type || 'text'} />;
        }

        return (
            <>
                {inputElem}
                {hasError && <div className="invalid-feedback">{Array.isArray(errorMsg) ? errorMsg[0] : errorMsg}</div>}
            </>
        );
    };

    const filteredStudents = students.filter(s => {
        // Tab-based filtering: separate active from completed
        if (activeTab === 'active') {
            // Active tab: exclude completed students
            if (s.status === 'Completed') return false;
        } else if (activeTab === 'completed') {
            // Completed tab: only show completed students
            if (s.status !== 'Completed') return false;
        }

        // Search filter by name
        if (searchQuery.trim()) {
            const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
            const query = searchQuery.toLowerCase().trim();
            if (!fullName.includes(query)) return false;
        }

        // Status filters (only apply on active tab)
        if (activeTab === 'active') {
            const normStatus = (s.status || 'Pending').toString().trim().toLowerCase();
            const target = statusFilter ? statusFilter.toString().trim().toLowerCase() : '';
            if (filter === 'unread') return !s.is_read;
            if (filter === 'status') return target ? normStatus === target : true;
        }
        // Completed tab: no additional filters needed

        return true;
    });

    return (
        <div className="p-4 page-anime">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="page-title mb-0">Student-forms</h1>

            </div>

            {/* Tab Navigation */}
            <div className="mb-3">
                <div className="btn-group" role="group">
                    <button
                        className={`btn ${activeTab === 'active' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => {
                            setActiveTab('active');
                            setFilter('all');
                            setSearchQuery('');
                        }}
                    >
                        <i className="bi bi-hourglass-split me-2"></i>
                        Active Students
                        <span className={`badge ms-2 ${activeTab === 'active' ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
                            {students.filter(s => s.status !== 'Completed').length}
                        </span>
                    </button>
                    <button
                        className={`btn ${activeTab === 'completed' ? 'btn-success' : 'btn-outline-success'}`}
                        onClick={() => {
                            setActiveTab('completed');
                            setFilter('all');
                            setSearchQuery('');
                        }}
                    >
                        <i className="bi bi-check-circle me-2"></i>
                        Completed
                        <span className={`badge ms-2 ${activeTab === 'completed' ? 'bg-white text-success' : 'bg-success text-white'}`}>
                            {students.filter(s => s.status === 'Completed').length}
                        </span>
                    </button>
                </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3 px-1 controls-row">
                <div className="d-flex gap-2 flex-wrap align-items-center">
                    {/* Search Field */}
                    <div className="position-relative" style={{ minWidth: '250px' }}>
                        <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
                        <input
                            type="text"
                            className="form-control form-control-sm rounded-pill ps-5"
                            placeholder="Search by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingRight: searchQuery ? '2.5rem' : '1rem' }}
                        />
                        {searchQuery && (
                            <button
                                className="btn btn-sm position-absolute top-50 end-0 translate-middle-y me-2 p-0"
                                onClick={() => setSearchQuery('')}
                                style={{ background: 'transparent', border: 'none', width: '20px', height: '20px' }}
                                title="Clear search"
                            >
                                <i className="bi bi-x-circle-fill text-secondary"></i>
                            </button>
                        )}
                    </div>


                    {/* Filters - conditional based on tab */}
                    {activeTab === 'active' ? (
                        <>
                            <button className={`btn btn-sm rounded-pill px-3 ${filter === 'all' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setFilter('all')}>All</button>
                            <button className={`btn btn-sm rounded-pill px-3 ${filter === 'unread' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setFilter('unread')}>Unread</button>
                            <select className={`form-select form-select-sm rounded-pill px-3 ${filter === 'status' ? 'bg-dark text-white border-dark' : 'text-dark'}`} style={{ width: 'auto', minWidth: '130px', cursor: 'pointer' }} value={filter === 'status' ? statusFilter : ''} onChange={(e) => { const val = e.target.value; if (val) { setFilter('status'); setStatusFilter(val); } }}>
                                <option value="" disabled>By Status</option>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                            </select>
                        </>
                    ) : null}
                </div>
                <button className="btn btn-primary rounded-pill px-4" onClick={() => setModal({ type: 'add', data: {} })}>
                    <i className="bi bi-plus-lg me-2"></i> Add Student
                </button>
            </div>

            <div className="custom-card p-0 bg-white rounded shadow-sm overflow-hidden">
                <div className="table-responsive custom-scrollbar" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                    <table className="custom-table table-hover mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                {selection.active && <th className="px-2 text-center" style={{ width: '5%' }}><input type="checkbox" className="form-check-input" checked={selection.ids.length === filteredStudents.length && filteredStudents.length > 0} onChange={(e) => setSelection(p => ({ ...p, ids: e.target.checked ? filteredStudents.map(s => s.id) : [] }))} /></th>}
                                <th style={{ width: '5%' }}>#ID</th>
                                <th style={{ width: selection.active ? '19%' : '20%' }}>Name</th>
                                <th style={{ width: '20%' }}>Course</th>
                                <th style={{ width: '15%' }}>Status</th>
                                {isAdmin && <th style={{ width: '20%' }}>Assigned Staff</th>}
                                <th style={{ width: '20%' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan={6 - (isAdmin ? 0 : 1) + (selection.active ? 1 : 0)} className="text-center p-4">Loading...</td></tr> : filteredStudents.map((s, index) => (
                                <tr key={s.id}
                                    onMouseDown={() => handleLongPress(s.id)}
                                    onMouseUp={cancelLongPress}
                                    onMouseLeave={() => { cancelLongPress(); longPressTriggered.current = false; }}
                                    onTouchStart={() => handleLongPress(s.id)}
                                    onTouchEnd={cancelLongPress}
                                    onClick={() => handleViewStudent(s)}
                                    className={`${selection.ids.includes(s.id) ? "table-active" : ""} ${!s.is_read ? "fw-bold table-unread" : ""}`}>
                                    {selection.active && <td data-label="Select" className="text-center col-select"><input type="checkbox" checked={selection.ids.includes(s.id)} readOnly className="form-check-input" /></td>}
                                    <td data-label="ID" className="fw-bold text-secondary col-id">{index + 1}</td>
                                    <td data-label="Name" className="col-name">{s.first_name} {s.last_name} {!s.is_read && <span className="badge bg-danger rounded-pill ms-2" style={{ fontSize: '0.6rem' }}>NEW</span>}</td>
                                    <td data-label="Course" className="col-course">{s.course_selected || 'N/A'}</td>
                                    <td data-label="Status" className="col-status">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="status-label d-md-none text-secondary small">Status:</span>
                                            <span style={{ fontSize: '0.85rem', padding: '0.4em 0.8em' }} className={`badge rounded-pill ${s.status === 'Completed' ? 'bg-success' :
                                                s.status === 'In Progress' ? 'bg-primary' :
                                                    s.status === 'Follow Up' ? 'bg-info text-dark' :
                                                        s.status === 'Pending' ? 'bg-warning text-dark' :
                                                            'bg-secondary'
                                                }`}>
                                                {s.status || 'Pending'}
                                            </span>
                                            {s.follow_up_date && (
                                                <small className="text-secondary d-none d-md-inline ms-1" style={{ fontSize: '0.75rem' }}>
                                                    <i className="bi bi-clock-history me-1"></i>
                                                    {new Date(s.follow_up_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </small>
                                            )}
                                        </div>
                                    </td>
                                    {isAdmin && (
                                        <td data-label="Assigned Staff" className="col-staff">
                                            {s.assigned_staff_name ? (
                                                <span className="badge badge-assigned-staff border">
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
                                    )}
                                    <td data-label="Action" className="col-action">
                                        <div className="d-flex gap-2">
                                            <button className="action-btn btn-view rounded" style={{ width: '38px', height: '38px' }} onClick={(e) => { e.stopPropagation(); handleViewStudent(s); }}><i className="bi bi-eye-fill"></i></button>
                                            <button className="action-btn btn-edit rounded" style={{ width: '38px', height: '38px' }} onClick={(e) => { e.stopPropagation(); setModal({ type: 'edit', data: s }); }}><i className="bi bi-pencil-square"></i></button>
                                            <button className="action-btn btn-delete rounded" style={{ width: '38px', height: '38px' }} onClick={(e) => { e.stopPropagation(); setModal({ type: 'delete', data: { id: s.id } }); }}><i className="bi bi-trash-fill"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selection.active && (
                <div className="position-fixed bottom-0 start-50 translate-middle-x mb-4 bg-dark text-white p-3 rounded-pill shadow-lg d-flex gap-3" style={{ zIndex: 1050 }}>
                    <span className="fw-bold">{selection.ids.length} Selected</span>
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
                                        {Object.entries(modal.data).map(([k, v]) => {
                                            if (!v || k === 'plus_two_percentage' || k === 'extra_data') return null;
                                            let displayValue = v;
                                            if (['created_at', 'viewed_at', 'follow_up_date'].includes(k)) {
                                                displayValue = new Date(v).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                                            }
                                            return (
                                                <div className="col-6" key={k}>
                                                    <label className="text-secondary small text-capitalize">{k.replace(/_/g, ' ')}</label>
                                                    <div className="fw-medium text-break">{displayValue}</div>
                                                </div>
                                            );
                                        })}
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
                                                    <option value="Follow Up">Follow Up</option>
                                                </select>
                                                {modal.data.status === 'Follow Up' && (
                                                    <div className="mt-2">
                                                        <label className="form-label small fw-bold mb-1">Follow Up Date & Time</label>
                                                        <input
                                                            type="datetime-local"
                                                            className="form-control form-control-sm bg-light"
                                                            value={modal.data.follow_up_date ? new Date(modal.data.follow_up_date).toISOString().slice(0, 16) : ''}
                                                            min={new Date().toISOString().slice(0, 16)}
                                                            onChange={(e) => setModal({ ...modal, data: { ...modal.data, follow_up_date: e.target.value } })}
                                                            required
                                                        />
                                                    </div>
                                                )}
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
                            <p className="text-muted mb-2">
                                {modal.data?.type === 'bulk'
                                    ? `Delete ${selection.ids.length} student record${selection.ids.length > 1 ? 's' : ''}?`
                                    : 'Delete this student record?'
                                }
                            </p>
                            <p className="small text-danger fw-bold mb-3">
                                ⚠️ This will permanently remove the data from database and cannot be undone
                            </p>
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
                            <h5 className="fw-bold mb-2">{modal.data?.title || 'Success!'}</h5>
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