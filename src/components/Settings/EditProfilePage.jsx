import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';

const EditProfilePage = () => {
    const navigate = useNavigate();
    const { user, handleSaveProfile } = useOutletContext();
    const fileInputRef = useRef(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '', role: '', phone: '', email: '', image: null, dob: '', gender: ''
    });

    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                dob: user.dob || '',
                gender: user.gender || '',
                phone: user.phone || '',
                email: user.email || '',
                image: user.image || null,
                role: user.role || ''
            });

            // Check if user is admin (case-insensitive)
            const role = (user.role || '').toLowerCase();
            setIsAdmin(role === 'admin' || role === 'administrator');
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'phone') {
            // Only allow numbers
            const numericValue = value.replace(/[^0-9]/g, '');
            // Limit to 10 digits
            const truncatedValue = numericValue.slice(0, 10);

            setFormData(prev => ({
                ...prev,
                [name]: truncatedValue
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    image: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const onSave = () => {
        handleSaveProfile(formData);
    };

    return (
        <div className="fade-in pb-5">
            {/* Header with back button */}
            <div className="d-flex align-items-center mb-4">
                <button
                    className="btn btn-white shadow-sm rounded-circle me-3 d-flex align-items-center justify-content-center"
                    style={{ width: '40px', height: '40px' }}
                    onClick={() => navigate(-1)}
                >
                    <i className="bi bi-arrow-left text-dark"></i>
                </button>
                <div>
                    <h2 className="settings-title mb-0">Edit Profile</h2>
                    <p className="text-muted small mb-0">Manage your personal information</p>
                </div>
            </div>

            <div className="card settings-card border-0 shadow-sm mx-auto">
                {/* Blue Header Background */}
                <div style={{ height: '100px', background: 'linear-gradient(135deg, #0f2e5e 0%, #091f40 100%)' }}></div>

                <div className="card-body px-4 px-md-5 pb-5">

                    {/* Profile Image Section - Overlapping the blue header */}
                    <div className="d-flex flex-column align-items-center" style={{ marginTop: '-70px' }}>
                        <div className="profile-image-container" onClick={() => isAdmin && fileInputRef.current.click()}>
                            <div className="profile-image-preview">
                                {formData.image ? (
                                    <img src={formData.image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <i className="bi bi-person-fill fs-1 text-secondary"></i>
                                )}

                                {isAdmin && (
                                    <div className="profile-edit-overlay">
                                        <i className="bi bi-camera-fill text-white fs-3"></i>
                                    </div>
                                )}
                            </div>

                            {isAdmin && (
                                <div className="camera-icon-badge">
                                    <i className="bi bi-pencil-fill" style={{ fontSize: '0.9rem' }}></i>
                                </div>
                            )}

                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={handleImageChange}
                                disabled={!isAdmin}
                            />
                        </div>

                        <h4 className="mt-3 fw-bold mb-1">{formData.name || 'User'}</h4>
                        <span className="badge bg-light text-primary border role-badge mb-4">
                            {formData.role || 'Staff'}
                        </span>
                    </div>

                    {/* Form Sections */}
                    <div className="row g-4 justify-content-center">
                        <div className="col-lg-10">

                            {/* Personal Details */}
                            <h5 className="section-title mb-4 border-bottom pb-2">
                                <i className="bi bi-person-circle me-2 text-primary"></i> Personal Details
                            </h5>

                            <div className="row g-4 mb-5">
                                <div className="col-md-12">
                                    <label className="form-label-custom">Full Name</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-custom"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        readOnly={!isAdmin}
                                        placeholder="Enter full name"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label-custom">Date of Birth</label>
                                    <input
                                        type={isAdmin ? "date" : "text"}
                                        className="form-control form-control-custom"
                                        name="dob"
                                        value={isAdmin ? formData.dob : (formData.dob ? new Date(formData.dob).toLocaleDateString() : 'N/A')}
                                        onChange={handleChange}
                                        readOnly={!isAdmin}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label-custom">Gender</label>
                                    {isAdmin ? (
                                        <select
                                            className="form-select form-control-custom"
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            className="form-control form-control-custom"
                                            value={formData.gender || 'N/A'}
                                            readOnly
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Contact Information */}
                            <h5 className="section-title mb-4 border-bottom pb-2">
                                <i className="bi bi-envelope-paper me-2 text-primary"></i> Contact Information
                            </h5>

                            <div className="row g-4 mb-4">
                                <div className="col-md-6">
                                    <label className="form-label-custom">Phone Number</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-white border-end-0 border text-muted" style={{ borderRadius: '10px 0 0 10px' }}>
                                            <i className="bi bi-telephone"></i>
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control form-control-custom border-start-0 ps-0"
                                            style={{ borderRadius: '0 10px 10px 0' }}
                                            name="phone"
                                            value={formData.phone || ''}
                                            onChange={handleChange}
                                            readOnly={!isAdmin}
                                            maxLength={10}
                                            placeholder="9876543210"
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label-custom">Email Address</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-white border-end-0 border text-muted" style={{ borderRadius: '10px 0 0 10px' }}>
                                            <i className="bi bi-envelope"></i>
                                        </span>
                                        <input
                                            type="email"
                                            className="form-control form-control-custom border-start-0 ps-0"
                                            style={{ borderRadius: '0 10px 10px 0' }}
                                            name="email"
                                            value={formData.email || ''}
                                            onChange={handleChange}
                                            readOnly={!isAdmin}
                                            placeholder="name@example.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="d-flex justify-content-end gap-3 pt-4 mt-4 border-top">
                                {!isAdmin ? (
                                    <div className="d-flex align-items-center text-muted bg-light px-3 py-2 rounded">
                                        <i className="bi bi-lock-fill me-2"></i>
                                        <small className="fst-italic">Administrator access required to edit.</small>
                                    </div>
                                ) : (
                                    <div className="me-auto"></div>
                                )}

                                <button
                                    type="button"
                                    className="btn btn-light px-4 rounded-pill fw-semibold"
                                    onClick={() => navigate(-1)}
                                >
                                    {isAdmin ? 'Cancel' : 'Back'}
                                </button>

                                {isAdmin && (
                                    <button
                                        type="button"
                                        className="btn btn-primary px-5 rounded-pill shadow-sm fw-semibold"
                                        onClick={onSave}
                                        style={{ background: '#0f2e5e', borderColor: '#0f2e5e' }}
                                    >
                                        Save Changes
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditProfilePage;
