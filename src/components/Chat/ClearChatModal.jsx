import React from 'react';

const ClearChatModal = ({ show, onHide, onClear, title, description, canDeleteForEveryone }) => {
    if (!show) return null;

    return (
        <>
            <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content rounded-4 shadow border-0">
                        <div className="modal-header border-bottom-0 pb-0">
                            <h5 className="modal-title fw-bold text-danger">
                                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                {title || 'Clear Chat History?'}
                            </h5>
                            <button type="button" className="btn-close" onClick={onHide}></button>
                        </div>
                        <div className="modal-body py-4 text-center">
                            <div className="mb-4">
                                <div className="bg-danger bg-opacity-10 p-3 rounded-circle d-inline-flex text-danger mb-3">
                                    <i className="bi bi-trash3-fill fs-1"></i>
                                </div>
                                <h5 className="fw-bold mb-2">Are you sure?</h5>
                                <p className="text-muted mb-0">
                                    {description || "This will clear your copy of the conversation history. This action cannot be undone."}
                                </p>
                            </div>
                        </div>
                        <div className="modal-footer border-top-0 pt-0 justify-content-center pb-4 flex-column">
                            {canDeleteForEveryone && (
                                <button type="button" className="btn btn-outline-danger rounded-pill px-4 w-100 mb-2" onClick={() => onClear('everyone')}>
                                    Delete for Everyone
                                </button>
                            )}
                            <div className="d-flex w-100 gap-2">
                                <button type="button" className="btn btn-light rounded-pill w-50" onClick={onHide}>Cancel</button>
                                <button type="button" className="btn btn-danger rounded-pill w-50" onClick={() => onClear('local')}>
                                    {canDeleteForEveryone ? 'Delete for Me' : 'Clear Chat'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>
    );
};

export default ClearChatModal;
