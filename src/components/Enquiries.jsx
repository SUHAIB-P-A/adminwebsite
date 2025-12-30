import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './adminpanel/AdminPanel.css'; // Reusing existing styles for consistency

const Enquiries = () => {
    const [enquiries, setEnquiries] = useState([]);
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch Enquiries from API
    useEffect(() => {
        fetchEnquiries();
    }, []);

    const fetchEnquiries = async () => {
        try {
            const staffId = localStorage.getItem('staff_id');
            const role = localStorage.getItem('role');
            const headers = (role !== 'admin' && role !== 'Admin' && staffId) ? { 'X-Staff-ID': staffId } : {};

            const response = await axios.get('http://127.0.0.1:8000/api/enquiries/', { headers });
            setEnquiries(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching enquiries:", error);
            setLoading(false);
        }
    };

    // Open Modal
    const handleView = (enquiry) => {
        setSelectedEnquiry(enquiry);
        setShowModal(true);
    };

    // Close Modal
    const closeModal = () => {
        setShowModal(false);
        setSelectedEnquiry(null);
    };

    // Handle Delete
    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this enquiry?")) {
            try {
                const staffId = localStorage.getItem('staff_id');
                const role = localStorage.getItem('role');
                const headers = (role !== 'admin' && role !== 'Admin' && staffId) ? { 'X-Staff-ID': staffId } : {};

                await axios.delete(`http://127.0.0.1:8000/api/enquiries/${id}/`, { headers });
                fetchEnquiries();
            } catch (error) {
                console.error("Error deleting enquiry:", error);
                alert("Failed to delete enquiry.");
            }
        }
    };

    return (
        <div className="p-4 page-anime">
            <h1 className="page-title">Enquiries</h1>

            <div className="custom-card">
                <div className="table-responsive">
                    <table className="custom-table table-hover">
                        <thead>
                            <tr>
                                <th>Full Name</th>
                                <th>Message Snippet</th>
                                <th className="text-end">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="3" className="text-center p-4">Loading...</td></tr>
                            ) : enquiries.map((enquiry) => (
                                <tr
                                    key={enquiry.id}
                                    onClick={() => handleView(enquiry)}
                                    style={{ cursor: 'pointer' }}
                                    title="Click to view details"
                                >
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <div className="avatar-initials bg-secondary text-white mr-2">
                                                {enquiry.name.charAt(0)}
                                            </div>
                                            <span className="fw-medium text-dark">{enquiry.name}</span>
                                        </div>
                                    </td>
                                    <td className="text-muted text-truncate" style={{ maxWidth: '200px' }}>
                                        {enquiry.message}
                                    </td>
                                    <td className="text-end">
                                        <div className="d-flex justify-content-end gap-2">
                                            <button
                                                className="action-btn btn-view"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleView(enquiry);
                                                }}
                                            >
                                                <i className="bi bi-eye"></i>
                                            </button>
                                            <button
                                                className="action-btn btn-delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(enquiry.id);
                                                }}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && enquiries.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="text-center p-4 text-muted">
                                        No enquiries found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Details Modal */}
            {showModal && selectedEnquiry && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                            <div className="modal-header border-bottom-0">
                                <h5 className="modal-title fw-bold">Enquiry Details</h5>
                                <button type="button" className="btn-close" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body">
                                <div className="text-center mb-4">
                                    <div className="avatar-initials mx-auto mb-3" style={{ width: '80px', height: '80px', fontSize: '2rem', backgroundColor: '#fd7e14', color: 'white' }}>
                                        {selectedEnquiry.name.charAt(0)}
                                    </div>
                                    <h4 className="fw-bold">{selectedEnquiry.name}</h4>
                                    <p className="text-muted">{selectedEnquiry.location || 'Location not provided'}</p>
                                </div>
                                <div className="card bg-light border-0 p-3">
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="text-secondary small fw-bold">Message</label>
                                            <div className="p-2 bg-white rounded border border-light">
                                                {selectedEnquiry.message || 'No message provided'}
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <label className="text-secondary small fw-bold">Email</label>
                                            <div className="fw-medium">{selectedEnquiry.email || 'N/A'}</div>
                                        </div>
                                        <div className="col-6">
                                            <label className="text-secondary small fw-bold">Mobile</label>
                                            <div className="fw-medium">{selectedEnquiry.phone}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-top-0 justify-content-center">
                                <button type="button" className="btn btn-primary px-4 rounded-pill" onClick={closeModal}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Enquiries;
