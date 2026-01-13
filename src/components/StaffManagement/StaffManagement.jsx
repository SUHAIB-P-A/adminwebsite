import React, { useState, useEffect, useRef } from 'react';
import './StaffManagement.css';
import axios from 'axios';
import '../adminpanel/AdminPanel.css';
import '../Settings/Settings.css';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropUtils';

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
    const [documents, setDocuments] = useState([]); // State for staff documents
    // Cropping State
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [activeImg, setActiveImg] = useState(null);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const longPressTimer = useRef(null);

    // Filter State for Assigned Students Modal
    const [studentFilter, setStudentFilter] = useState('all');
    const [studentStatusFilter, setStudentStatusFilter] = useState('Pending');

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

    // Lock body scroll when modal is open
    useEffect(() => {
        if (modal.type || studentModal.type) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [modal.type, studentModal.type]);

    const showToast = (msg, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
    };

    const fetchStaff = async () => {
        try {
            const { data } = await axios.get('/api/staff/');
            setStaffList(data);
        } catch (err) {
            showToast("Failed to load staff", "danger");
        }
        setLoading(false);
    };

    const fetchDocuments = async (staffId) => {
        try {
            const { data } = await axios.get('/api/staff-documents/', { params: { staff_id: staffId } });
            setDocuments(data);
        } catch (err) {
            console.error("Failed to load documents", err);
        }
    };

    useEffect(() => {
        if (modal.data?.id && (modal.type === 'edit' || modal.type === 'view_profile')) {
            fetchDocuments(modal.data.id);
        } else {
            setDocuments([]);
        }
        // Always reset password visibility when modal opens/changes
        if (modal.type === 'add' || modal.type === 'edit') {
            setShowPassword(false);
        }
    }, [modal.data?.id, modal.type]);

    const handleFileUpload = async (e, type = 'document') => {
        const file = e.target.files[0];
        if (!file) return;

        // Check for 2MB limit only for profile image
        if (type === 'profile_image' && file.size > 2 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, profile_image: "Image size exceeds 2MB" }));
            showToast("Image size exceeds 2MB", "danger");
            e.target.value = ''; // Reset input
            return;
        } else {
            setErrors(prev => ({ ...prev, profile_image: null })); // Clear error on success
        }

        if (type === 'profile_image') {
            const reader = new FileReader();
            reader.addEventListener('load', () => setActiveImg(reader.result));
            reader.readAsDataURL(file);
            return;
        }

        if (type === 'official_photo') {
            // Convert to Base64 for official photo
            const reader = new FileReader();
            reader.onloadend = () => {
                setModal(prev => ({ ...prev, data: { ...prev.data, [type]: reader.result } }));
            };
            reader.readAsDataURL(file);
            return;
        }

        // For Staff Documents (PDFs, etc.) - Only available in Edit/View mode with ID
        if (!modal.data?.id) {
            showToast("Please save the staff member first before uploading documents.", "warning");
            return;
        }

        const formData = new FormData();
        formData.append('staff', modal.data.id);
        formData.append('document_name', file.name);
        formData.append('file', file);

        try {
            await axios.post('/api/staff-documents/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast("Document uploaded successfully", "success");
            fetchDocuments(modal.data.id);
        } catch (err) {
            showToast("Upload failed", "danger");
        }
    };

    const handleDeleteDocument = async (docId) => {
        if (!window.confirm("Are you sure you want to delete this document?")) return;
        try {
            await axios.delete(`/api/staff-documents/${docId}/`);
            showToast("Document deleted", "success");
            fetchDocuments(modal.data.id);
        } catch (err) {
            showToast("Delete failed", "danger");
        }
    };

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const saveCroppedImage = async () => {
        try {
            const croppedImage = await getCroppedImg(activeImg, croppedAreaPixels);
            setModal(prev => ({ ...prev, data: { ...prev.data, profile_image: croppedImage } }));
            setActiveImg(null); // Close cropper
            setZoom(1);
        } catch (e) {
            console.error(e);
            showToast("Failed to crop image", "danger");
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setErrors({});
        const payload = { ...modal.data };
        const isEdit = modal.type === 'edit';

        try {
            if (isEdit) {
                // If password is empty, delete it from payload so it's not updated
                if (!payload.password) {
                    delete payload.password;
                }

                await axios.patch(`/api/staff/${payload.id}/`, payload);
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


    const handleDelete = (id = null) => {
        const isBulk = id === 'bulk';
        const count = isBulk ? selection.ids.length : 1;
        setModal({ type: 'delete_confirm', data: { id, count, isBulk } });
    };

    const confirmDelete = async () => {
        const { id, isBulk } = modal.data;
        try {
            if (isBulk) {
                await Promise.all(selection.ids.map(staffId => axios.delete(`/api/staff/${staffId}/`)));
                setSelection({ active: false, ids: [] });
            } else {
                await axios.delete(`/api/staff/${id}/`);
            }
            setModal({ type: 'success', data: { message: "Staff deleted and workload redistributed successfully." } });
            fetchStaff();
        } catch (err) {
            showToast("Delete failed", "danger");
            setModal({ type: null });
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
        setStudentFilter('all'); // Reset filter
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

    const handleViewStudent = async (student) => {
        setStudentModal({ type: 'view', data: student });

        // Mark as read if not already
        if (!student.is_read) {
            try {
                // Update backend
                await axios.put(`/api/submit/${student.id}/`, { ...student, is_read: true });

                // Update local modal data
                setModal(prev => ({
                    ...prev,
                    data: {
                        ...prev.data,
                        students: prev.data.students.map(s => s.id === student.id ? { ...s, is_read: true } : s)
                    }
                }));
            } catch (err) {
                console.error("Failed to mark as read", err);
            }
        }
    };

    const handleAction = async (method, url, data) => {
        try {
            await axios({ method, url, data });
            showToast('Student deleted successfully', 'success');
            setStudentModal({ type: null });
            // Refresh data
            viewStaffStudents(modal.data.id, modal.data.name); // Corrected from handleViewStudents
        } catch (error) {
            console.error(error);
            showToast('Failed to perform action', 'danger');
        }
    };

    const handleViewEnquiry = async (enquiry) => {
        setStudentModal({ type: 'view_enquiry', data: enquiry });

        if (!enquiry.is_read) {
            // Optimistic update
            const updatedEnquiries = modal.data.enquiries.map(e =>
                e.id === enquiry.id ? { ...e, is_read: true } : e
            );

            setModal(prev => ({
                ...prev,
                data: { ...prev.data, enquiries: updatedEnquiries }
            }));

            try {
                // Determine params based on role (similar to Enquiries.jsx logic)
                const staffId = localStorage.getItem('staff_id');
                const role = localStorage.getItem('role');
                const params = (role !== 'admin' && role !== 'Admin' && staffId) ? { staff_id: staffId } : {};

                await axios.put(`/api/enquiries/${enquiry.id}/`, { ...enquiry, is_read: true }, { params });
            } catch (err) {
                console.error("Failed to mark enquiry as read", err);
                // Revert on failure
                setModal(prev => ({
                    ...prev,
                    data: { ...prev.data, enquiries: modal.data.enquiries }
                }));
            }
        }
    };

    const handleEnquiryAction = async (method, url, data = null, successMsg) => {
        try {
            await axios[method](url, data);

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

            <div className="custom-card table-responsive rounded bg-white rounded shadow-sm overflow-hidden">
                <div className="table-responsive custom-scrollbar" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                    <table className="table table-hover mb-0">
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
                                    onClick={() => selection.active ? toggleId(s.id) : viewStaffProfile(s)}
                                    className={selection.ids.includes(s.id) ? "table-active" : ""}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {selection.active && (
                                        <td data-label="Select" className="text-center">
                                            <input type="checkbox" checked={selection.ids.includes(s.id)} readOnly className="form-check-input" />
                                        </td>
                                    )}
                                    <td data-label="ID"><span className="fw-bold text-secondary">#STF{String(index + 1).padStart(3, '0')}</span></td>
                                    <td data-label="Name">
                                        <div className="d-flex align-items-center">
                                            {s.profile_image ? (
                                                <img
                                                    src={s.profile_image}
                                                    alt={s.name}
                                                    className="rounded-circle me-2 border object-fit-cover"
                                                    style={{ width: '40px', height: '40px' }}
                                                />
                                            ) : (
                                                <div
                                                    className="rounded-circle bg-light d-flex align-items-center justify-content-center me-2 border text-secondary fw-bold"
                                                    style={{ width: '40px', height: '40px', fontSize: '16px' }}
                                                >
                                                    {s.name ? s.name.charAt(0).toUpperCase() : 'S'}
                                                </div>
                                            )}
                                            <span className="fw-medium">{s.name}</span>
                                        </div>
                                    </td>
                                    <td data-label="Designation">{s.designation || <span className="text-muted small">N/A</span>}</td>
                                    <td data-label="Login ID"><span className="badge bg-light text-dark border">{s.login_id}</span></td>
                                    <td data-label="Status">
                                        <span className={`badge ${s.active_status ? 'bg-success' : 'bg-secondary'}`}>
                                            {s.active_status ? 'Online' : 'Offline'}
                                        </span>
                                    </td>
                                    <td data-label="Current Load">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="badge bg-info text-dark rounded-pill px-3">
                                                {s.student_count} Students
                                            </span>
                                            <button className="btn btn-sm btn-link text-info p-0" title="View Assigned Students" onClick={(e) => { e.stopPropagation(); viewStaffStudents(s.id, s.name); }}><i className="bi bi-eye"></i></button>
                                        </div>
                                    </td>
                                    <td data-label="Action">
                                        <div className="d-flex gap-1">
                                            <button className="btn btn-sm btn-link text-secondary" title="Manage Profile" onClick={(e) => { e.stopPropagation(); setErrors({}); setModal({ type: 'edit', data: s }); }}><i className="bi bi-pencil-square fs-5"></i></button>
                                            <button className="btn btn-sm btn-link text-danger" onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}><i className="bi bi-trash"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {staffList.length === 0 && !loading && <div className="text-center p-4 text-muted">No staff members found.</div>}
                </div>
            </div>


            {/* Bulk Action Bar */}
            {
                selection.active && (
                    <div className="position-fixed bottom-0 start-50 translate-middle-x mb-4 bg-dark text-white p-3 rounded-pill shadow-lg d-flex gap-3" style={{ zIndex: 1050 }}>
                        <span className="fw-bold">{selection.ids.length} Selected</span>
                        <button className="btn btn-danger btn-sm rounded-pill" onClick={() => handleDelete('bulk')}>Delete</button>
                        <button className="btn btn-secondary btn-sm rounded-pill" onClick={() => setSelection({ active: false, ids: [] })}>Cancel</button>
                    </div>
                )
            }

            {/* Add/Edit Modal */}
            {
                ['add', 'edit'].includes(modal.type) && (
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

                                        <div className="d-flex flex-column align-items-center mb-4">
                                            <div className="position-relative">
                                                <div
                                                    className="rounded-circle bg-light d-flex align-items-center justify-content-center border overflow-hidden shadow-sm clickable-avatar"
                                                    style={{ width: '120px', height: '120px', cursor: 'pointer' }}
                                                    onClick={() => document.getElementById('profileImageInput').click()}
                                                >
                                                    {modal.data.profile_image ? (
                                                        <img src={modal.data.profile_image} alt="Profile" className="w-100 h-100 object-fit-cover" />
                                                    ) : (
                                                        <i className="bi bi-person fs-1 text-secondary"></i>
                                                    )}
                                                </div>
                                                <label
                                                    htmlFor="profileImageInput"
                                                    className="btn btn-primary btn-sm rounded-circle position-absolute bottom-0 end-0 shadow-sm d-flex align-items-center justify-content-center"
                                                    style={{ width: '32px', height: '32px', transform: 'translate(10%, 10%)' }}
                                                >
                                                    <i className="bi bi-camera-fill small"></i>
                                                </label>
                                                <input
                                                    type="file"
                                                    id="profileImageInput"
                                                    className="d-none"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload(e, 'profile_image')}
                                                />
                                            </div>
                                            {errors.profile_image && <div className="text-danger small mt-2 text-center">{errors.profile_image}</div>}
                                        </div>

                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Full Name <span className="text-danger">*</span></label>
                                                <input className={`form-control ${errors.name ? 'is-invalid' : ''}`} required value={modal.data.name || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })} />
                                                {renderError('name')}
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Gender</label>
                                                <select className={`form-select ${errors.gender ? 'is-invalid' : ''}`} value={modal.data.gender || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, gender: e.target.value } })}>
                                                    <option value="">Select Gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                                {renderError('gender')}
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Date of Birth</label>
                                                <input type="date" className={`form-control ${errors.dob ? 'is-invalid' : ''}`} value={modal.data.dob || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, dob: e.target.value } })} />
                                                {renderError('dob')}
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Phone Number</label>
                                                <input className={`form-control ${errors.phone ? 'is-invalid' : ''}`} value={modal.data.phone || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, phone: e.target.value } })} placeholder="+91..." />
                                                {renderError('phone')}
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Secondary Phone</label>
                                                <input className={`form-control ${errors.secondary_phone ? 'is-invalid' : ''}`} value={modal.data.secondary_phone || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, secondary_phone: e.target.value } })} placeholder="Optional" />
                                                {renderError('secondary_phone')}
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
                                                <label className="form-label small fw-bold">Password</label>
                                                <div className="input-group">
                                                    <input
                                                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                                        type={showPassword ? 'text' : 'password'}
                                                        required={modal.type === 'add'}
                                                        placeholder={modal.type === 'add' ? 'Enter Password' : ''}
                                                        autoComplete="new-password"
                                                        value={modal.data.password || ''}
                                                        onChange={e => setModal({ ...modal, data: { ...modal.data, password: e.target.value } })}
                                                    />
                                                    <button
                                                        className="btn btn-outline-secondary"
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        title={showPassword ? "Hide Password" : "Show Password"}
                                                    >
                                                        <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                                                    </button>
                                                </div>
                                                {modal.type === 'edit' && <div className="form-text text-muted small fst-italic">Leave blank to keep the current password.</div>}
                                                {renderError('password')}
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <div className="form-check form-switch">
                                                <input className="form-check-input" type="checkbox" id="activeSwitch" checked={modal.data.active_status} onChange={e => setModal({ ...modal, data: { ...modal.data, active_status: e.target.checked } })} />
                                                <label className="form-check-label" htmlFor="activeSwitch">Online Status (Accepting New Leads)</label>
                                            </div>
                                        </div>

                                        {modal.type === 'edit' && (
                                            <>
                                                <hr className="my-4" />
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <h6 className="fw-bold text-primary mb-0">Documents</h6>
                                                    <div>
                                                        <input type="file" id="docUpload" className="d-none" onChange={handleFileUpload} />
                                                        <button type="button" className="btn btn-sm btn-outline-primary rounded-pill" onClick={() => document.getElementById('docUpload').click()}>
                                                            <i className="bi bi-upload me-1"></i> Upload Document
                                                        </button>
                                                    </div>
                                                </div>

                                                {documents.length > 0 ? (
                                                    <ul className="list-group list-group-flush">
                                                        {documents.map(doc => (
                                                            <li key={doc.id} className="list-group-item d-flex justify-content-between align-items-center bg-light rounded mb-2 border-0">
                                                                <div className="d-flex align-items-center overflow-hidden">
                                                                    <i className="bi bi-file-earmark-text text-primary me-3 fs-5"></i>
                                                                    <div className="text-truncate">
                                                                        <div className="fw-medium text-truncate" style={{ maxWidth: '200px' }}>{doc.document_name}</div>
                                                                        <small className="text-muted">{new Date(doc.created_at).toLocaleDateString()}</small>
                                                                    </div>
                                                                </div>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <a href={doc.file} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-link"><i className="bi bi-eye"></i></a>
                                                                    <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => handleDeleteDocument(doc.id)}><i className="bi bi-trash"></i></button>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <div className="text-muted small text-center p-3 border rounded bg-light border-dashed">No documents uploaded yet.</div>
                                                )}
                                            </>
                                        )}

                                        {modal.type === 'add' && (
                                            <div className="alert alert-info mt-4 mb-0 small">
                                                <i className="bi bi-info-circle me-2"></i> Save the staff member first to upload documents.
                                            </div>
                                        )}
                                    </div>
                                    <div className="modal-footer border-0">
                                        <button type="button" className="btn btn-light rounded-pill" onClick={() => setModal({ type: null })}>Cancel</button>
                                        <button type="submit" className="btn btn-primary rounded-pill px-4">Save Staff</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div >
                )}

            {/* View Profile Modal */}
            {
                modal.type === 'view_profile' && (
                    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                                <div className="modal-header border-0 pb-0">
                                    <h5 className="fw-bold">Staff Profile</h5>
                                    <button className="btn-close" onClick={() => setModal({ type: null })}></button>
                                </div>
                                <div className="modal-body p-4 settings-page">
                                    {/* Read-Only Profile Card (Staff Panel Style) */}
                                    <div className="d-flex flex-column align-items-center mb-5">
                                        <div className="position-relative">
                                            <div
                                                className="profile-image-preview rounded-circle overflow-hidden d-flex align-items-center justify-content-center bg-light shadow-sm"
                                                style={{ width: '120px', height: '120px', border: '3px solid #fff' }}
                                            >
                                                {modal.data.profile_image ? (
                                                    <img src={modal.data.profile_image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <i className="bi bi-person-fill fs-1 text-secondary"></i>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-3 text-center">
                                            <span className="badge bg-light text-dark border">Read Only View</span>
                                        </div>
                                    </div>

                                    {/* Form Fields (Read Only) */}
                                    <div className="mb-4">
                                        <label className="form-label text-muted small fw-bold text-uppercase">Full Name</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-lg bg-light border-0"
                                            value={modal.data.name}
                                            readOnly
                                        />
                                    </div>
                                    <div className="row mb-4">
                                        <div className="col-md-6">
                                            <label className="form-label text-muted small fw-bold text-uppercase">Date of Birth</label>
                                            <div className="position-relative">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-lg bg-light border-0"
                                                    value={modal.data.dob ? new Date(modal.data.dob).toLocaleDateString() : 'N/A'}
                                                    readOnly
                                                />
                                                <i className="bi bi-calendar-event position-absolute top-50 end-0 translate-middle-y me-3 text-muted"></i>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label text-muted small fw-bold text-uppercase">Gender</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-lg bg-light border-0"
                                                value={modal.data.gender || 'N/A'}
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                    <div className="row mb-5">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small fw-bold text-uppercase">Phone</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-lg bg-light border-0"
                                                value={modal.data.phone || 'N/A'}
                                                readOnly
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small fw-bold text-uppercase">Email</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-lg bg-light border-0"
                                                value={modal.data.email || 'N/A'}
                                                readOnly
                                            />
                                        </div>
                                    </div>

                                    {/* Professional Details */}
                                    <div className="row mb-5">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small fw-bold text-uppercase">Designation</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-lg bg-light border-0"
                                                value={modal.data.designation || 'N/A'}
                                                readOnly
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small fw-bold text-uppercase">Department</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-lg bg-light border-0"
                                                value={modal.data.department || 'N/A'}
                                                readOnly
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small fw-bold text-uppercase">Date of Joining</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-lg bg-light border-0"
                                                value={modal.data.date_of_joining ? new Date(modal.data.date_of_joining).toLocaleDateString() : 'N/A'}
                                                readOnly
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label text-muted small fw-bold text-uppercase">Address</label>
                                            <textarea
                                                className="form-control form-control-lg bg-light border-0"
                                                rows="2"
                                                value={modal.data.address || 'N/A'}
                                                readOnly
                                            />
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-end gap-3 pt-3 border-top">
                                        <small className="text-muted fst-italic align-self-center me-auto">
                                            <i className="bi bi-info-circle me-1"></i>
                                            To update profile details, use the Edit action.
                                        </small>
                                    </div>
                                </div>
                                <div className="modal-footer border-0">
                                    <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setModal({ type: null })}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* View Students Modal */}
            {
                modal.type === 'view_students' && (
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
                                                            onClick={() => {
                                                                setModal(prev => ({ ...prev, data: { ...prev.data, activeTab: 'students' } }));
                                                                setStudentFilter('all');
                                                                setStudentStatusFilter('Pending');
                                                            }}
                                                        >
                                                            Students ({modal.data.students.length})
                                                        </button>
                                                    </li>
                                                    <li className="nav-item">
                                                        <button
                                                            className={`nav-link rounded-pill ${modal.data.activeTab === 'enquiries' ? 'active' : ''}`}
                                                            onClick={() => {
                                                                setModal(prev => ({ ...prev, data: { ...prev.data, activeTab: 'enquiries' } }));
                                                                setStudentFilter('all');
                                                                setStudentStatusFilter('Pending');
                                                            }}
                                                        >
                                                            Enquiries ({modal.data.enquiries.length})
                                                        </button>
                                                    </li>
                                                </ul>
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center mb-3 px-3">
                                                <div className="d-flex gap-2">
                                                    <button
                                                        className={`btn btn-sm rounded-pill px-3 ${studentFilter === 'all' ? 'btn-dark' : 'btn-outline-dark'}`}
                                                        onClick={() => setStudentFilter('all')}
                                                    >All</button>
                                                    <button
                                                        className={`btn btn-sm rounded-pill px-3 ${studentFilter === 'unread' ? 'btn-dark' : 'btn-outline-dark'}`}
                                                        onClick={() => setStudentFilter('unread')}
                                                    >Unread</button>
                                                    <select
                                                        className={`form-select form-select-sm rounded-pill px-3 ${studentFilter === 'status' ? 'bg-dark text-white border-dark' : 'text-dark'}`}
                                                        style={{ width: 'auto', minWidth: '130px', cursor: 'pointer' }}
                                                        value={studentFilter === 'status' ? studentStatusFilter : ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (val) {
                                                                setStudentFilter('status');
                                                                setStudentStatusFilter(val);
                                                            }
                                                        }}
                                                    >
                                                        <option value="" disabled>By Status</option>
                                                        {modal.data.activeTab === 'students' ? (
                                                            <>
                                                                <option value="Pending">Pending</option>
                                                                <option value="In Progress">In Progress</option>
                                                                <option value="Completed">Completed</option>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <option value="Pending">Pending</option>
                                                                <option value="Connected">Connected</option>
                                                            </>
                                                        )}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="table-responsive custom-scrollbar" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                                                {modal.data.activeTab === 'students' ? (
                                                    <div className="px-3 pb-3">
                                                        <table className="custom-table table-hover">
                                                            <thead className="sticky-top">
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
                                                                {(() => {
                                                                    const filtered = modal.data.students.filter(st => {
                                                                        if (studentFilter === 'unread') return !st.is_read;
                                                                        if (studentFilter === 'status') return studentStatusFilter ? (st.status || 'Pending') === studentStatusFilter : true;
                                                                        return true;
                                                                    });
                                                                    return filtered.length > 0 ? (
                                                                        filtered.map((st, i) => (
                                                                            <tr key={st.id}
                                                                                className={!st.is_read ? "fw-bold table-unread" : ""}
                                                                                onClick={() => handleViewStudent(st)}
                                                                                style={{ cursor: 'pointer' }}
                                                                                title="Click to view details"
                                                                            >
                                                                                <td className="px-3 fw-bold text-secondary">{i + 1}</td>
                                                                                <td>
                                                                                    <div className="fw-medium">{st.first_name} {st.last_name} {!st.is_read && <span className="badge bg-danger rounded-pill ms-1" style={{ fontSize: '0.6rem' }}>NEW</span>}</div>
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
                                                                                        <button className="btn btn-sm btn-link text-secondary" onClick={(e) => { e.stopPropagation(); handleViewStudent(st); }}><i className="bi bi-eye"></i></button>
                                                                                        <button className="btn btn-sm btn-link text-primary" onClick={(e) => { e.stopPropagation(); setStudentModal({ type: 'edit', data: st }); }}><i className="bi bi-pencil-square"></i></button>
                                                                                        <button className="btn btn-sm btn-link text-danger" onClick={(e) => { e.stopPropagation(); setStudentModal({ type: 'delete', data: { id: st.id } }); }}><i className="bi bi-trash"></i></button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        ))
                                                                    ) : (
                                                                        <tr>
                                                                            <td colSpan="6" className="text-center p-5 text-muted">No students found.</td>
                                                                        </tr>
                                                                    );
                                                                })()}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <table className="table table-hover mb-0 align-middle">
                                                        <thead className="bg-light sticky-top">
                                                            <tr>
                                                                <th className="px-3">#</th>
                                                                <th>Enquiry Name</th>
                                                                <th>Message</th>
                                                                <th>Status</th>
                                                                <th>Joined</th>
                                                                <th>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(() => {
                                                                const filteredEnquiries = modal.data.enquiries.filter(enq => {
                                                                    if (studentFilter === 'unread') return !enq.is_read;
                                                                    if (studentFilter === 'status') return studentStatusFilter ? (enq.status || 'Pending') === studentStatusFilter : true;
                                                                    return true;
                                                                });

                                                                return filteredEnquiries.length > 0 ? (
                                                                    filteredEnquiries.map((enq, i) => (
                                                                        <tr key={enq.id}
                                                                            className={!enq.is_read ? "fw-bold table-unread" : ""}
                                                                            onClick={() => handleViewEnquiry(enq)}
                                                                            style={{ cursor: 'pointer' }}
                                                                        >
                                                                            <td className="px-3 fw-bold text-secondary">{i + 1}</td>
                                                                            <td>
                                                                                <div className="fw-medium">{enq.name} {!enq.is_read && <span className="badge bg-danger rounded-pill ms-1" style={{ fontSize: '0.6rem' }}>NEW</span>}</div>
                                                                            </td>
                                                                            <td title={enq.message} className="text-truncate" style={{ maxWidth: '200px' }}>{enq.message || '-'}</td>
                                                                            <td>
                                                                                <span className={`badge ${enq.status === 'Connected' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                                                                    {enq.status || 'Pending'}
                                                                                </span>
                                                                            </td>
                                                                            <td className="small text-muted">{new Date(enq.created_at).toLocaleDateString()}</td>
                                                                            <td>
                                                                                <div className="d-flex gap-1">
                                                                                    <button className="btn btn-sm btn-link text-secondary" onClick={(e) => { e.stopPropagation(); handleViewEnquiry(enq); }}><i className="bi bi-eye"></i></button>
                                                                                    <button className="btn btn-sm btn-link text-primary" onClick={(e) => { e.stopPropagation(); setStudentModal({ type: 'edit_enquiry', data: enq }); }}><i className="bi bi-pencil-square"></i></button>
                                                                                    <button className="btn btn-sm btn-link text-danger" onClick={(e) => { e.stopPropagation(); setStudentModal({ type: 'delete_enquiry', data: { id: enq.id } }); }}><i className="bi bi-trash"></i></button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan="5" className="text-center p-5 text-muted">No assigned enquiries found matching the filter.</td>
                                                                    </tr>
                                                                );
                                                            })()}
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
                )
            }

            {/* Success Modal */}
            {
                modal.type === 'success' && (
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
                )
            }

            {/* Delete Confirmation Modal */}
            {
                modal.type === 'delete_confirm' && (
                    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                                <div className="modal-body p-4 text-center">
                                    <div className="mb-3">
                                        <div className="mx-auto bg-danger bg-opacity-10 text-danger d-flex align-items-center justify-content-center rounded-circle" style={{ width: '60px', height: '60px' }}>
                                            <i className="bi bi-exclamation-triangle" style={{ fontSize: '2rem' }}></i>
                                        </div>
                                    </div>
                                    <h5 className="fw-bold mb-2">Delete Confirmation</h5>
                                    <p className="text-muted mb-4">
                                        Are you sure you want to delete {modal.data.count > 1 ? `${modal.data.count} staff members` : 'this staff member'}?
                                        <br />
                                        <span className="small text-danger fw-bold">This action will redistribute assigned students and cannot be undone.</span>
                                    </p>
                                    <div className="d-flex gap-2 justify-content-center">
                                        <button className="btn btn-light rounded-pill px-4" onClick={() => setModal({ type: null })}>Cancel</button>
                                        <button className="btn btn-danger rounded-pill px-4" onClick={confirmDelete}>Delete</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Student Action Modals - Nested */}
            {
                ['view', 'edit'].includes(studentModal.type) && (
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
                )
            }

            {/* Student Delete Confirmation */}
            {
                studentModal.type === 'delete' && (
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
                )
            }

            {/* Student Success Modal */}
            {
                studentModal.type === 'success' && (
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
                )
            }

            {/* Enquiry View Modal (Nested) */}
            {
                studentModal.type === 'view_enquiry' && (
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
                )
            }

            {/* Enquiry Edit Modal (Nested) */}
            {
                studentModal.type === 'edit_enquiry' && (
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
                )
            }

            {/* Enquiry Delete Confirmation */}
            {
                studentModal.type === 'delete_enquiry' && (
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
                )
            }

            {/* Cropper Overlay */}
            {
                activeImg && (
                    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content overflow-hidden border-0 shadow-lg">
                                <div className="modal-header p-3 border-bottom-0">
                                    <h6 className="modal-title fw-bold">Crop Profile Photo</h6>
                                    <button type="button" className="btn-close" onClick={() => { setActiveImg(null); setZoom(1); }}></button>
                                </div>
                                <div className="modal-body p-0 position-relative" style={{ height: '400px', backgroundColor: '#000' }}>
                                    <Cropper
                                        image={activeImg}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={1}
                                        onCropChange={setCrop}
                                        onCropComplete={onCropComplete}
                                        onZoomChange={setZoom}
                                    />
                                </div>
                                <div className="modal-footer p-3 border-top-0 bg-light">
                                    <div className="d-flex flex-column w-100 gap-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <i className="bi bi-dash-lg small text-muted"></i>
                                            <input
                                                type="range"
                                                value={zoom}
                                                min={1}
                                                max={3}
                                                step={0.1}
                                                aria-labelledby="Zoom"
                                                onChange={(e) => setZoom(Number(e.target.value))}
                                                className="form-range"
                                            />
                                            <i className="bi bi-plus-lg small text-muted"></i>
                                        </div>
                                        <div className="d-flex gap-2 w-100">
                                            <button className="btn btn-light rounded-pill w-50" onClick={() => { setActiveImg(null); setZoom(1); }}>Cancel</button>
                                            <button className="btn btn-primary rounded-pill w-50" onClick={saveCroppedImage}>Save Photo</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {toast.show && <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 2100 }}><div className={`toast show bg-${toast.type} text-white p-2 px-3 rounded shadow`}>{toast.msg}</div></div>}
        </div >
    );
};

export default StaffManagement;
