import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../adminpanel/AdminPanel.css'; // Reusing existing styles for consistency

const Enquiries = () => {
    const [enquiries, setEnquiries] = useState([]);
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [staffList, setStaffList] = useState([]);
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
    const [selection, setSelection] = useState({ active: false, ids: [] });
    const [isEditMode, setIsEditMode] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ show: false, data: null });
    const [successModal, setSuccessModal] = useState({ show: false, data: null });
    const longPressTimer = useRef(null);
    const longPressTriggered = useRef(false);

    // Role check: hide Assigned Staff column for non-admin users
    const role = localStorage.getItem('role');
    const isAdmin = role === 'admin' || role === 'Admin';

    const [filter, setFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('Pending');
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'connected'

    // Fetch Enquiries and Staff (if Admin)
    useEffect(() => {
        const initData = async () => {
            const role = localStorage.getItem('role');
            await fetchEnquiries();
            if (role === 'admin' || role === 'Admin') {
                fetchStaff();
            }
        };
        initData();
    }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
    };

    const fetchStaff = async () => {
        try {
            const { data } = await axios.get('/api/staff/');
            setStaffList(data);
        } catch (err) {
            console.error("Failed to load staff list", err);
        }
    };

    const fetchEnquiries = async () => {
        try {
            const staffId = localStorage.getItem('staff_id');
            const role = localStorage.getItem('role');
            const params = (role !== 'admin' && role !== 'Admin' && staffId) ? { staff_id: staffId } : {};

            // Security Safeguard
            if ((role !== 'admin' && role !== 'Admin') && (!staffId || staffId === 'null' || staffId === 'undefined')) {
                console.warn("Staff ID missing or invalid. Aborting fetch to prevent data leak.");
                setLoading(false);
                return;
            }

            const response = await axios.get('/api/enquiries/', { params });
            setEnquiries(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching enquiries:", error);
            showToast("Failed to fetch enquiries", "danger");
            setLoading(false);
        }
    };

    // Handle Update Enquiry
    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const staffId = localStorage.getItem('staff_id');
            const role = localStorage.getItem('role');
            const params = (role !== 'admin' && role !== 'Admin' && staffId) ? { staff_id: staffId } : {};

            let payload = { ...selectedEnquiry };
            if (payload.assigned_staff === 'auto') {
                payload.assigned_staff = null;
                payload.auto_allocate = true;
            }

            await axios.put(`/api/enquiries/${selectedEnquiry.id}/`, payload, { params });

            showToast("Enquiry updated successfully!");
            closeModal();
            fetchEnquiries();
        } catch (error) {
            console.error("Error updating enquiry:", error);
            showToast("Failed to update enquiry", "danger");
        }
    };

    // Open Modal and Mark as Read (optimistic update)
    const handleView = async (enquiry, editMode = false) => {
        if (longPressTriggered.current) {
            longPressTriggered.current = false;
            return;
        }

        if (selection.active) {
            toggleId(enquiry.id);
            return;
        }

        setSelectedEnquiry(enquiry);
        setIsEditMode(editMode);
        setShowModal(true);

        // Optimistically mark as read if not already, update server in background and revert on error
        if (!enquiry.is_read) {
            // Optimistic UI update so shading disappears immediately
            const now = new Date().toISOString();
            const updatedEnquiry = { ...enquiry, is_read: true, viewed_at: now };

            // If viewing details, update the selected enquiry state to show timestamp immediately
            if (!editMode) {
                setSelectedEnquiry(updatedEnquiry);
            }

            setEnquiries(prev => prev.map(e => e.id === enquiry.id ? updatedEnquiry : e));
            try {
                const staffId = localStorage.getItem('staff_id');
                const role = localStorage.getItem('role');
                const params = (role !== 'admin' && role !== 'Admin' && staffId) ? { staff_id: staffId } : {};

                await axios.put(`/api/enquiries/${enquiry.id}/`, { ...enquiry, is_read: true }, { params });
            } catch (err) {
                // Revert optimistic change on failure
                setEnquiries(prev => prev.map(e => e.id === enquiry.id ? { ...e, is_read: false, viewed_at: null } : e));
                console.error("Failed to mark as read", err);
                showToast("Failed to mark enquiry as read", "danger");
            }
        }
    };

    // Close Modal
    const closeModal = () => {
        setShowModal(false);
        setSelectedEnquiry(null);
        setIsEditMode(false);
    };

    // Handle Delete - Show confirmation modal
    const handleDelete = (id) => {
        const isBulk = id === 'bulk';
        setDeleteModal({
            show: true,
            data: {
                id,
                isBulk,
                count: isBulk ? selection.ids.length : 1
            }
        });
    };

    // Confirm Delete - Actually delete from database
    const confirmDelete = async () => {
        const { id, isBulk } = deleteModal.data;
        try {
            const staffId = localStorage.getItem('staff_id');
            const role = localStorage.getItem('role');
            const params = (role !== 'admin' && role !== 'Admin' && staffId) ? { staff_id: staffId } : {};

            let deletionSummary = [];

            if (isBulk) {
                await Promise.all(selection.ids.map(eid => axios.delete(`/api/enquiries/${eid}/`, { params })));
                deletionSummary = [
                    `Successfully deleted ${selection.ids.length} enquiry record${selection.ids.length > 1 ? 's' : ''} from database`
                ];
                setSelection({ active: false, ids: [] });
            } else {
                await axios.delete(`/api/enquiries/${id}/`, { params });
                deletionSummary = [
                    'Enquiry record permanently deleted from database'
                ];
            }

            setDeleteModal({ show: false, data: null });
            setSuccessModal({
                show: true,
                data: {
                    title: isBulk ? 'Bulk Deletion Complete' : 'Enquiry Deleted',
                    message: deletionSummary.join(' • ')
                }
            });
            fetchEnquiries();
        } catch (error) {
            console.error("Error deleting enquiry:", error);
            showToast("Delete failed", "danger");
            setDeleteModal({ show: false, data: null });
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

    // Filter Logic
    const filteredEnquiries = enquiries.filter(enq => {
        // Tab-based filtering: separate active from connected
        if (activeTab === 'active') {
            if (enq.status === 'Connected') return false;
        } else if (activeTab === 'connected') {
            if (enq.status !== 'Connected') return false;
        }

        // Status filters (only on active tab)
        if (activeTab === 'active') {
            if (filter === 'unread') return !enq.is_read;
            if (filter === 'status') return statusFilter ? enq.status === statusFilter : true;
        }

        return true;
    });

    return (
        <div className="p-4 page-anime">
            <h1 className="page-title">Enquiries</h1>

            {/* Tab Navigation */}
            <div className="mb-3">
                <div className="btn-group" role="group">
                    <button
                        className={`btn ${activeTab === 'active' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => {
                            setActiveTab('active');
                            setFilter('all');
                        }}
                    >
                        <i className="bi bi-hourglass-split me-2"></i>
                        Active Enquiries
                        <span className={`badge ms-2 ${activeTab === 'active' ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
                            {enquiries.filter(e => e.status !== 'Connected').length}
                        </span>
                    </button>
                    <button
                        className={`btn ${activeTab === 'connected' ? 'btn-success' : 'btn-outline-success'}`}
                        onClick={() => {
                            setActiveTab('connected');
                            setFilter('all');
                        }}
                    >
                        <i className="bi bi-check-circle me-2"></i>
                        Connected
                        <span className={`badge ms-2 ${activeTab === 'connected' ? 'bg-white text-success' : 'bg-success text-white'}`}>
                            {enquiries.filter(e => e.status === 'Connected').length}
                        </span>
                    </button>
                </div>
            </div>

            {/* Sorting/Filtering Controls */}
            <div className="d-flex justify-content-between align-items-center mb-3 px-1 controls-row">
                {activeTab === 'active' ? (
                    <div className="d-flex gap-2">
                        <button
                            className={`btn btn-sm rounded-pill px-3 ${filter === 'all' ? 'btn-dark' : 'btn-outline-dark'}`}
                            onClick={() => setFilter('all')}
                        >All</button>
                        <button
                            className={`btn btn-sm rounded-pill px-3 ${filter === 'unread' ? 'btn-dark' : 'btn-outline-dark'}`}
                            onClick={() => setFilter('unread')}
                        >Unread</button>
                        <select
                            className={`form-select form-select-sm rounded-pill px-3 ${filter === 'status' ? 'bg-dark text-white border-dark' : 'text-dark'}`}
                            style={{ width: 'auto', minWidth: '130px', cursor: 'pointer' }}
                            value={filter === 'status' ? statusFilter : ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val) {
                                    setFilter('status');
                                    setStatusFilter(val);
                                }
                            }}
                        >
                            <option value="" disabled>By Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Follow Up">Follow Up</option>
                        </select>
                    </div>
                ) : null}
            </div>

            <div className="custom-card p-0 bg-white rounded shadow-sm overflow-hidden">
                <div className="table-responsive custom-scrollbar" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                    <table className="custom-table table-hover mb-0">
                        <thead className="bg-light">
                            <tr>
                                {selection.active && (
                                    <th className="px-2 text-center" style={{ width: '5%' }}>
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={selection.ids.length === filteredEnquiries.length && filteredEnquiries.length > 0}
                                            onChange={(e) => setSelection(p => ({ ...p, ids: e.target.checked ? filteredEnquiries.map(s => s.id) : [] }))}
                                        />
                                    </th>
                                )}
                                <th style={{ width: '5%' }}>#ID</th>
                                <th>Full Name</th>
                                <th>Message Snippet</th>
                                <th>Status</th>
                                {isAdmin && <th>Assigned Staff</th>}
                                <th className>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6 - (isAdmin ? 0 : 1) + (selection.active ? 1 : 0)} className="text-center p-4">Loading...</td></tr>
                            ) : filteredEnquiries.map((enquiry, index) => (
                                <tr
                                    key={enquiry.id}
                                    onMouseDown={() => handleLongPress(enquiry.id)}
                                    onMouseUp={cancelLongPress}
                                    onMouseLeave={() => { cancelLongPress(); longPressTriggered.current = false; }}
                                    onTouchStart={() => handleLongPress(enquiry.id)}
                                    onTouchEnd={cancelLongPress}
                                    onClick={() => handleView(enquiry, false)}
                                    className={`${selection.ids.includes(enquiry.id) ? "table-active" : ""} ${!enquiry.is_read ? "fw-bold table-unread" : ""}`}
                                    style={{ cursor: 'pointer' }}
                                    title={selection.active ? "Select" : "Click to view details"}
                                >
                                    {selection.active && (
                                        <td data-label="Select" className="text-center col-select">
                                            <input type="checkbox" checked={selection.ids.includes(enquiry.id)} readOnly className="form-check-input" />
                                        </td>
                                    )}
                                    <td data-label="ID" className="fw-bold text-secondary col-id">{index + 1}</td>
                                    <td data-label="Name" className="col-name">
                                        <div className="d-flex align-items-center">
                                            <div className="avatar-initials bg-secondary text-white mr-2">
                                                {enquiry.name.charAt(0)}
                                            </div>
                                            <span className={!enquiry.is_read ? "fw-bold" : "fw-medium"}>{enquiry.name}</span>
                                            {!enquiry.is_read && <span className="badge bg-danger rounded-pill ms-2" style={{ fontSize: '0.6rem' }}>NEW</span>}
                                        </div>
                                        {/* Mobile-only preview for message (keeps card compact like Students) */}
                                        <div className="message-preview d-md-none text-muted small">{enquiry.message ? (enquiry.message.length > 120 ? enquiry.message.slice(0, 120) + '…' : enquiry.message) : ''}</div>
                                    </td>
                                    <td data-label="Message" className="col-message text-truncate" style={{ maxWidth: '200px' }}>
                                        <span className={!enquiry.is_read ? "fw-bold text-dark" : "text-muted"}>{enquiry.message}</span>
                                    </td>
                                    <td data-label="Status" className="col-status">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="status-label d-md-none text-secondary small">Status:</span>
                                            <span style={{ fontSize: '0.85rem', padding: '0.4em 0.8em' }} className={`badge rounded-pill ${enquiry.status === 'Connected' ? 'bg-success' :
                                                enquiry.status === 'Follow Up' ? 'bg-info text-dark' :
                                                    'bg-warning text-dark'
                                                }`}>
                                                {enquiry.status || 'Pending'}
                                            </span>
                                            {enquiry.follow_up_date && (
                                                <small className="text-secondary d-none d-md-inline" style={{ fontSize: '0.75rem' }}>
                                                    <i className="bi bi-clock-history me-1"></i>
                                                    {new Date(enquiry.follow_up_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </small>
                                            )}
                                        </div>
                                    </td>
                                    {isAdmin && (
                                        <td data-label="Assigned Staff" className="col-staff">
                                            {enquiry.assigned_staff_name ? (
                                                <span className="badge badge-assigned-staff border">
                                                    {(() => {
                                                        if (staffList.length > 0) {
                                                            const idx = staffList.findIndex(st => st.id === enquiry.assigned_staff);
                                                            if (idx !== -1) return `${staffList[idx].name} (#STF${String(idx + 1).padStart(3, '0')})`;
                                                        }
                                                        return enquiry.assigned_staff_name;
                                                    })()}
                                                </span>
                                            ) : (
                                                <span className="text-muted small"><em>Unassigned</em></span>
                                            )}
                                        </td>
                                    )}
                                    <td data-label="Action" className="col-action text-end">
                                        <div className="d-flex justify-content-end gap-2">
                                            <button
                                                className="action-btn btn-view rounded"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleView(enquiry, false);
                                                }}
                                                title="View"
                                            >
                                                <i className="bi bi-eye-fill"></i>
                                            </button>
                                            <button
                                                className="action-btn btn-edit rounded"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleView(enquiry, true);
                                                }}
                                                title="Edit"
                                            >
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button
                                                className="action-btn btn-delete rounded"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(enquiry.id);
                                                }}
                                                title="Delete"
                                            >
                                                <i className="bi bi-trash-fill"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && enquiries.length === 0 && (
                                <tr>
                                    <td colSpan={5 - (isAdmin ? 0 : 1) + (selection.active ? 1 : 0)} className="text-center p-4 text-muted">
                                        No enquiries found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selection.active && (
                <div className="position-fixed bottom-0 start-50 translate-middle-x mb-4 bg-dark text-white p-3 rounded-pill shadow-lg d-flex gap-3" style={{ zIndex: 1050 }}>
                    <span className="fw-bold">{selection.ids.length} Selected</span>
                    <button className="btn btn-danger btn-sm rounded-pill" onClick={() => handleDelete('bulk')}>Delete</button>
                    <button className="btn btn-secondary btn-sm rounded-pill" onClick={() => setSelection({ active: false, ids: [] })}>Cancel</button>
                </div>
            )}

            {/* View/Edit Modal */}
            {showModal && selectedEnquiry && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                            <div className="modal-header border-bottom-0">
                                <h5 className="modal-title fw-bold">{isEditMode ? 'Edit Enquiry' : 'Enquiry Details'}</h5>
                                <button type="button" className="btn-close" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleUpdate}>
                                    {!isEditMode ? (
                                        <div className="text-center mb-4">
                                            <div className="avatar-initials mx-auto mb-3" style={{ width: '80px', height: '80px', fontSize: '2rem', backgroundColor: '#fd7e14', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                                                {selectedEnquiry.name.charAt(0)}
                                            </div>
                                            <h4 className="fw-bold">{selectedEnquiry.name}</h4>
                                            <p className="text-muted">{selectedEnquiry.location || 'Location not provided'}</p>
                                        </div>
                                    ) : (
                                        <div className="row g-3 mb-3">
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Name</label>
                                                <input className="form-control bg-light" value={selectedEnquiry.name} readOnly />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Location</label>
                                                <input className="form-control bg-light" value={selectedEnquiry.location || ''} readOnly />
                                            </div>
                                        </div>
                                    )}

                                    <div className="card bg-light border-0 p-3 mb-3">
                                        <div className="row g-3">
                                            <div className="col-12">
                                                <label className="text-secondary small fw-bold">Message</label>
                                                {isEditMode ? (
                                                    <textarea className="form-control bg-light" rows="3" value={selectedEnquiry.message || ''} readOnly />
                                                ) : (
                                                    <div className="p-2 bg-white rounded border border-light">
                                                        {selectedEnquiry.message || 'No message provided'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-6">
                                                <label className="text-secondary small fw-bold">Email</label>
                                                {isEditMode ? (
                                                    <input className="form-control bg-light" value={selectedEnquiry.email || ''} readOnly />
                                                ) : (
                                                    <div className="fw-medium text-break">{selectedEnquiry.email || 'N/A'}</div>
                                                )}
                                            </div>
                                            <div className="col-6">
                                                <label className="text-secondary small fw-bold">Mobile</label>
                                                {isEditMode ? (
                                                    <input className="form-control bg-light" value={selectedEnquiry.phone} readOnly />
                                                ) : (
                                                    <div className="fw-medium">{selectedEnquiry.phone}</div>
                                                )}
                                            </div>
                                            <div className="col-6">
                                                <label className="text-secondary small fw-bold">Status</label>
                                                {isEditMode ? (
                                                    <>
                                                        <select
                                                            className="form-select"
                                                            value={selectedEnquiry.status || 'Pending'}
                                                            onChange={(e) => setSelectedEnquiry({ ...selectedEnquiry, status: e.target.value })}
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="Connected">Connected</option>
                                                            <option value="Follow Up">Follow Up</option>
                                                        </select>
                                                        {selectedEnquiry.status === 'Follow Up' && (
                                                            <div className="mt-2">
                                                                <label className="text-secondary small fw-bold mb-1">Follow Up Date & Time</label>
                                                                <input
                                                                    type="datetime-local"
                                                                    className="form-control form-control-sm bg-light"
                                                                    value={selectedEnquiry.follow_up_date ? new Date(selectedEnquiry.follow_up_date).toISOString().slice(0, 16) : ''}
                                                                    min={new Date().toISOString().slice(0, 16)}
                                                                    onChange={(e) => setSelectedEnquiry({ ...selectedEnquiry, follow_up_date: e.target.value })}
                                                                    required
                                                                />
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className={`badge ${selectedEnquiry.status === 'Connected' ? 'bg-success' :
                                                            selectedEnquiry.status === 'Follow Up' ? 'bg-info text-dark' :
                                                                'bg-warning text-dark'
                                                            }`}>
                                                            {selectedEnquiry.status || 'Pending'}
                                                        </div>
                                                        {selectedEnquiry.status === 'Follow Up' && selectedEnquiry.follow_up_date && (
                                                            <div className="mt-2 text-primary small">
                                                                <i className="bi bi-calendar-event me-1"></i>
                                                                {new Date(selectedEnquiry.follow_up_date).toLocaleString()}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                            <div className="col-6">
                                                <label className="text-secondary small fw-bold">Created At</label>
                                                <div className="fw-medium small">{new Date(selectedEnquiry.created_at).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                            <div className="col-6">
                                                <label className="text-secondary small fw-bold">Viewed At</label>
                                                <div className="fw-medium small">{selectedEnquiry.viewed_at ? new Date(selectedEnquiry.viewed_at).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : <span className="text-muted">Not viewed yet</span>}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {(localStorage.getItem('role') === 'admin' || localStorage.getItem('role') === 'Admin') && (
                                        <div className="mb-3">
                                            <label className="form-label small fw-bold">Assigned Staff</label>
                                            {isEditMode ? (
                                                <>
                                                    <select
                                                        className="form-select"
                                                        value={selectedEnquiry.assigned_staff || ''}
                                                        onChange={(e) => setSelectedEnquiry({ ...selectedEnquiry, assigned_staff: e.target.value })}
                                                    >
                                                        <option value="auto">Auto Allocate (Auto-assign to least loaded)</option>
                                                        <option value="">Unassigned</option>
                                                        {staffList.map((s, index) => (
                                                            <option key={s.id} value={s.id}>
                                                                {s.name} (#STF{String(index + 1).padStart(3, '0')})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="form-text small">Use "Auto Allocate" to balance workload automatically.</div>
                                                </>
                                            ) : (
                                                <div className="fw-medium">
                                                    {selectedEnquiry.assigned_staff_name ? (
                                                        <span className="badge badge-assigned-staff border text-dark">
                                                            <i className="bi bi-person-fill me-1"></i>
                                                            {(() => {
                                                                if (staffList.length > 0) {
                                                                    const idx = staffList.findIndex(st => st.id === selectedEnquiry.assigned_staff);
                                                                    if (idx !== -1) return `${staffList[idx].name} (#STF${String(idx + 1).padStart(3, '0')})`;
                                                                }
                                                                return selectedEnquiry.assigned_staff_name;
                                                            })()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted small"><em>Unassigned</em></span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="d-flex gap-2 justify-content-center mt-4">
                                        <button type="button" className="btn btn-light rounded-pill px-4" onClick={closeModal}>Close</button>
                                        {isEditMode && <button type="submit" className="btn btn-primary rounded-pill px-4">Save Changes</button>}
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.show && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-sm modal-dialog-centered">
                        <div className="modal-content text-center p-3">
                            <i className="bi bi-exclamation-circle text-danger display-4"></i>
                            <h5 className="fw-bold">Confirm Delete</h5>
                            <p className="text-muted mb-2">
                                {deleteModal.data?.isBulk
                                    ? `Delete ${deleteModal.data.count} enquiry record${deleteModal.data.count > 1 ? 's' : ''}?`
                                    : 'Delete this enquiry record?'
                                }
                            </p>
                            <p className="small text-danger fw-bold mb-3">
                                ⚠️ This will permanently remove the data from database and cannot be undone
                            </p>
                            <div className="d-flex gap-2 justify-content-center">
                                <button className="btn btn-light rounded-pill" onClick={() => setDeleteModal({ show: false, data: null })}>Cancel</button>
                                <button className="btn btn-danger rounded-pill px-4" onClick={confirmDelete}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {successModal.show && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-sm modal-dialog-centered">
                        <div className="modal-content text-center p-4 border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                            <div className="mb-3">
                                <div className="mx-auto bg-success text-white d-flex align-items-center justify-content-center rounded-circle" style={{ width: '60px', height: '60px' }}>
                                    <i className="bi bi-check-lg" style={{ fontSize: '2rem' }}></i>
                                </div>
                            </div>
                            <h5 className="fw-bold mb-2">{successModal.data?.title || 'Success!'}</h5>
                            <p className="text-muted mb-4">{successModal.data?.message || 'Operation completed successfully.'}</p>
                            <button className="btn btn-success rounded-pill px-4 w-100" onClick={() => setSuccessModal({ show: false, data: null })}>OK</button>
                        </div>
                    </div>
                </div>
            )}

            {toast.show && <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1100 }}><div className={`toast show bg-${toast.type} text-white p-2 px-3 rounded shadow`}>{toast.msg}</div></div>}
        </div>
    );
};

export default Enquiries;
