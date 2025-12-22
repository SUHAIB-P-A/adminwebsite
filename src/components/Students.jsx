import React, { useState } from 'react';
import './adminpanel/AdminPanel.css'; // Ensure we have access to styles

const Students = () => {
    // Mock Data
    const initialStudents = [
        { id: 1, name: 'John Doe', course: 'BBA', college: 'ABC College', email: 'john@example.com', phone: '123-456-7890', address: '123 Main St' },
        { id: 2, name: 'Alice', course: 'MBA', college: 'XYZ College', email: 'alice@example.com', phone: '987-654-3210', address: '456 Lane Ave' },
        { id: 3, name: 'Richie', course: 'Computer Science', college: 'WZY Collg', email: 'richie@example.com', phone: '555-000-1111', address: '789 Street Dr' },
    ];

    const [students, setStudents] = useState(initialStudents);
    const [selectedStudent, setSelectedStudent] = useState(null); // For View Modal
    const [showModal, setShowModal] = useState(false);

    // Add Student State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newStudent, setNewStudent] = useState({
        name: '',
        course: '',
        college: '',
        email: '',
        phone: '',
        address: ''
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
        setNewStudent({ name: '', course: '', college: '', email: '', phone: '', address: '' });
        setShowAddModal(true);
    };

    const closeAddModal = () => {
        setShowAddModal(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewStudent(prev => ({ ...prev, [name]: value }));
    };

    const handleAddSubmit = (e) => {
        e.preventDefault();
        // Simple Validation
        if (!newStudent.name || !newStudent.course || !newStudent.college) {
            alert('Please fill in required fields (Name, Course, College)');
            return;
        }

        const studentToAdd = {
            id: students.length + 1, // Simple ID generation
            ...newStudent
        };

        setStudents([...students, studentToAdd]);
        setShowAddModal(false);
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
                                <th>Course Selected</th>
                                <th>College Selected</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => (
                                <tr key={student.id}>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            {/* Initials Avatar if needed, or just name */}
                                            {/* <div className="avatar-initials mr-2">{student.name.charAt(0)}</div> */}
                                            <span className="fw-medium">{student.name}</span>
                                        </div>
                                    </td>
                                    <td>{student.course}</td>
                                    <td>{student.college}</td>
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
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                            <div className="modal-header border-bottom-0">
                                <h5 className="modal-title fw-bold">Student Details</h5>
                                <button type="button" className="btn-close" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body">
                                <div className="text-center mb-4">
                                    <div className="avatar-initials mx-auto mb-3" style={{ width: '80px', height: '80px', fontSize: '2rem', backgroundColor: '#0f2e5e', color: 'white' }}>
                                        {selectedStudent.name.charAt(0)}
                                    </div>
                                    <h4 className="fw-bold">{selectedStudent.name}</h4>
                                    <p className="text-muted">{selectedStudent.course}</p>
                                </div>
                                <div className="card bg-light border-0 p-3">
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="text-secondary small">College</label>
                                            <div className="fw-medium">{selectedStudent.college}</div>
                                        </div>
                                        <div className="col-6">
                                            <label className="text-secondary small">Email</label>
                                            <div className="fw-medium">{selectedStudent.email}</div>
                                        </div>
                                        <div className="col-6">
                                            <label className="text-secondary small">Phone</label>
                                            <div className="fw-medium">{selectedStudent.phone}</div>
                                        </div>
                                        <div className="col-12">
                                            <label className="text-secondary small">Address</label>
                                            <div className="fw-medium">{selectedStudent.address}</div>
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
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="name"
                                            value={newStudent.name}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Enter student name"
                                        />
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-6">
                                            <label className="form-label small fw-bold">Course <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="course"
                                                value={newStudent.course}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="e.g. MBA"
                                            />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label small fw-bold">College <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="college"
                                                value={newStudent.college}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="e.g. XYZ College"
                                            />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-6">
                                            <label className="form-label small fw-bold">Email</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                name="email"
                                                value={newStudent.email}
                                                onChange={handleInputChange}
                                                placeholder="name@example.com"
                                            />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label small fw-bold">Phone</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="phone"
                                                value={newStudent.phone}
                                                onChange={handleInputChange}
                                                placeholder="123-456-7890"
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Address</label>
                                        <textarea
                                            className="form-control"
                                            name="address"
                                            value={newStudent.address}
                                            onChange={handleInputChange}
                                            rows="2"
                                            placeholder="Enter address"
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
