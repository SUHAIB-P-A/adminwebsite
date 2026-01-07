import React, { useState, useEffect } from 'react';

import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropUtils';
import imageCompression from 'browser-image-compression';

const EditProfileModal = ({ show, onClose, user, onSave }) => {
    // Form State
    const [formData, setFormData] = useState({
        name: '', role: '', phone: '', email: '', image: null, dob: '', gender: ''
    });
    const [initialData, setInitialData] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [error, setError] = useState('');

    // Crop State
    const [imageToCrop, setImageToCrop] = useState(null);
    const [isCropping, setIsCropping] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

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
            setError('');
            setIsCropping(false);
            setImageToCrop(null);
        }
    }, [user, show]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        setError('');
        if (file) {
            // If file is > 5MB, maybe reject outright as too huge, or try to compress.
            // Let's try to compress any image to ensure it's web-optimized.

            const options = {
                maxSizeMB: 1,          // Compress to ~1MB
                maxWidthOrHeight: 1920, // max width/height
                useWebWorker: true
            };

            try {
                let processedFile = file;
                // Only compress if larger than 1MB to avoid degrading small quality images unnecessarily,
                // or if we just want uniform optimization, compress everything.
                if (file.size > 1024 * 1024) {
                    processedFile = await imageCompression(file, options);
                }

                // Final safety check after compression
                const maxSize = 2 * 1024 * 1024;
                if (processedFile.size > maxSize) {
                    setError("Image is still too large after compression. Please pick a smaller image.");
                    e.target.value = '';
                    return;
                }

                const reader = new FileReader();
                reader.onloadend = () => {
                    setImageToCrop(reader.result);
                    setIsCropping(true); // Open cropper
                    setZoom(1);
                    setCrop({ x: 0, y: 0 });
                };
                reader.readAsDataURL(processedFile);

            } catch (err) {
                console.error("Compression error:", err);
                setError("Failed to process image. Please try another.");
            }
        }
        // Reset input so same file selection triggers change again if needed
        e.target.value = '';
    };

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleCropSave = async () => {
        try {
            const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
            setPreviewImage(croppedImage);
            setFormData(prev => ({ ...prev, image: croppedImage }));
            setIsCropping(false);
            setImageToCrop(null);
        } catch (e) {
            console.error(e);
            setError("Failed to crop image.");
        }
    };

    const handleCropCancel = () => {
        setIsCropping(false);
        setImageToCrop(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const updated = {};
        if (initialData) {
            Object.keys(formData).forEach(key => {
                const oldVal = initialData[key] ?? '';
                const newVal = formData[key] ?? '';
                if (oldVal !== newVal) {
                    updated[key] = formData[key];
                }
            });
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
                <div className="modal-content overflow-hidden">
                    <div className="modal-header">
                        <h5 className="modal-title">{isCropping ? 'Adjust Profile Photo' : 'Edit Profile'}</h5>
                        <button type="button" className="btn-close" onClick={isCropping ? handleCropCancel : onClose} aria-label="Close"></button>
                    </div>

                    {isCropping ? (
                        <div className="modal-body p-0">
                            <div style={{ position: 'relative', width: '100%', height: '300px', background: '#333' }}>
                                <Cropper
                                    image={imageToCrop}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1} // Square aspect for profile
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                    showGrid={false}
                                    cropShape="round"
                                />
                            </div>
                            <div className="p-3 bg-light border-top">
                                <div className="d-flex align-items-center mb-3">
                                    <i className="bi bi-zoom-in me-2 text-secondary"></i>
                                    <input
                                        type="range"
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        value={zoom}
                                        onChange={(e) => setZoom(e.target.value)}
                                        className="form-range"
                                    />
                                </div>
                                <div className="d-flex justify-content-end gap-2">
                                    <button className="btn btn-secondary" onClick={handleCropCancel}>Cancel</button>
                                    <button className="btn btn-primary" onClick={handleCropSave}>Done</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {/* Image Upload */}
                                <div className="d-flex flex-column align-items-center mb-4">
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
                                    {error && <small className="text-danger mt-2 fw-bold">{error}</small>}
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditProfileModal;
