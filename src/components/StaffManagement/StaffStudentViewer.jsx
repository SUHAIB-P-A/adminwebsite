import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * Staff Student Viewer Component
 * Displays assigned students and enquiries
 */
const StaffStudentViewer = ({ 
    show, 
    staffName, 
    students = [], 
    enquiries = [],
    onClose, 
    onStudentAction,
    onEnquiryAction 
}) => {
    const [studentFilter, setStudentFilter] = useState('all');
    const [studentStatusFilter, setStudentStatusFilter] = useState('Pending');
    const [activeTab, setActiveTab] = useState('students');

    const filteredStudents = useMemo(() => {
        if (!students.length) return [];
        return students.filter((st) => {
            if (studentFilter === 'unread') return !st.is_read;
            if (studentFilter === 'status') {
                return studentStatusFilter ? (st.status || 'Pending') === studentStatusFilter : true;
            }
            return true;
        });
    }, [students, studentFilter, studentStatusFilter]);

    const filteredEnquiries = useMemo(() => {
        if (!enquiries.length) return [];
        return enquiries.filter((enq) => {
            if (studentFilter === 'unread') return !enq.is_read;
            if (studentFilter === 'status') {
                return studentStatusFilter ? (enq.status || 'Pending') === studentStatusFilter : true;
            }
            return true;
        });
    }, [enquiries, studentFilter, studentStatusFilter]);

    if (!show) return null;

    return (
        <>
            <div className="modal-backdrop fade show"></div>
            <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                <div className="modal-dialog modal-lg" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{staffName}'s Data</h5>
                            <button
                                type="button"
                                className="close"
                                onClick={onClose}
                            >
                                <span>&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <ul className="nav nav-tabs mb-3">
                                <li className="nav-item">
                                    <button
                                        className={`nav-link ${activeTab === 'students' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('students')}
                                    >
                                        Students ({filteredStudents.length})
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className={`nav-link ${activeTab === 'enquiries' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('enquiries')}
                                    >
                                        Enquiries ({filteredEnquiries.length})
                                    </button>
                                </li>
                            </ul>

                            {/* Filter Options */}
                            <div className="mb-3">
                                <select
                                    className="form-select"
                                    value={studentFilter}
                                    onChange={(e) => setStudentFilter(e.target.value)}
                                >
                                    <option value="all">All</option>
                                    <option value="unread">Unread</option>
                                    <option value="status">By Status</option>
                                </select>

                                {studentFilter === 'status' && (
                                    <select
                                        className="form-select mt-2"
                                        value={studentStatusFilter}
                                        onChange={(e) => setStudentStatusFilter(e.target.value)}
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                )}
                            </div>

                            {/* Students Tab */}
                            {activeTab === 'students' && (
                                <div>
                                    {filteredStudents.length === 0 ? (
                                        <p className="text-muted">No students</p>
                                    ) : (
                                        <div className="list-group">
                                            {filteredStudents.map((student) => (
                                                <div key={student.id} className="list-group-item">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <div>
                                                            <h6 className="mb-1">{student.first_name} {student.last_name}</h6>
                                                            <p className="mb-1">
                                                                <small>{student.email}</small>
                                                            </p>
                                                            <span className="badge bg-info">{student.status || 'Pending'}</span>
                                                        </div>
                                                        <button
                                                            className="btn btn-sm btn-primary"
                                                            onClick={() => onStudentAction?.(student)}
                                                        >
                                                            View
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Enquiries Tab */}
                            {activeTab === 'enquiries' && (
                                <div>
                                    {filteredEnquiries.length === 0 ? (
                                        <p className="text-muted">No enquiries</p>
                                    ) : (
                                        <div className="list-group">
                                            {filteredEnquiries.map((enquiry) => (
                                                <div key={enquiry.id} className="list-group-item">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <div>
                                                            <h6 className="mb-1">{enquiry.name}</h6>
                                                            <p className="mb-1">
                                                                <small>{enquiry.email}</small>
                                                            </p>
                                                            <span className="badge bg-warning">{enquiry.status || 'Pending'}</span>
                                                        </div>
                                                        <button
                                                            className="btn btn-sm btn-primary"
                                                            onClick={() => onEnquiryAction?.(enquiry)}
                                                        >
                                                            View
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onClose}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

StaffStudentViewer.propTypes = {
    show: PropTypes.bool.isRequired,
    staffName: PropTypes.string,
    students: PropTypes.arrayOf(PropTypes.object),
    enquiries: PropTypes.arrayOf(PropTypes.object),
    onClose: PropTypes.func.isRequired,
    onStudentAction: PropTypes.func,
    onEnquiryAction: PropTypes.func,
};

export default StaffStudentViewer;
