import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './adminpanel/AdminPanel.css'; // Reusing existing styles for consistency

const Enquiries = () => {
    const [enquiries, setEnquiries] = useState([]);
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [staffList, setStaffList] = useState([]);
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
    const [selection, setSelection] = useState({ active: false, ids: [] });
    const longPressTimer = useRef(null);

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

            // Security Safeguard: If Staff but no ID (or invalid string), don't fetch (prevents Admin fallback/leak)
            // Checks for: null, undefined (vals), or "null", "undefined" (strings), or empty string
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

    // Handle Update Enquiry (Assign Staff)
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

            // Using partial update (PUT with partial=True in backend handling is ideal, or usually PATCH)
            // But we implemented PUT with partial=True support in views.py
            await axios.put(`/api/enquiries/${selectedEnquiry.id}/`, payload, { params });

            showToast("Enquiry updated successfully!");
            closeModal();
            fetchEnquiries();
        } catch (error) {
            console.error("Error updating enquiry:", error);
            showToast("Failed to update enquiry", "danger");
        }
    };

    // Open Modal
    const handleView = (enquiry) => {
        if (selection.active) return; // Don't view if selecting
        setSelectedEnquiry(enquiry);
        setShowModal(true);
    };

    // Close Modal
    const closeModal = () => {
        setShowModal(false);
        setSelectedEnquiry(null);
    };

    // Handle Delete
    const handleDelete = async (id) => {
        const isBulk = id === 'bulk';
        const count = isBulk ? selection.ids.length : 1;

        if (window.confirm(`Are you sure you want to delete ${count} enquiry(s)?`)) {
            try {
                const staffId = localStorage.getItem('staff_id');
                const role = localStorage.getItem('role');
                const params = (role !== 'admin' && role !== 'Admin' && staffId) ? { staff_id: staffId } : {};

                if (isBulk) {
                    await Promise.all(selection.ids.map(eid => axios.delete(`/api/enquiries/${eid}/`, { params })));
                    showToast("Selected enquiries deleted successfully");
                    setSelection({ active: false, ids: [] });
                } else {
                    await axios.delete(`/api/enquiries/${id}/`, { params });
                    showToast("Enquiry deleted successfully");
                }
                fetchEnquiries();
            } catch (error) {
                console.error("Error deleting enquiry:", error);
                showToast("Failed to delete enquiry", "danger");
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

    return (
        <div className="p-4 page-anime">
            <h1 className="page-title">Enquiries</h1>

            <div className="custom-card">
                <div className="table-responsive">
                    <table className="custom-table table-hover">
                        <thead>
                            <tr>
                                {selection.active && (
                                    <th className="px-2 text-center" style={{ width: '5%' }}>
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={selection.ids.length === enquiries.length && enquiries.length > 0}
                                            onChange={(e) => setSelection(p => ({ ...p, ids: e.target.checked ? enquiries.map(s => s.id) : [] }))}
                                        />
                                    </th>
                                )}
                                <th>Full Name</th>
                                <th>Message Snippet</th>
                                <th>Assigned Staff</th>
                                <th className="text-end">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="text-center p-4">Loading...</td></tr>
                            ) : enquiries.map((enquiry) => (
                                <tr
                                    key={enquiry.id}
                                    onMouseDown={() => handleLongPress(enquiry.id)}
                                    onMouseUp={() => clearTimeout(longPressTimer.current)}
                                    onClick={() => selection.active ? toggleId(enquiry.id) : handleView(enquiry)}
                                    className={selection.ids.includes(enquiry.id) ? "table-active" : ""}
                                    style={{ cursor: 'pointer' }}
                                    title={selection.active ? "Select" : "Click to view details"}
                                >
                                    {selection.active && (
                                        <td className="text-center">
                                            <input type="checkbox" checked={selection.ids.includes(enquiry.id)} readOnly className="form-check-input" />
                                        </td>
                                    )}
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <div className="avatar-initials bg-secondary text-white mr-2">
                                                {enquiry.name.charAt(0)}
                                            </div>
                                            <span className="fw-medium text-dark">{enquiry.name}</span>
                                        </div>
                                    </td>
                                    <td className="text-muted text-truncate" style={{ maxWidth: '200px' }}>
                                        {enquiry.message}
                                    </td>
                                    <td>
                                        {enquiry.assigned_staff_name ? (
                                            <span className="badge badge-assigned-staff border">
                                                <i className="bi bi-person-fill me-1"></i>
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
                                    <td className="text-end">
                                        <div className="d-flex justify-content-end gap-2">
                                            <button
                                                className="action-btn btn-view"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleView(enquiry);
                                                }}
                                            >
                                                <i className="bi bi-eye"></i>
                                            </button>
                                            <button
                                                className="action-btn btn-delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(enquiry.id);
                                                }}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && enquiries.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center p-4 text-muted">
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
                                <h5 className="modal-title fw-bold">Enquiry Details</h5>
                                <button type="button" className="btn-close" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleUpdate}>
                                    <div className="text-center mb-4">
                                        <div className="avatar-initials mx-auto mb-3" style={{ width: '80px', height: '80px', fontSize: '2rem', backgroundColor: '#fd7e14', color: 'white' }}>
                                            {selectedEnquiry.name.charAt(0)}
                                        </div>
                                        <h4 className="fw-bold">{selectedEnquiry.name}</h4>
                                        <p className="text-muted">{selectedEnquiry.location || 'Location not provided'}</p>
                                    </div>
                                    <div className="card bg-light border-0 p-3 mb-3">
                                        <div className="row g-3">
                                            <div className="col-12">
                                                <label className="text-secondary small fw-bold">Message</label>
                                                <div className="p-2 bg-white rounded border border-light">
                                                    {selectedEnquiry.message || 'No message provided'}
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <label className="text-secondary small fw-bold">Email</label>
                                                <div className="fw-medium text-break">{selectedEnquiry.email || 'N/A'}</div>
                                            </div>
                                            <div className="col-6">
                                                <label className="text-secondary small fw-bold">Mobile</label>
                                                <div className="fw-medium">{selectedEnquiry.phone}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {(localStorage.getItem('role') === 'admin' || localStorage.getItem('role') === 'Admin') && (
                                        <div className="mb-3">
                                            <label className="form-label small fw-bold">Assigned Staff</label>
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
                                        </div>
                                    )}

                                    <div className="d-flex gap-2 justify-content-center mt-4">
                                        <button type="button" className="btn btn-light rounded-pill px-4" onClick={closeModal}>Close</button>
                                        {(localStorage.getItem('role') === 'admin' || localStorage.getItem('role') === 'Admin') && (
                                            <button type="submit" className="btn btn-primary rounded-pill px-4">Update Assignment</button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {toast.show && <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1100 }}><div className={`toast show bg-${toast.type} text-white p-2 px-3 rounded shadow`}>{toast.msg}</div></div>}
        </div>
    );
};

export default Enquiries;
