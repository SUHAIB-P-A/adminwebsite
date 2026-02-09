import React from 'react';
import PropTypes from 'prop-types';

/**
 * Students Table Component
 * Displays students in a data table with filtering and selection
 */
const StudentsTable = ({
    students = [],
    isAdmin = false,
    selectedIds = new Set(),
    isSelectionMode = false,
    onSelectStudent,
    onLongPress,
    onCancelLongPress,
    filter = 'all',
    statusFilter = 'Pending',
}) => {
    const filteredStudents = students.filter((student) => {
        if (filter === 'unread') return !student.is_read;
        if (filter === 'status') {
            return statusFilter ? (student.status || 'Pending') === statusFilter : true;
        }
        return true;
    });

    if (filteredStudents.length === 0) {
        return (
            <div className="text-center p-5 text-muted">
                <i className="bi bi-inbox fs-3 mb-3 d-block"></i>
                <p>No students found</p>
            </div>
        );
    }

    return (
        <div className="table-responsive">
            <table className="table table-hover">
                <thead className="table-light">
                    <tr>
                        <th style={{ width: '50px' }}>
                            {isSelectionMode && <input type="checkbox" disabled />}
                        </th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Course</th>
                        <th>Status</th>
                        {isAdmin && <th>Assigned Staff</th>}
                    </tr>
                </thead>
                <tbody>
                    {filteredStudents.map((student) => (
                        <tr
                            key={student.id}
                            onClick={() => onSelectStudent?.(student)}
                            onMouseDown={() => onLongPress?.(student.id)}
                            onMouseUp={onCancelLongPress}
                            onTouchStart={() => onLongPress?.(student.id)}
                            onTouchEnd={onCancelLongPress}
                            className={selectedIds.has(student.id) ? 'table-active' : ''}
                            style={{ cursor: isSelectionMode ? 'pointer' : 'default' }}
                        >
                            <td>
                                {isSelectionMode && (
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(student.id)}
                                        onChange={(e) => e.stopPropagation()}
                                    />
                                )}
                            </td>
                            <td className="fw-500">{student.full_name || 'N/A'}</td>
                            <td>{student.email}</td>
                            <td>{student.phone_number}</td>
                            <td>{student.course_selected}</td>
                            <td>
                                <span className={`badge bg-${student.status === 'Completed' ? 'success' : 'warning'}`}>
                                    {student.status || 'Pending'}
                                </span>
                            </td>
                            {isAdmin && <td>{student.assigned_staff?.name || 'Unassigned'}</td>}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

StudentsTable.propTypes = {
    students: PropTypes.arrayOf(PropTypes.object),
    isAdmin: PropTypes.bool,
    selectedIds: PropTypes.instanceOf(Set),
    isSelectionMode: PropTypes.bool,
    onSelectStudent: PropTypes.func,
    onLongPress: PropTypes.func,
    onCancelLongPress: PropTypes.func,
    filter: PropTypes.string,
    statusFilter: PropTypes.string,
};

export default StudentsTable;
