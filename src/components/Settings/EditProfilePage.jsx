import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';

const EditProfilePage = () => {
    const navigate = useNavigate();
    const { user } = useOutletContext();

    // Form State (Read-only display)
    const [formData, setFormData] = useState({
        name: '', role: '', phone: '', email: '', image: null, dob: '', gender: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                dob: user.dob || '',
                gender: user.gender || '',
                phone: user.phone || '',
                email: user.email || '',
                image: user.image || null
            });
        }
    }, [user]);

    return (
        <div className="fade-in pb-5">
            <div className="d-flex align-items-center mb-4">
                <button className="btn btn-light rounded-circle me-3" onClick={() => navigate(-1)}>
                    <i className="bi bi-arrow-left"></i>
                </button>
                <h2 className="settings-title mb-0">My Profile</h2>
            </div>

            <div className="card settings-card border-0 shadow-sm" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="card-body p-5">

                    {/* Read-Only Profile Image */}
                    <div className="d-flex flex-column align-items-center mb-5">
                        <div className="position-relative">
                            <div
                                className="profile-image-preview rounded-circle overflow-hidden d-flex align-items-center justify-content-center bg-light shadow-sm"
                                style={{ width: '120px', height: '120px', border: '3px solid #fff' }}
                            >
                                {formData.image ? (
                                    <img src={formData.image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <i className="bi bi-person-fill fs-1 text-secondary"></i>
                                )}
                            </div>
                        </div>
                        <div className="mt-3 text-center">
                            <span className="badge bg-light text-dark border">Read Only View</span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label text-muted small fw-bold text-uppercase">Full Name</label>
                        <input
                            type="text"
                            className="form-control form-control-lg bg-light border-0"
                            value={formData.name}
                            readOnly
                        />
                    </div>

                    <div className="row mb-4">
                        <div className="col-md-6">
                            <label className="form-label text-muted small fw-bold text-uppercase">Date of Birth</label>
                            <div className="position-relative">
                                <input
                                    type="text"
                                    className="form-control form-control-lg bg-light border-0"
                                    value={formData.dob ? new Date(formData.dob).toLocaleDateString() : 'N/A'}
                                    readOnly
                                />
                                <i className="bi bi-calendar-event position-absolute top-50 end-0 translate-middle-y me-3 text-muted"></i>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label text-muted small fw-bold text-uppercase">Gender</label>
                            <input
                                type="text"
                                className="form-control form-control-lg bg-light border-0"
                                value={formData.gender || 'N/A'}
                                readOnly
                            />
                        </div>
                    </div>

                    <div className="row mb-5">
                        <div className="col-md-6 mb-3">
                            <label className="form-label text-muted small fw-bold text-uppercase">Phone</label>
                            <input
                                type="text"
                                className="form-control form-control-lg bg-light border-0"
                                value={formData.phone || 'N/A'}
                                readOnly
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label text-muted small fw-bold text-uppercase">Email</label>
                            <input
                                type="text"
                                className="form-control form-control-lg bg-light border-0"
                                value={formData.email || 'N/A'}
                                readOnly
                            />
                        </div>
                    </div>

                    <div className="d-flex justify-content-end gap-3 pt-3 border-top">
                        <small className="text-muted fst-italic align-self-center me-auto">
                            <i className="bi bi-info-circle me-1"></i>
                            To update your profile details, please contact the Administrator.
                        </small>
                        <button
                            type="button"
                            className="btn btn-light btn-lg px-4 rounded-pill"
                            onClick={() => navigate(-1)}
                        >
                            Back
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EditProfilePage;
