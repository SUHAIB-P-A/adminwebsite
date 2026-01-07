
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LegalModal from './LegalModal';
import EditProfileModal from './EditProfileModal';
import './Settings.css';

const PRIVACY_POLICY = (
    <div>
        <h6>1. Information We Collect</h6>
        <p>We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website, or otherwise when you contact us. The personal information that we collect depends on the context of your interactions with us and the website, the choices you make, and the products and features you use. The personal information we collect may include the following:
            <ul>
                <li>Names</li>
                <li>Phone numbers</li>
                <li>Email addresses</li>
                <li>Educational Background</li>
                <li>Preferred Course and College details</li>
            </ul>
        </p>

        <h6>2. How We Use Your Information</h6>
        <p>We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations. We use the information we collect or receive:
            <ul>
                <li>To facilitate account creation and logon process.</li>
                <li>To send you administrative information.</li>
                <li>To fulfill and manage your orders.</li>
                <li>To provide consulting regarding admissions.</li>
            </ul>
        </p>

        <h6>3. Sharing Your Information</h6>
        <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We may share your data with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf and require access to such information to do that work.</p>

        <h6>4. Data Security</h6>
        <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>
    </div>
);

const TERMS_AND_CONDITIONS = (
    <div>
        <h6>1. Agreement to Terms</h6>
        <p>These Terms of Use constitute a legally binding agreement made between you, whether personally or on behalf of an entity (“you”) and our company (“Company”, “we”, “us”, or “our”), concerning your access to and use of the website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the “Site”).</p>

        <h6>2. Intellectual Property Rights</h6>
        <p>Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the “Content”) and the trademarks, service marks, and logos contained therein (the “Marks”) are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.</p>

        <h6>3. User Representations</h6>
        <p>By using the Site, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary; (3) you have the legal capacity and you agree to comply with these Terms of Use.</p>

        <h6>4. Educational Consultancy Disclaimer</h6>
        <p>We provide consultancy services for admissions. While we strive to provide accurate information regarding colleges and courses, we do not guarantee admission to any specific institution. Admission decisions are solely at the discretion of the respective educational institutions.</p>

        <h6>5. Modifications and Interruptions</h6>
        <p>We reserve the right to change, modify, or remove the contents of the Site at any time or for any reason at our sole discretion without notice. We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the Site.</p>
    </div>
);



