import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

/**
 * Image Cropper Modal Component
 * Handles image cropping for staff profiles
 */
const StaffImageCropper = ({ show, image, onCrop, onCancel }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!show) return null;

    const handleCropChange = (croppedArea) => {
        setCroppedAreaPixels(croppedArea);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const getCroppedImg = require('../../utils/cropUtils').default;
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
                <div className="modal-dialog modal-lg" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Crop Image</h5>
                            <button
                                type="button"
                                className="close"
                                onClick={onCancel}
                                disabled={loading}
                            >
                                <span>&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div style={{ position: 'relative', width: '100%', height: 300 }}>
                                <div style={{ position: 'absolute', inset: 0 }}>
                                    {image && (
                                        <div style={{
                                            position: 'relative',
                                            width: '100%',
                                            height: '100%',
                                            backgroundImage: `url(${image})`,
                                            backgroundSize: 'contain',
                                            backgroundPosition: 'center',
                                            backgroundRepeat: 'no-repeat',
                                        }} />
                                    )}
                                </div>
                            </div>
                            <div className="mt-3">
                                <label>Zoom Level</label>
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
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onCancel}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleSave}
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Save Crop'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

StaffImageCropper.propTypes = {
    show: PropTypes.bool.isRequired,
    image: PropTypes.string,
    onCrop: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};

export default StaffImageCropper;
