import React from 'react';
import PropTypes from 'prop-types';

/**
 * Enquiries Filter Bar Component
 * Filter, search, and tab controls for enquiries
 */
const EnquiriesFilterBar = ({
    filter = 'all',
    statusFilter = 'Pending',
    activeTab = 'active',
    searchQuery = '',
    onFilterChange,
    onStatusFilterChange,
    onTabChange,
    onSearch,
    onAdd,
    hasSelected = false,
    onBulkDelete,
}) => {
    return (
        <div className="mb-3 p-3 bg-light rounded">
            {/* Search Bar */}
            <div className="mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => onSearch?.(e.target.value)}
                />
            </div>

            {/* Filters & Actions */}
            <div className="row g-2">
                <div className="col-auto">
                    <select
                        className="form-select"
                        value={filter}
                        onChange={(e) => onFilterChange?.(e.target.value)}
                    >
                        <option value="all">All Enquiries</option>
                        <option value="unread">Unread</option>
                        <option value="status">By Status</option>
                    </select>
                </div>

                {filter === 'status' && (
                    <div className="col-auto">
                        <select
                            className="form-select"
                            value={statusFilter}
                            onChange={(e) => onStatusFilterChange?.(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Connected">Connected</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Converted">Converted</option>
                        </select>
                    </div>
                )}

                <div className="col-auto ms-auto">
                    {hasSelected && (
                        <button
                            className="btn btn-danger me-2"
                            onClick={onBulkDelete}
                        >
                            <i className="bi bi-trash"></i> Delete Selected
                        </button>
                    )}
                    <button
                        className="btn btn-primary"
                        onClick={onAdd}
                    >
                        <i className="bi bi-plus-circle"></i> New Enquiry
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs mt-3">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => onTabChange?.('active')}
                    >
                        Active
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'connected' ? 'active' : ''}`}
                        onClick={() => onTabChange?.('connected')}
                    >
                        Connected
                    </button>
                </li>
            </ul>
        </div>
    );
};

EnquiriesFilterBar.propTypes = {
    filter: PropTypes.string,
    statusFilter: PropTypes.string,
    activeTab: PropTypes.string,
    searchQuery: PropTypes.string,
    onFilterChange: PropTypes.func,
    onStatusFilterChange: PropTypes.func,
    onTabChange: PropTypes.func,
    onSearch: PropTypes.func,
    onAdd: PropTypes.func,
    hasSelected: PropTypes.bool,
    onBulkDelete: PropTypes.func,
};

export default EnquiriesFilterBar;
