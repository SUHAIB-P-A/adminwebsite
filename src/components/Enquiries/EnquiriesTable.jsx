import React from 'react';
import PropTypes from 'prop-types';

/**
 * Enquiries Table Component
 * Displays enquiries in a data table with filtering and selection
 */
const EnquiriesTable = ({
    enquiries = [],
    isAdmin = false,
    selectedIds = new Set(),
    isSelectionMode = false,
    onSelectEnquiry,
    onLongPress,
    onCancelLongPress,
    filter = 'all',
    statusFilter = 'Pending',
}) => {
    const filteredEnquiries = enquiries.filter((enquiry) => {
        if (filter === 'unread') return !enquiry.is_read;
        if (filter === 'status') {
            return statusFilter ? (enquiry.status || 'Pending') === statusFilter : true;
        }
        return true;
    });

    if (filteredEnquiries.length === 0) {
        return (
            <div className="text-center p-5 text-muted">
                <i className="bi bi-chat-dots fs-3 mb-3 d-block"></i>
                <p>No enquiries found</p>
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
                        <th>Course Interest</th>
                        <th>Status</th>
                        {isAdmin && <th>Assigned Staff</th>}
                    </tr>
                </thead>
                <tbody>
                    {filteredEnquiries.map((enquiry) => (
                        <tr
                            key={enquiry.id}
                            onClick={() => onSelectEnquiry?.(enquiry)}
                            onMouseDown={() => onLongPress?.(enquiry.id)}
                            onMouseUp={onCancelLongPress}
                            onTouchStart={() => onLongPress?.(enquiry.id)}
                            onTouchEnd={onCancelLongPress}
                            className={selectedIds.has(enquiry.id) ? 'table-active' : ''}
                            style={{ cursor: isSelectionMode ? 'pointer' : 'default' }}
                        >
                            <td>
                                {isSelectionMode && (
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(enquiry.id)}
                                        onChange={(e) => e.stopPropagation()}
                                    />
                                )}
                            </td>
                            <td className="fw-500">{enquiry.name}</td>
                            <td>{enquiry.email}</td>
                            <td>{enquiry.phone_number}</td>
                            <td>{enquiry.course_interested}</td>
                            <td>
                                <span className={`badge bg-${enquiry.status === 'Connected' ? 'success' : 'warning'}`}>
                                    {enquiry.status || 'Pending'}
                                </span>
                            </td>
                            {isAdmin && <td>{enquiry.assigned_staff?.name || 'Unassigned'}</td>}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

EnquiriesTable.propTypes = {
    enquiries: PropTypes.arrayOf(PropTypes.object),
    isAdmin: PropTypes.bool,
    selectedIds: PropTypes.instanceOf(Set),
    isSelectionMode: PropTypes.bool,
    onSelectEnquiry: PropTypes.func,
    onLongPress: PropTypes.func,
    onCancelLongPress: PropTypes.func,
    filter: PropTypes.string,
    statusFilter: PropTypes.string,
};

export default EnquiriesTable;
