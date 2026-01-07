import React, { useState, useEffect } from 'react';

const EditProfileModal = ({ show, onClose, user, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        phone: '',
        email: '',
        image: null,
        dob: '',
        gender: ''
    });
    const [initialData, setInitialData] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        if (user) {
            const initial = {
                name: user.name || '',
                dob: user.dob || '',
                gender: user.gender || '',
                phone: user.phone || '',
                email: user.email || '',
                image: user.image || null
            };
            setFormData(initial);
            setInitialData(initial);
            setPreviewImage(user.image || null);
        }
    }, [user, show]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
                setFormData(prev => ({
                    ...prev,
                    image: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Compute only changed fields so we don't overwrite with unchanged values
        const updated = {};
        if (initialData) {
            Object.keys(formData).forEach(key => {
                // Compare strictly; treat null and undefined consistently
                const oldVal = initialData[key] ?? '';
                const newVal = formData[key] ?? '';
                if (oldVal !== newVal) {
                    updated[key] = formData[key];
                }
            });
        } else {
            // Fallback: send everything
            Object.assign(updated, formData);
        }

        if (Object.keys(updated).length > 0) {
            onSave(updated);
        }
        onClose();
    };

    if (!show) return null;

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Edit Profile</h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {/* Image Upload */}
                            <div className="d-flex justify-content-center mb-4">
                                <div className="position-relative">
                                    <div
                                        className="profile-image-preview rounded-circle overflow-hidden d-flex align-items-center justify-content-center bg-light"
                                        style={{ width: '100px', height: '100px', border: '2px solid #e9ecef' }}
                                    >
                                        {previewImage ? (
                                            <img src={previewImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <i className="bi bi-person-fill fs-1 text-secondary"></i>
                                        )}
                                    </div>
                                    <label
                                        htmlFor="profile-image-input"
                                        className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                                        style={{ width: '32px', height: '32px', cursor: 'pointer', border: '2px solid white' }}
                                    >
                                        <i className="bi bi-camera-fill" style={{ fontSize: '0.9rem' }}></i>
                                    </label>
                                    <input
                                        type="file"
                                        id="profile-image-input"
                                        className="d-none"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="mb-3">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label className="form-label">Date of Birth</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="dob"
                                        value={formData.dob}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Gender</label>
                                    <select
                                        className="form-select"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Others">Others</option>
                                    </select>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Phone</label>
                                    <input
                                        type="tel"
                                        className="form-control"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditProfileModal;
