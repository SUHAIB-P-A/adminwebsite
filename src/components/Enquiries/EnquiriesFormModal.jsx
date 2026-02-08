import React, { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

/**
 * Enquiries Form Modal Component
 * Create/edit/view enquiry records
 */
const EnquiriesFormModal = ({
    show,
    enquiry = null,
    staffList = [],
    isAdmin = false,
    isLoading = false,
    onFormChange,
    onSave,
    onCancel,
    isEditMode = false,
}) => {
    if (!show || !enquiry) return null;

    const handleChange = (field, value) => {
        onFormChange?.({ ...enquiry, [field]: value });
    };

    return (
        <>
            <div className="modal-backdrop fade show"></div>
            <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                <div className="modal-dialog modal-lg" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                {isEditMode ? 'Edit Enquiry' : 'View Enquiry'}
                            </h5>
                            <button
                                type="button"
                                className="close"
                                onClick={onCancel}
                                disabled={isLoading}
                            >
                                <span>&times;</span>
                            </button>
                        </div>
                        <form onSubmit={onSave}>
                            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={enquiry.name || ''}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            disabled={!isEditMode || isLoading}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Email</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            value={enquiry.email || ''}
                                            onChange={(e) => handleChange('email', e.target.value)}
                                            disabled={!isEditMode || isLoading}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Phone</label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            value={enquiry.phone_number || ''}
                                            onChange={(e) => handleChange('phone_number', e.target.value)}
                                            disabled={!isEditMode || isLoading}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Course Interested</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={enquiry.course_interested || ''}
                                            onChange={(e) => handleChange('course_interested', e.target.value)}
                                            disabled={!isEditMode || isLoading}
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Message</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        value={enquiry.message || ''}
                                        onChange={(e) => handleChange('message', e.target.value)}
                                        disabled={!isEditMode || isLoading}
                                    />
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-select"
                                            value={enquiry.status || 'Pending'}
                                            onChange={(e) => handleChange('status', e.target.value)}
                                            disabled={!isEditMode || isLoading}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Connected">Connected</option>
                                            <option value="Qualified">Qualified</option>
                                            <option value="Converted">Converted</option>
                                        </select>
                                    </div>

                                    {isAdmin && (
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Assign Staff</label>
                                            <select
                                                className="form-select"
                                                value={enquiry.assigned_staff || ''}
                                                onChange={(e) => handleChange('assigned_staff', e.target.value)}
                                                disabled={!isEditMode || isLoading}
                                            >
                                                <option value="">Auto Allocate</option>
                                                {staffList.map((staff) => (
                                                    <option key={staff.id} value={staff.id}>
                                                        {staff.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={onCancel}
                                    disabled={isLoading}
                                >
                                    {isEditMode ? 'Cancel' : 'Close'}
                                </button>
                                {isEditMode && (
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Saving...' : 'Save'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

EnquiriesFormModal.propTypes = {
    show: PropTypes.bool.isRequired,
    enquiry: PropTypes.object,
    staffList: PropTypes.arrayOf(PropTypes.object),
    isAdmin: PropTypes.bool,
    isLoading: PropTypes.bool,
    onFormChange: PropTypes.func,
    onSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    isEditMode: PropTypes.bool,
};

export default EnquiriesFormModal;
