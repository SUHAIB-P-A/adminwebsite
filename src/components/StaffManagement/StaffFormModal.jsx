import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ImageCropper from '../common/ImageCropper';

const FIELD_CONFIG = [
    { name: 'full_name', label: 'Full Name', required: true, half: false },
    { name: 'email', label: 'Email', type: 'email', required: true, half: true },
    { name: 'phone_number', label: 'Phone', required: true, half: true },
    { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], half: true },
    { name: 'dob', label: 'Date of Birth', type: 'date', half: true },
    { name: 'highest_qualification', label: 'Qualification', half: true },
    { name: 'year_of_passing', label: 'Year of Passing', type: 'number', half: true },
    { name: 'aggregate_percentage', label: 'Aggregate %', half: true },
    { name: 'city', label: 'City' },
    { name: 'course_selected', label: 'Course Selected' },
    { name: 'colleges_selected', label: 'Colleges Selected', type: 'textarea' },
];

/**
 * Staff Form Modal Component
 * Handles staff creation and editing with image upload
 */
const StaffFormModal = ({
    show,
    formData,
    errors = {},
    onFormChange,
    onSave,
    onCancel,
    isLoading = false,
    isEdit = false
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showCropper, setShowCropper] = useState(false);
    const [cropImage, setCropImage] = useState(null);

    if (!show) return null;

    const renderInput = (f) => {
        const errorMsg = errors[f.name];
        const value = formData[f.name] || '';

        const props = {
            name: f.name,
            value,
            onChange: (e) => onFormChange(f.name, e.target.value),
            required: f.required,
            className: `form-control ${errorMsg ? 'is-invalid' : ''}`,
            placeholder: f.label,
            disabled: isLoading,
        };

        let input;

        if (f.type === 'select') {
            input = (
                <select
                    {...props}
                    className={`form-select ${errorMsg ? 'is-invalid' : ''}`}
                >
                    <option value="">Select {f.label}</option>
                    {f.options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            );
        } else if (f.type === 'textarea') {
            input = <textarea {...props} rows="2" />;
        } else {
            input = <input {...props} type={f.type || 'text'} />;
        }

        return (
            <div key={f.name} className={f.half ? 'col-md-6' : 'col-12'}>
                <div className="mb-3">
                    <label className="form-label">{f.label}</label>
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

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setCropImage(reader.result);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (croppedImage) => {
        onFormChange('profile_image', croppedImage);
        setShowCropper(false);
        setCropImage(null);
    };

    return (
        <>
            <div className="modal-backdrop fade show"></div>
            <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                <div className="modal-dialog modal-lg" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                {isEdit ? 'Edit Staff' : 'Add New Staff'}
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
                                {/* Profile Image */}
                                <div className="mb-3">
                                    <label className="form-label">Profile Image</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={isLoading}
                                    />
                                    {formData.profile_image && (
                                        <div className="mt-2">
                                            <img
                                                src={formData.profile_image}
                                                alt="Profile"
                                                style={{ maxWidth: '100px', borderRadius: '8px' }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Form Fields */}
                                <div className="row">
                                    {FIELD_CONFIG.map((field) => renderInput(field))}
                                </div>

                                {/* Password Field (Only for Create) */}
                                {!isEdit && (
                                    <div className="col-12">
                                        <div className="mb-3">
                                            <label className="form-label">Password</label>
                                            <div className="input-group">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                                    name="password"
                                                    value={formData.password || ''}
                                                    onChange={(e) => onFormChange('password', e.target.value)}
                                                    required
                                                    disabled={isLoading}
                                                    placeholder="Enter password"
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? '👁️' : '🔒'}
                                                </button>
                                            </div>
                                            {errors.password && (
                                                <div className="invalid-feedback d-block">
                                                    {Array.isArray(errors.password)
                                                        ? errors.password[0]
                                                        : errors.password}
                                                </div>
                                            )}
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

            {/* Image Cropper Modal */}
            <ImageCropper
                show={showCropper}
                image={cropImage}
                onCrop={handleCropComplete}
                onCancel={() => setShowCropper(false)}
            />
        </>
    );
};

StaffFormModal.propTypes = {
    show: PropTypes.bool.isRequired,
    formData: PropTypes.object.isRequired,
    errors: PropTypes.object,
    onFormChange: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
    isEdit: PropTypes.bool,
};

export default StaffFormModal;
