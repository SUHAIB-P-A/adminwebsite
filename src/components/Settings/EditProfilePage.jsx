import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropUtils';
import imageCompression from 'browser-image-compression';

const EditProfilePage = () => {
    const navigate = useNavigate();
    const { user, handleSaveProfile } = useOutletContext();

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
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        setError('');
        if (file) {
            // Strict 2MB Limit Check
            if (file.size > 2 * 1024 * 1024) {
                setError("Image size exceeds 2MB. Please select a smaller file.");
                e.target.value = '';
                return;
            }

            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true
            };

            try {
                let processedFile = file;
                if (file.size > 1024 * 1024) {
                    processedFile = await imageCompression(file, options);
                }

                const reader = new FileReader();
                reader.onloadend = () => {
                    setImageToCrop(reader.result);
                    setIsCropping(true);
                    setZoom(1);
                    setCrop({ x: 0, y: 0 });
                };
                reader.readAsDataURL(processedFile);

            } catch (err) {
                console.error("Compression error:", err);
                setError("Failed to process image. Please try another.");
            }
        }
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

    const handleCancel = () => {
        navigate('/portal/settings');
    }

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
            handleSaveProfile(updated);
        }
        navigate('/portal/settings');
    };

    return (
        <div className="card settings-card border-0 shadow-sm fade-in">
            <div className="card-header bg-white border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">{isCropping ? 'Adjust Profile Photo' : 'Edit Profile'}</h5>
                {!isCropping && (
                    <button type="button" className="btn-close" onClick={handleCancel} aria-label="Close"></button>
                )}
            </div>

            <div className="card-body p-4">
                {isCropping ? (
                    <div className="crop-container">
                        <div className="position-relative w-100 bg-dark rounded overflow-hidden" style={{ height: '400px' }}>
                            <Cropper
                                image={imageToCrop}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                showGrid={false}
                                cropShape="round"
                            />
                        </div>
                        <div className="mt-3 p-3 bg-light rounded bg-opacity-50">
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
                                <button className="btn btn-secondary rounded-pill px-4" onClick={handleCropCancel}>Cancel</button>
                                <button className="btn btn-primary rounded-pill px-4" onClick={handleCropSave}>Done</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {/* Image Upload */}
                        <div className="d-flex flex-column align-items-center mb-5">
                            <div className="position-relative">
                                <div
                                    className="profile-image-preview rounded-circle overflow-hidden d-flex align-items-center justify-content-center bg-light shadow-sm"
                                    style={{ width: '120px', height: '120px', border: '3px solid #fff' }}
                                >
                                    {previewImage ? (
                                        <img src={previewImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <i className="bi bi-person-fill fs-1 text-secondary"></i>
                                    )}
                                </div>
                                <label
                                    htmlFor="profile-image-input"
                                    className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm hover-scale"
                                    style={{ width: '36px', height: '36px', cursor: 'pointer', border: '2px solid white' }}
                                >
                                    <i className="bi bi-camera-fill small"></i>
                                </label>
                                <input
                                    type="file"
                                    id="profile-image-input"
                                    className="d-none"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </div>
                            {error && <div className="alert alert-danger mt-3 py-2 px-3 small rounded-3"><i className="bi bi-exclamation-circle me-2"></i>{error}</div>}
                        </div>

                        {/* Form Fields */}
                        <div className="mb-4">
                            <label className="form-label text-muted small fw-bold text-uppercase">Full Name</label>
                            <input
                                type="text"
                                className="form-control form-control-lg bg-light border-0"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <label className="form-label text-muted small fw-bold text-uppercase">Date of Birth</label>
                                <input
                                    type="date"
                                    className="form-control form-control-lg bg-light border-0"
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label text-muted small fw-bold text-uppercase">Gender</label>
                                <select
                                    className="form-select form-select-lg bg-light border-0"
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
                        <div className="row mb-5">
                            <div className="col-md-6 mb-3">
                                <label className="form-label text-muted small fw-bold text-uppercase">Phone</label>
                                <input
                                    type="tel"
                                    className="form-control form-control-lg bg-light border-0"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label text-muted small fw-bold text-uppercase">Email</label>
                                <input
                                    type="email"
                                    className="form-control form-control-lg bg-light border-0"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="d-flex justify-content-end gap-3 pt-3 border-top">
                            <button type="button" className="btn btn-light btn-lg px-4 rounded-pill" onClick={handleCancel}>Cancel</button>
                            <button type="submit" className="btn btn-primary btn-lg px-5 rounded-pill shadow-sm">Save Changes</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default EditProfilePage;
