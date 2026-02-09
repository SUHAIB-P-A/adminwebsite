import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

const FIELD_CONFIG = [
    { name: 'full_name', label: 'Full Name', required: true, half: false },
    { name: 'email', label: 'Email', type: 'email', required: true, half: true },
    { name: 'phone_number', label: 'Phone', required: true, half: true },
    { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Others'], half: true },
    { name: 'dob', label: 'Date of Birth', type: 'date', half: true },
    {
        name: 'highest_qualification', label: 'Qualification', type: 'select',
        options: ['10th Standard', '12th Standard', 'Diploma', "Bachelor's Degree", "Master's Degree", 'Others'],
        half: true
    },
    {
        name: 'year_of_passing', label: 'Year of Passing', type: 'select',
        options: Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - i),
        half: true
    },
    { name: 'aggregate_percentage', label: 'Aggregate %', half: true },
    { name: 'city', label: 'City' },
    { name: 'course_selected', label: 'Course Selected' },
    { name: 'colleges_selected', label: 'Colleges Selected', type: 'textarea' },
    { name: 'notes', label: 'Comments / Notes', type: 'textarea' },
];

/**
 * Students Form Modal Component
 * Create/edit student records
 */
const StudentsFormModal = ({
    show,
    formData = {},
    errors = {},
    isEdit = false,
    staffList = [],
    isAdmin = false,
    isLoading = false,
    onFormChange,
    onSave,
    onCancel,
}) => {
    if (!show) return null;

    const renderInput = (field) => {
        const errorMsg = errors[field.name];
        const value = formData[field.name] || '';

        const props = {
            name: field.name,
            value,
            onChange: (e) => onFormChange?.(field.name, e.target.value),
            required: field.required,
            className: `form-control ${errorMsg ? 'is-invalid' : ''}`,
            placeholder: field.label,
            disabled: isLoading,
        };

        let input;

        if (field.type === 'select') {
            input = (
                <select
                    {...props}
                    className={`form-select ${errorMsg ? 'is-invalid' : ''}`}
                >
                    <option value="">Select {field.label}</option>
                    {field.options.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            );
        } else if (field.type === 'textarea') {
            input = <textarea {...props} rows="2" />;
        } else {
            input = <input {...props} type={field.type || 'text'} />;
        }

        return (
            <div key={field.name} className={field.half ? 'col-md-6' : 'col-12'}>
                <div className="mb-3">
                    <label className="form-label">{field.label}</label>
                    {input}
                    {errorMsg && (
                        <div className="invalid-feedback d-block">
                            {Array.isArray(errorMsg) ? errorMsg[0] : errorMsg}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="modal-backdrop fade show"></div>
            <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                <div className="modal-dialog modal-lg" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                {isEdit ? 'Edit Student' : 'Add New Student'}
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
                                    {FIELD_CONFIG.map((field) => renderInput(field))}
                                </div>

                                {/* Admin Only: Assign Staff */}
                                {isAdmin && (
                                    <div className="col-12">
                                        <div className="mb-3">
                                            <label className="form-label">Assign Staff</label>
                                            <select
                                                className="form-select"
                                                name="assigned_staff"
                                                value={formData.assigned_staff || ''}
                                                onChange={(e) =>
                                                    onFormChange?.('assigned_staff', e.target.value)
                                                }
                                                disabled={isLoading}
                                            >
                                                <option value="">Auto Allocate</option>
                                                {staffList.map((staff) => (
                                                    <option key={staff.id} value={staff.id}>
                                                        {staff.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={onCancel}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

StudentsFormModal.propTypes = {
    show: PropTypes.bool.isRequired,
    formData: PropTypes.object,
    errors: PropTypes.object,
    isEdit: PropTypes.bool,
    staffList: PropTypes.arrayOf(PropTypes.object),
    isAdmin: PropTypes.bool,
    isLoading: PropTypes.bool,
    onFormChange: PropTypes.func,
    onSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};

export default StudentsFormModal;