const Settings = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    // ... rest of state ...
    const [notifications, setNotifications] = useState({
        email: true,
        push: false,
        sms: true
    });

    // Toast State
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

    const showToast = (msg, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
    };

    // User Info
    const [user, setUser] = useState({
        name: '',
        role: '',
        dob: '',
        gender: '',
        phone: '',
        email: '',
        image: null
    });

    // Modal States
    const [legalModal, setLegalModal] = useState({ show: false, title: '', content: null });
    const [showEditProfile, setShowEditProfile] = useState(false);

    useEffect(() => {
        // Load user info
        const storedRole = localStorage.getItem('role') || 'Admin';
        const storedName = localStorage.getItem('staff_name') || 'Admin User';
        const storedDob = localStorage.getItem('staff_dob') || '';
        const storedGender = localStorage.getItem('staff_gender') || '';
        const storedPhone = localStorage.getItem('staff_phone') || '';
        const storedEmail = localStorage.getItem('staff_email') || '';
        const storedImage = localStorage.getItem('staff_image'); // Base64 image

        setUser({
            name: storedName,
            role: storedRole,
            dob: storedDob,
            gender: storedGender,
            phone: storedPhone,
            email: storedEmail,
            image: storedImage
        });


        // Check for edit query param
        if (searchParams.get('edit') === 'true') {
            setShowEditProfile(true);
            // Optional: clear the param so it doesn't reopen on reload
            navigate('/portal/settings', { replace: true });
        }
    }, [searchParams, navigate]);

    const toggleNotification = (type) => {
        setNotifications(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    const openLegalModal = (type) => {
        if (type === 'privacy') {
            setLegalModal({ show: true, title: 'Privacy Policy', content: PRIVACY_POLICY });
        } else if (type === 'terms') {
            setLegalModal({ show: true, title: 'Terms and Conditions', content: TERMS_AND_CONDITIONS });
        }
    };

    const closeLegalModal = () => {
        setLegalModal({ ...legalModal, show: false });
    };

    const handleSaveProfile = (updatedData) => {
        // Only apply updates if there are changes
        if (!updatedData || Object.keys(updatedData).length === 0) {
            showToast('No changes made.');
            return;
        }

        setUser(prev => ({ ...prev, ...updatedData }));

        // Save to localStorage for keys that are provided (including empty values)
        if (Object.prototype.hasOwnProperty.call(updatedData, 'name')) localStorage.setItem('staff_name', updatedData.name);
        if (Object.prototype.hasOwnProperty.call(updatedData, 'role')) localStorage.setItem('role', updatedData.role);
        if (Object.prototype.hasOwnProperty.call(updatedData, 'dob')) localStorage.setItem('staff_dob', updatedData.dob);
        if (Object.prototype.hasOwnProperty.call(updatedData, 'gender')) localStorage.setItem('staff_gender', updatedData.gender);
        if (Object.prototype.hasOwnProperty.call(updatedData, 'phone')) localStorage.setItem('staff_phone', updatedData.phone);
        if (Object.prototype.hasOwnProperty.call(updatedData, 'email')) localStorage.setItem('staff_email', updatedData.email);

        if (Object.prototype.hasOwnProperty.call(updatedData, 'image')) {
            if (updatedData.image) {
                localStorage.setItem('staff_image', updatedData.image);
            } else {
                // If explicitly set to null/empty, remove the stored image
                localStorage.removeItem('staff_image');
            }
        }

        // Also persist a full profile snapshot keyed by staff_id so it survives logout/login
        const staffId = localStorage.getItem('staff_id') || 'local';
        const profileToSave = {
            name: Object.prototype.hasOwnProperty.call(updatedData, 'name') ? updatedData.name : (localStorage.getItem('staff_name') || user.name || ''),
            dob: Object.prototype.hasOwnProperty.call(updatedData, 'dob') ? updatedData.dob : (localStorage.getItem('staff_dob') || user.dob || ''),
            gender: Object.prototype.hasOwnProperty.call(updatedData, 'gender') ? updatedData.gender : (localStorage.getItem('staff_gender') || user.gender || ''),
            phone: Object.prototype.hasOwnProperty.call(updatedData, 'phone') ? updatedData.phone : (localStorage.getItem('staff_phone') || user.phone || ''),
            email: Object.prototype.hasOwnProperty.call(updatedData, 'email') ? updatedData.email : (localStorage.getItem('staff_email') || user.email || ''),
            image: Object.prototype.hasOwnProperty.call(updatedData, 'image') ? (updatedData.image || null) : (localStorage.getItem('staff_image') || user.image || null)
        };
        try {
            localStorage.setItem(`staff_profile_${staffId}`, JSON.stringify(profileToSave));
        } catch (e) {
            // ignore storage errors
            console.warn('Failed to save profile snapshot', e);
        }

        // Notify other components (like Sidebar) about the update
        window.dispatchEvent(new Event('userInfoUpdated'));

        showToast('Profile updated successfully!');
    };

    return (
        <div className="settings-page fade-in">
            <h2 className="settings-title mb-4">Settings</h2>

            {/* 1. Account Section */}
            <section className="settings-section">
                <h4 className="section-title"><i className="bi bi-person-circle me-2"></i> Account</h4>
                <div className="card settings-card account-card">
                    <div className="card-body d-flex align-items-center">
                        <div className="account-avatar">
                            {user.image ? (
                                <img src={user.image} alt="Profile" className="rounded-circle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <i className="bi bi-person-fill"></i>
                            )}
                        </div>
                        <div className="account-info ms-3">
                            <h5 className="mb-1">{user.name}</h5>
                            <p className="mb-0 text-muted role-badge">{user.role}</p>
                            {(user.email || user.phone) && (
                                <small className="d-block text-muted mt-1">
                                    {user.email && <span><i className="bi bi-envelope me-1"></i>{user.email}</span>}
                                    {user.email && user.phone && <span className="mx-2">|</span>}
                                    {user.phone && <span><i className="bi bi-telephone me-1"></i>{user.phone}</span>}
                                </small>
                            )}
                        </div>
                        <button
                            className="btn btn-outline-primary ms-auto btn-sm"
                            onClick={() => setShowEditProfile(true)}
                        >
                            Edit Profile
                        </button>
                    </div>
                </div>
            </section>

            {/* 2. Notifications Section */}
            <section className="settings-section mt-4">
                <h4 className="section-title"><i className="bi bi-bell me-2"></i> Notifications</h4>
                <div className="card settings-card">
                    <div className="card-body">
                        <div className="setting-item d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <h6 className="mb-0">Email Notifications</h6>
                                <small className="text-muted">Receive updates via email</small>
                            </div>
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={notifications.email}
                                    onChange={() => toggleNotification('email')}
                                />
                            </div>
                        </div>
                        <div className="setting-item d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <h6 className="mb-0">Push Notifications</h6>
                                <small className="text-muted">Receive pop-up notifications</small>
                            </div>
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={notifications.push}
                                    onChange={() => toggleNotification('push')}
                                />
                            </div>
                        </div>
                        <div className="setting-item d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="mb-0">SMS Notifications</h6>
                                <small className="text-muted">Receive urgent updates via SMS</small>
                            </div>
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={notifications.sms}
                                    onChange={() => toggleNotification('sms')}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Legal Section */}
            <section className="settings-section mt-4 mb-5">
                <h4 className="section-title"><i className="bi bi-shield-check me-2"></i> Legal</h4>
                <div className="card settings-card">
                    <div className="list-group list-group-flush">
                        <button
                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                            onClick={() => openLegalModal('privacy')}
                        >
                            Privacy Policy
                            <i className="bi bi-chevron-right"></i>
                        </button>
                        <button
                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                            onClick={() => openLegalModal('terms')}
                        >
                            Terms and Conditions
                            <i className="bi bi-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </section>

            {/* Legal Modal */}
            <LegalModal
                show={legalModal.show}
                onClose={closeLegalModal}
                title={legalModal.title}
                content={legalModal.content}
            />

            {/* Edit Profile Modal */}
            <EditProfileModal
                show={showEditProfile}
                onClose={() => setShowEditProfile(false)}
                user={user}
                onSave={handleSaveProfile}
            />
            {/* Simple Toast */}
            {toast.show && (
                <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1100 }}>
                    <div className={`toast show align-items-center text-white bg-${toast.type} border-0`} role="alert" aria-live="assertive" aria-atomic="true">
                        <div className="d-flex">
                            <div className="toast-body">
                                <i className="bi bi-check-circle-fill me-2"></i>
                                {toast.msg}
                            </div>
                            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast({ ...toast, show: false })} aria-label="Close"></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;

