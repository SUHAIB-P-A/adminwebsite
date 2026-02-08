import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropUtils';

/**
 * Reusable Image Cropper Modal Component
 * Handles image cropping with zoom controls for profile images
 * 
 * @param {boolean} show - Controls modal visibility
 * @param {string} image - Base64 or URL of image to crop
 * @param {function} onCrop - Callback with cropped image base64
 * @param {function} onCancel - Callback when user cancels
 */
const ImageCropper = ({ show, image, onCrop, onCancel }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!show) return null;

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const croppedImage = await getCroppedImg(image, croppedAreaPixels);
            onCrop(croppedImage);
        } catch (error) {
            console.error('Error cropping image:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="modal-backdrop fade show"></div>
            <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                    <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                        <div className="modal-header">
                            <h5 className="modal-title fw-bold">Crop Profile Image</h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={onCancel}
                                disabled={loading}
                            ></button>
                        </div>
                        <div className="modal-body">
                            {/* Crop Area */}
                            <div style={{ position: 'relative', width: '100%', height: '400px', backgroundColor: '#f8f9fa' }}>
                                <Cropper
                                    image={image}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    cropShape="round"
                                    showGrid={false}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={onCropComplete}
                                />
                            </div>

                            {/* Zoom Controls */}
                            <div className="mt-4">
                                <label className="form-label small fw-bold">
                                    <i className="bi bi-zoom-in me-2"></i>
                                    Zoom Level
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="3"
                                    step="0.1"
                                    value={zoom}
                                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                                    className="form-range"
                                />
                                <small className="text-muted">Current zoom: {zoom.toFixed(1)}x</small>
                            </div>

                            {/* Instructions */}
                            <div className="alert alert-info mt-3 mb-0 small">
                                <i className="bi bi-info-circle me-2"></i>
                                Drag to position and use the slider to zoom. The circular area will be your profile picture.
                            </div>
                        </div>
                        <div className="modal-footer border-0">
                            <button
                                type="button"
                                className="btn btn-light rounded-pill px-4"
                                onClick={onCancel}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary rounded-pill px-4"
                                onClick={handleSave}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check-lg me-2"></i>
                                        Save Crop
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

ImageCropper.propTypes = {
    show: PropTypes.bool.isRequired,
    image: PropTypes.string,
    onCrop: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};

export default ImageCropper;
