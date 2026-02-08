import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

/**
 * Staff Documents Modal Component
 * Handles document upload and management
 */
const StaffDocumentsModal = ({ show, staffId, onHide, onDocumentUpload }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (show && staffId) {
            fetchDocuments();
        }
    }, [show, staffId]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`/api/staff/${staffId}/documents/`);
            setDocuments(data);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('document_type', 'staff_document');

            const { data } = await axios.post(
                `/api/staff/${staffId}/documents/`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                }
            );

            setDocuments([...documents, data]);
            onDocumentUpload?.('Document uploaded successfully');
            e.target.value = '';
        } catch (error) {
            console.error('Error uploading document:', error);
            onDocumentUpload?.('Failed to upload document', 'danger');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteDocument = async (docId) => {
        if (!window.confirm('Delete this document?')) return;

        try {
            await axios.delete(`/api/staff/${staffId}/documents/${docId}/`);
            setDocuments(documents.filter((d) => d.id !== docId));
            onDocumentUpload?.('Document deleted successfully');
        } catch (error) {
            console.error('Error deleting document:', error);
            onDocumentUpload?.('Failed to delete document', 'danger');
        }
    };

    if (!show) return null;

    return (
        <>
            <div className="modal-backdrop fade show"></div>
            <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                <div className="modal-dialog modal-lg" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Documents</h5>
                            <button
                                type="button"
                                className="close"
                                onClick={onHide}
                                disabled={uploading}
                            >
                                <span>&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">Upload Document</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                    accept=".pdf,.doc,.docx,.jpg,.png"
                                />
                                <small className="text-muted">
                                    Supported: PDF, DOC, DOCX, JPG, PNG (Max 5MB)
                                </small>
                            </div>

                            <h6 className="mt-4 mb-3">Uploaded Documents</h6>
                            {loading ? (
                                <div className="text-center">
                                    <div className="spinner-border" role="status">
                                        <span className="sr-only">Loading...</span>
                                    </div>
                                </div>
                            ) : documents.length === 0 ? (
                                <p className="text-muted">No documents uploaded</p>
                            ) : (
                                <div className="list-group">
                                    {documents.map((doc) => (
                                        <div key={doc.id} className="list-group-item d-flex justify-content-between">
                                            <div>
                                                <h6 className="mb-1">{doc.document_name}</h6>
                                                <small className="text-muted">
                                                    {new Date(doc.uploaded_at).toLocaleDateString()}
                                                </small>
                                            </div>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleDeleteDocument(doc.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onHide}
                                disabled={uploading}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

StaffDocumentsModal.propTypes = {
    show: PropTypes.bool.isRequired,
    staffId: PropTypes.number,
    onHide: PropTypes.func.isRequired,
    onDocumentUpload: PropTypes.func,
};

export default StaffDocumentsModal;
