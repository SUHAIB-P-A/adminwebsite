import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './adminpanel/AdminPanel.css'; // Ensure we have access to styles

const Students = () => {
    // Mock Data
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null); // For View Modal
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await axios.get('/api/submit/');
            setStudents(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching students:", err);
            setError("Failed to load students.");
            setLoading(false);
        }
    };

    // Add Student State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newStudent, setNewStudent] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        plus_two_percentage: '',
        city: '',
        course_selected: '',
        colleges_selected: ''
    });

    // Edit Student State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldValue, setNewFieldValue] = useState('');

    // Multi-Select State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const longPressTimerRef = useRef(null);

    const handleAddCustomField = () => {
        if (newFieldName && newFieldValue) {
            setEditingStudent(prev => ({
                ...prev,
                [newFieldName]: newFieldValue
            }));
            setNewFieldName('');
            setNewFieldValue('');
        } else {
            alert("Please enter both field name and value.");
        }
    };

    // Selection Handlers
    const toggleSelection = (id) => {
        setSelectedIds(prev => {
            const newIds = prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id];

            return newIds;
        });
    };

    const handleRowStart = (id) => {
        longPressTimerRef.current = setTimeout(() => {
            setIsSelectionMode(true);
            toggleSelection(id);
        }, 800); // 800ms long press
    };

    const handleRowEnd = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
        }
    };

    const handleRowClick = (id) => {
        if (isSelectionMode) {
            toggleSelection(id);
        }
    };

    // Toast State
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    // Delete Confirmation State
    const [deleteConfirmation, setDeleteConfirmation] = useState({
        show: false,
        type: null, // 'single' or 'bulk'
        id: null // ID for single delete
    });

    const handleBulkDelete = () => {
        setDeleteConfirmation({
            show: true,
            type: 'bulk',
            id: null
        });
    };

    const handleDelete = (id) => {
        setDeleteConfirmation({
            show: true,
            type: 'single',
            id: id
        });
    };

    const confirmDelete = async () => {
        setDeleteConfirmation({ show: false, type: null, id: null }); // Close modal first

        if (deleteConfirmation.type === 'bulk') {
            try {
                await Promise.all(selectedIds.map(id => axios.delete(`/api/submit/${id}/`)));
                showToast("Selected students deleted successfully!");
                setIsSelectionMode(false);
                setSelectedIds([]);
                fetchStudents();
            } catch (error) {
                console.error("Error deleting students:", error);
                showToast("Failed to delete some students.", "danger");
            }
        } else if (deleteConfirmation.type === 'single') {
            try {
                await axios.delete(`/api/submit/${deleteConfirmation.id}/`);
                showToast("Student deleted successfully!");
                fetchStudents();
            } catch (error) {
                console.error("Error deleting student:", error);
                showToast("Failed to delete student.", "danger");
            }
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = students.map(s => s.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const exitSelectionMode = () => {
        setIsSelectionMode(false);
        setSelectedIds([]);
    };

    const handleView = (student) => {
        setSelectedStudent(student);
        setShowModal(true);
    };

    const handleEdit = (id) => {
        const studentToEdit = students.find(s => s.id === id);
        setEditingStudent(studentToEdit);
        setShowEditModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedStudent(null);
    };

    // Add Student Handlers
    const handleAddClick = () => {
        setNewStudent({
            first_name: '',
            last_name: '',
            email: '',
            phone_number: '',
            plus_two_percentage: '',
            city: '',
            course_selected: '',
            colleges_selected: ''
        });
        setShowAddModal(true);
    };

    const closeAddModal = () => {
        setShowAddModal(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewStudent(prev => ({ ...prev, [name]: value }));
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/submit/', newStudent);
            showToast("Student added successfully!");
            setShowAddModal(false);
            fetchStudents(); // Refresh the list
        } catch (error) {
            console.error("Error adding student:", error);
            let errMsg = "Failed to add student.";
            if (error.response?.data) {
                if (typeof error.response.data === 'object') {
                    const firstError = Object.values(error.response.data).flat()[0];
                    if (firstError) errMsg = firstError;
                } else {
                    errMsg = error.response.data;
                }
            }
            showToast(errMsg, "danger");
        }
    };

    // Edit Student Handlers
    const closeEditModal = () => {
        setShowEditModal(false);
        setEditingStudent(null);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingStudent(prev => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/submit/${editingStudent.id}/`, editingStudent);
            alert("Student updated successfully!");
            setShowEditModal(false);
            fetchStudents(); // Refresh the list
        } catch (error) {
            console.error("Error updating student:", error);
            let errMsg = "Failed to update student.";
            if (error.response?.data) {
                if (typeof error.response.data === 'object') {
                    const firstError = Object.values(error.response.data).flat()[0];
                    if (firstError) errMsg = firstError;
                } else {
                    errMsg = error.response.data;
                }
            }
            alert(errMsg);
        }
    };

    return (
        <div className="p-4 page-anime">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="page-title mb-0">Student-forms</h1>
                <button className="btn btn-primary rounded-pill px-4 shadow-sm" onClick={handleAddClick}>
                    <i className="bi bi-plus-lg me-2"></i> Add Student
                </button>
            </div>

            <div className="custom-card">
                <div className="table-responsive bg-white rounded shadow-sm custom-scrollbar" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                    <table className="table table-hover mb-0 align-middle">
                        <thead className="bg-light sticky-top" style={{ zIndex: 1 }}>
                            <tr>
                                {isSelectionMode && (
                                    <th style={{ width: '1%', whiteSpace: 'nowrap' }} className="px-2 text-center">
                                        <input
                                            type="checkbox"
                                            className="form-check-input border-2 border-primary shadow-sm"
                                            style={{ transform: 'scale(1.2)' }}
                                            checked={selectedIds.length === students.length && students.length > 0}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                )}
                                <th style={{ width: isSelectionMode ? '20%' : '25%' }}>Name</th>
                                <th style={{ width: isSelectionMode ? '20%' : '25%' }}>Course Selected</th>
                                <th style={{ width: isSelectionMode ? '20%' : '25%' }}>College Selected</th>
                                <th style={{ width: isSelectionMode ? '20%' : '25%' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={isSelectionMode ? 5 : 4} className="text-center p-4">Loading...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={isSelectionMode ? 5 : 4} className="text-center p-4 text-danger">{error}</td></tr>
                            ) : students.map((student) => (
                                <tr
                                    key={student.id}
                                    onMouseDown={() => handleRowStart(student.id)}
                                    onMouseUp={handleRowEnd}
                                    onTouchStart={() => handleRowStart(student.id)}
                                    onTouchEnd={handleRowEnd}
                                    onClick={() => handleRowClick(student.id)}
                                    className={selectedIds.includes(student.id) ? "table-active" : ""}
                                    style={{ cursor: isSelectionMode ? 'pointer' : 'default', userSelect: 'none' }}
                                >
                                    {isSelectionMode && (
                                        <td className="px-2 text-center">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={selectedIds.includes(student.id)}
                                                readOnly
                                            />
                                        </td>
                                    )}
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <span className="fw-medium">{student.first_name} {student.last_name}</span>
                                        </div>
                                    </td>
                                    <td>{student.course_selected || 'N/A'}</td>
                                    <td>{student.colleges_selected || 'No Preference'}</td>
                                    <td>
                                        <div className="d-flex gap-1">
                                            <button
                                                className="action-btn btn-view"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleView(student);
                                                }}
                                                title="View Details"
                                            >
                                                <i className="bi bi-eye"></i>
                                            </button>
                                            <button
                                                className="action-btn btn-edit"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(student.id);
                                                }}
                                                title="Edit"
                                            >
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button
                                                className="action-btn btn-delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(student.id);
                                                }}
                                                title="Delete"
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {students.length === 0 && (
                                <tr>
                                    <td colSpan={isSelectionMode ? 5 : 4} className="text-center p-4 text-muted">
                                        No students found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bulk Delete Floating Action Bar */}
            {isSelectionMode && (
                <div className="position-fixed bottom-0 start-50 translate-middle-x mb-4 bg-dark text-white p-3 rounded-pill shadow-lg d-flex align-items-center gap-3" style={{ zIndex: 1050 }}>
                    <span className="fw-bold">{selectedIds.length} Selected</span>
                    <button className="btn btn-danger btn-sm rounded-pill px-3" onClick={handleBulkDelete}>
                        Delete
                    </button>
                    <button className="btn btn-secondary btn-sm rounded-pill px-3" onClick={exitSelectionMode}>
                        Cancel
                    </button>
                </div>
            )}

            {/* View Details Modal (Bootstrap Modal) */}
            {showModal && selectedStudent && (
                (() => {
                    const studentName = `${selectedStudent.first_name} ${selectedStudent.last_name}`;
                    return (
                        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                            <div className="modal-dialog modal-dialog-centered">
                                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                                    <div className="modal-header border-bottom-0">
                                        <h5 className="modal-title fw-bold">Student Details</h5>
                                        <button type="button" className="btn-close" onClick={closeModal}></button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="text-center mb-4">
                                            <div className="avatar-initials mx-auto mb-3" style={{ width: '80px', height: '80px', fontSize: '2rem', backgroundColor: '#0f2e5e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                                                {studentName.charAt(0)}
                                            </div>
                                            <h4 className="fw-bold">{studentName}</h4>
                                            <p className="text-muted">{selectedStudent.email}</p>
                                        </div>
                                        <div className="card bg-light border-0 p-3">
                                            <div className="row g-3">
                                                <div className="col-6">
                                                    <label className="text-secondary small">Gender</label>
                                                    <div className="fw-medium">{selectedStudent.gender || 'N/A'}</div>
                                                </div>
                                                <div className="col-6">
                                                    <label className="text-secondary small">Date of Birth</label>
                                                    <div className="fw-medium">{selectedStudent.dob || 'N/A'}</div>
                                                </div>
                                                <div className="col-6">
                                                    <label className="text-secondary small">Phone Number</label>
                                                    <div className="fw-medium">{selectedStudent.phone_number}</div>
                                                </div>
                                                <div className="col-6">
                                                    <label className="text-secondary small">Qualification</label>
                                                    <div className="fw-medium">{selectedStudent.highest_qualification || 'N/A'}</div>
                                                </div>
                                                <div className="col-6">
                                                    <label className="text-secondary small">Year of Passing</label>
                                                    <div className="fw-medium">{selectedStudent.year_of_passing || 'N/A'}</div>
                                                </div>
                                                <div className="col-6">
                                                    <label className="text-secondary small">Aggregate % / CGPA</label>
                                                    <div className="fw-medium">{selectedStudent.aggregate_percentage || 'N/A'}</div>
                                                </div>
                                                <div className="col-6">
                                                    <label className="text-secondary small">City</label>
                                                    <div className="fw-medium">{selectedStudent.city || 'N/A'}</div>
                                                </div>
                                                <div className="col-6">
                                                    <label className="text-secondary small">Course Selected</label>
                                                    <div className="fw-medium">{selectedStudent.course_selected || 'N/A'}</div>
                                                </div>
                                                <div className="col-12">
                                                    <label className="text-secondary small">Colleges Selected</label>
                                                    <div className="fw-medium">{selectedStudent.colleges_selected || 'No College Preference'}</div>
                                                </div>
                                                {/* Dynamic Fields Display */}
                                                {Object.entries(selectedStudent).map(([key, value]) => {
                                                    const excludedFields = [
                                                        'id', 'first_name', 'last_name', 'email', 'phone_number',
                                                        'gender', 'dob', 'highest_qualification', 'year_of_passing',
                                                        'aggregate_percentage', 'plus_two_percentage', 'city',
                                                        'course_selected', 'colleges_selected', 'created_at'
                                                    ];
                                                    if (excludedFields.includes(key) || !value) return null;

                                                    // Format key for display (e.g., custom_field -> Custom Field)
                                                    const formattedLabel = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                                                    return (
                                                        <div className="col-6" key={key}>
                                                            <label className="text-secondary small">{formattedLabel}</label>
                                                            <div className="fw-medium">{value}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer border-top-0 justify-content-center">
                                        <button type="button" className="btn btn-secondary px-4 rounded-pill" onClick={closeModal}>Close</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()
            )}

            {/* Add Student Modal */}
            {showAddModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                            <div className="modal-header border-bottom-0">
                                <h5 className="modal-title fw-bold">Add New Student</h5>
                                <button type="button" className="btn-close" onClick={closeAddModal}></button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleAddSubmit}>
                                    <div className="row mb-3">
                                        <div className="col-6">
                                            <label className="form-label small fw-bold">First Name <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="first_name"
                                                value={newStudent.first_name}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="First name"
                                            />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label small fw-bold">Last Name <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="last_name"
                                                value={newStudent.last_name}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="Last name"
                                            />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-6">
                                            <label className="form-label small fw-bold">Email <span className="text-danger">*</span></label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                name="email"
                                                value={newStudent.email}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="name@example.com"
                                            />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label small fw-bold">Phone <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="phone_number"
                                                value={newStudent.phone_number}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="10-digit number"
                                            />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-6">
                                            <label className="form-label small fw-bold">Gender</label>
                                            <select
                                                className="form-select"
                                                name="gender"
                                                value={newStudent.gender}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label small fw-bold">Date of Birth</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="dob"
                                                value={newStudent.dob}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-6">
                                            <label className="form-label small fw-bold">Highest Qualification</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="highest_qualification"
                                                value={newStudent.highest_qualification}
                                                onChange={handleInputChange}
                                                placeholder="e.g. B.Tech"
                                            />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label small fw-bold">Year of Passing</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="year_of_passing"
                                                value={newStudent.year_of_passing}
                                                onChange={handleInputChange}
                                                placeholder="YYYY"
                                            />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-6">
                                            <label className="form-label small fw-bold">Aggregate %</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="aggregate_percentage"
                                                value={newStudent.aggregate_percentage}
                                                onChange={handleInputChange}
                                                placeholder="e.g. 85%"
                                            />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label small fw-bold">+2 Percentage <span className="text-danger">*</span></label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-control"
                                                name="plus_two_percentage"
                                                value={newStudent.plus_two_percentage}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="e.g. 85.50"
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">City (Optional)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="city"
                                            value={newStudent.city}
                                            onChange={handleInputChange}
                                            placeholder="City"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Course Selected</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="course_selected"
                                            value={newStudent.course_selected}
                                            onChange={handleInputChange}
                                            placeholder="e.g. BBA, MBA"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Colleges Selected</label>
                                        <textarea
                                            className="form-control"
                                            name="colleges_selected"
                                            value={newStudent.colleges_selected}
                                            onChange={handleInputChange}
                                            rows="2"
                                            placeholder="Enter selected colleges"
                                        ></textarea>
                                    </div>
                                    <div className="d-grid gap-2">
                                        <button type="submit" className="btn btn-primary rounded-pill">Add Student</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Student Modal */}
            {showEditModal && editingStudent && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                            <div className="modal-header border-bottom-0">
                                <h5 className="modal-title fw-bold">Edit Student</h5>
                                <button type="button" className="btn-close" onClick={closeEditModal}></button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleEditSubmit}>
                                    <div className="row mb-3">
                                        <div className="col-6">
                                            <label className="form-label small fw-bold">First Name <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="first_name"
                                                value={editingStudent.first_name}
                                                onChange={handleEditChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label small fw-bold">Last Name <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="last_name"
                                                value={editingStudent.last_name}
                                                onChange={handleEditChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-6">
                                            <label className="form-label small fw-bold">Email <span className="text-danger">*</span></label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                name="email"
                                                value={editingStudent.email}
                                                onChange={handleEditChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label small fw-bold">Phone <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="phone_number"
                                                value={editingStudent.phone_number}
                                                onChange={handleEditChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-6">
                                            <label className="form-label small fw-bold">Gender</label>
                                            <select
                                                className="form-select"
                                                name="gender"
                                                value={editingStudent.gender || ''}
                                                onChange={handleEditChange}
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label small fw-bold">Date of Birth</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="dob"
                                                value={editingStudent.dob || ''}
                                                onChange={handleEditChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-6">
                                            <label className="form-label small fw-bold">Highest Qualification</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="highest_qualification"
                                                value={editingStudent.highest_qualification || ''}
                                                onChange={handleEditChange}
                                            />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label small fw-bold">Year of Passing</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="year_of_passing"
                                                value={editingStudent.year_of_passing || ''}
                                                onChange={handleEditChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-12">
                                            <label className="form-label small fw-bold">Aggregate %</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="aggregate_percentage"
                                                value={editingStudent.aggregate_percentage || ''}
                                                onChange={handleEditChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">City</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="city"
                                            value={editingStudent.city || ''}
                                            onChange={handleEditChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Course Selected</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="course_selected"
                                            value={editingStudent.course_selected || ''}
                                            onChange={handleEditChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Colleges Selected</label>
                                        <textarea
                                            className="form-control"
                                            name="colleges_selected"
                                            value={editingStudent.colleges_selected || ''}
                                            onChange={handleEditChange}
                                            rows="2"
                                        ></textarea>
                                    </div>

                                    {/* Dynamic Fields Section */}
                                    <div className="border-top pt-3 mt-3">
                                        <h6 className="fw-bold mb-3">Add Custom Field</h6>
                                        <div className="row g-2 mb-3">
                                            <div className="col-5">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder="Field Name"
                                                    value={newFieldName}
                                                    onChange={(e) => setNewFieldName(e.target.value)}
                                                />
                                            </div>
                                            <div className="col-5">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder="Value"
                                                    value={newFieldValue}
                                                    onChange={(e) => setNewFieldValue(e.target.value)}
                                                />
                                            </div>
                                            <div className="col-2">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-primary w-100"
                                                    onClick={handleAddCustomField}
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                        {/* Display Added Custom Fields (Visual only for now if not in schema) */}
                                        {/* Display Added Custom Fields */}
                                        {Object.keys(editingStudent).map(key => {
                                            const excludedFields = [
                                                'id', 'first_name', 'last_name', 'email', 'phone_number',
                                                'gender', 'dob', 'highest_qualification', 'year_of_passing',
                                                'aggregate_percentage', 'plus_two_percentage', 'city',
                                                'course_selected', 'colleges_selected', 'created_at'
                                            ];

                                            // Skip standard fields
                                            if (excludedFields.includes(key)) return null;

                                            // Render input for custom field
                                            return (
                                                <div className="mb-2" key={key}>
                                                    <label className="form-label small fw-bold text-capitalize">{key.replace(/_/g, ' ')}</label>
                                                    <div className="input-group">
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm"
                                                            name={key}
                                                            value={editingStudent[key]}
                                                            onChange={handleEditChange}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-danger btn-sm"
                                                            onClick={() => {
                                                                const updated = { ...editingStudent };
                                                                delete updated[key];
                                                                setEditingStudent(updated);
                                                            }}
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="d-grid gap-2">
                                        <button type="submit" className="btn btn-primary rounded-pill">Update Student</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {deleteConfirmation.show && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content border-0 shadow-lg text-center p-3" style={{ borderRadius: '15px' }}>
                            <div className="mb-3 text-danger">
                                <i className="bi bi-exclamation-circle-fill display-4"></i>
                            </div>
                            <h5 className="fw-bold mb-2">Delete Confirmation</h5>
                            <p className="text-secondary small mb-4">
                                {deleteConfirmation.type === 'bulk'
                                    ? `Are you sure you want to delete ${selectedIds.length} students?`
                                    : "Are you sure you want to delete this student?"}
                                <br />This action cannot be undone.
                            </p>
                            <div className="d-flex gap-2 justify-content-center">
                                <button
                                    className="btn btn-light rounded-pill px-4"
                                    onClick={() => setDeleteConfirmation({ show: false, type: null, id: null })}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-danger rounded-pill px-4"
                                    onClick={confirmDelete}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast.show && (
                <div
                    className={`position-fixed bottom-0 end-0 p-3`}
                    style={{ zIndex: 1100 }}
                >
                    <div className={`toast show align-items-center text-white bg-${toast.type} border-0 shadow`} role="alert" aria-live="assertive" aria-atomic="true">
                        <div className="d-flex">
                            <div className="toast-body">
                                {toast.message}
                            </div>
                            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast({ show: false, message: '' })}></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Students;
