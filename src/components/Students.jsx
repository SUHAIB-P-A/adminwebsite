import React, { useState, useEffect } from 'react';
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

    const handleView = (student) => {
        setSelectedStudent(student);
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this student?')) {
            setStudents(students.filter(s => s.id !== id));
        }
    };

    const handleEdit = (id) => {
        alert(`Edit functionality for student ID ${id} coming soon!`);
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
            alert("Student added successfully!");
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
                <div className="table-responsive">
                    <table className="custom-table table-hover">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" className="text-center p-4">Loading...</td></tr>
                            ) : error ? (
                                <tr><td colSpan="4" className="text-center p-4 text-danger">{error}</td></tr>
                            ) : students.map((student) => (
                                <tr key={student.id}>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <span className="fw-medium">{student.first_name} {student.last_name}</span>
                                        </div>
                                    </td>
                                    <td>{student.email}</td>
                                    <td>{student.phone_number}</td>
                                    <td>
                                        <div className="d-flex gap-1">
                                            <button
                                                className="action-btn btn-view"
                                                onClick={() => handleView(student)}
                                                title="View Details"
                                            >
                                                <i className="bi bi-eye"></i>
                                            </button>
                                            <button
                                                className="action-btn btn-edit"
                                                onClick={() => handleEdit(student.id)}
                                                title="Edit"
                                            >
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button
                                                className="action-btn btn-delete"
                                                onClick={() => handleDelete(student.id)}
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
                                    <td colSpan="4" className="text-center p-4 text-muted">
                                        No students found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
                                                    <label className="text-secondary small">Phone Number</label>
                                                    <div className="fw-medium">{selectedStudent.phone_number}</div>
                                                </div>
                                                <div className="col-6">
                                                    <label className="text-secondary small">+2 Percentage</label>
                                                    <div className="fw-medium">{selectedStudent.plus_two_percentage}%</div>
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
                                        <div className="col-6">
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
        </div>
    );
};

export default Students;
