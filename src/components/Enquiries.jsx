import React, { useState } from 'react';
import './adminpanel/AdminPanel.css'; // Reusing existing styles for consistency

const Enquiries = () => {
    // Mock Data for Enquiries
    const initialEnquiries = [
        {
            id: 1,
            name: 'Michael Scott',
            email: 'michael.scott@dunder-mifflin.com',
            phone: '+1 555-0199',
            qualification: 'MBA',
            place: 'Scranton, PA',
            message: 'I am interested in the management course. Can you provide more details about the curriculum?'
        },
        {
            id: 2,
            name: 'Pam Beesly',
            email: 'pam.beesly@dunder-mifflin.com',
            phone: '+1 555-0200',
            qualification: 'Fine Arts',
            place: 'New York, NY',
            message: 'Do you offer any graphic design courses? I want to pursue my passion.'
        },
        {
            id: 3,
            name: 'Jim Halpert',
            email: 'jim.halpert@dunder-mifflin.com',
            phone: '+1 555-0201',
            qualification: 'BBA',
            place: 'Philadelphia, PA',
            message: 'Looking for sports marketing programs. Please let me know if available.'
        },
        {
            id: 4,
            name: 'Dwight Schrute',
            email: 'dwight.schrute@dunder-mifflin.com',
            phone: '+1 555-0202',
            qualification: 'Farming',
            place: 'Farms, PA',
            message: 'I require information on advanced beet agricultural studies. Promptly.'
        },
    ];

    const [enquiries, setEnquiries] = useState(initialEnquiries);
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);
    const [showModal, setShowModal] = useState(false);

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

    return (
        <div className="p-4 page-anime">
            <h1 className="page-title">Enquiries</h1>

            <div className="custom-card">
                <div className="table-responsive">
                    <table className="custom-table table-hover">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Place</th>
                                <th>Qualification</th>
                                <th>Message Snippet</th>
                                <th className="text-end">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {enquiries.map((enquiry) => (
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
                                    <td>{enquiry.place}</td>
                                    <td>{enquiry.qualification}</td>
                                    <td className="text-muted text-truncate" style={{ maxWidth: '200px' }}>
                                        {enquiry.message}
                                    </td>
                                    <td className="text-end">
                                        <button
                                            className="action-btn btn-view"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent triggering row click twice
                                                handleView(enquiry);
                                            }}
                                        >
                                            <i className="bi bi-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {enquiries.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center p-4 text-muted">
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
                                    <p className="text-muted">{selectedEnquiry.qualification}</p>
                                </div>
                                <div className="card bg-light border-0 p-3">
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="text-secondary small fw-bold">Subject/Message</label>
                                            <div className="p-2 bg-white rounded border border-light">
                                                {selectedEnquiry.message}
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <label className="text-secondary small fw-bold">Email</label>
                                            <div className="fw-medium">{selectedEnquiry.email}</div>
                                        </div>
                                        <div className="col-6">
                                            <label className="text-secondary small fw-bold">Phone</label>
                                            <div className="fw-medium">{selectedEnquiry.phone}</div>
                                        </div>
                                        <div className="col-12">
                                            <label className="text-secondary small fw-bold">Place</label>
                                            <div className="fw-medium">{selectedEnquiry.place}</div>
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
