import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useNavigate, useSearchParams, Outlet } from 'react-router-dom';
import LegalModal from './LegalModal';
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

    // Notifications State - Load from localStorage or default to all enabled
    const [notifications, setNotifications] = useState(() => {
        const saved = localStorage.getItem('notification_preferences');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse notification preferences', e);
            }
        }
        // Default: all enabled
        return {
            admin: true,
            students: true,
            enquiry: true
        };
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

    useEffect(() => {
        const fetchUserProfile = async () => {
            const staffId = localStorage.getItem('staff_id');
            // If we have a staffId and it's not a local-only user
            if (staffId && staffId !== 'local') {
                try {
                    const response = await axios.get(`/api/staff/${staffId}/`);
                    const data = response.data;

                    // Update Local Storage with fresh data from server
                    localStorage.setItem('staff_name', data.name || 'User');
                    localStorage.setItem('staff_email', data.email || '');
                    localStorage.setItem('staff_phone', data.phone || '');
                    localStorage.setItem('staff_dob', data.dob || '');
                    localStorage.setItem('staff_gender', data.gender || '');
                    if (data.profile_image) {
                        localStorage.setItem('staff_image', data.profile_image);
                    } else {
                        localStorage.removeItem('staff_image');
                    }

                    // Update State
                    setUser(prev => ({
                        ...prev,
                        name: data.name || '',
                        email: data.email || '',
                        phone: data.phone || '',
                        dob: data.dob || '',
                        gender: data.gender || '',
                        image: data.profile_image || null,
                        role: data.role || prev.role
                    }));

                    // Update snapshot
                    const profileKey = `staff_profile_${staffId}`;
                    const profileToSave = {
                        name: data.name || '',
                        dob: data.dob || '',
                        gender: data.gender || '',
                        phone: data.phone || '',
                        email: data.email || '',
                        image: data.profile_image || null
                    };
                    localStorage.setItem(profileKey, JSON.stringify(profileToSave));

                } catch (error) {
                    console.error("Failed to fetch user profile", error);
                }
            }
        };

        // Load initial user info from local storage first (fast load)
        const storedRole = localStorage.getItem('role') || 'Admin';
        const storedName = localStorage.getItem('staff_name') || 'Admin User';
        const storedDob = localStorage.getItem('staff_dob') || '';
        const storedGender = localStorage.getItem('staff_gender') || '';
        const storedPhone = localStorage.getItem('staff_phone') || '';
        const storedEmail = localStorage.getItem('staff_email') || '';
        const storedImage = localStorage.getItem('staff_image');

        setUser({
            name: storedName,
            role: storedRole,
            dob: storedDob,
            gender: storedGender,
            phone: storedPhone,
            email: storedEmail,
            image: storedImage
        });

        fetchUserProfile();

        // Check for edit query param - Legacy Support redirection
        if (searchParams.get('edit') === 'true') {
            navigate('/portal/settings/profile/edit', { replace: true });
        }
    }, [searchParams, navigate]);

    const toggleNotification = (type) => {
        setNotifications(prev => {
            const updated = {
                ...prev,
                [type]: !prev[type]
            };
            // Save to localStorage
            localStorage.setItem('notification_preferences', JSON.stringify(updated));
            showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} notifications ${updated[type] ? 'enabled' : 'disabled'}`);
            return updated;
        });
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

    const handleSaveProfile = async (updatedData) => {
        // Only apply updates if there are changes
        if (!updatedData || Object.keys(updatedData).length === 0) {
            showToast('No changes made.');
            return;
        }

        const staffId = localStorage.getItem('staff_id');
        const isBootstrapAdmin = !staffId || staffId === 'null' || staffId === 'undefined' || staffId === '';

        if (isBootstrapAdmin) {
            // Warn user if they are using the temporary bootstrap admin account
            alert("Warning: You are logged in as the temporary Bootstrap Admin (no database record). Changes will be local-only and lost upon logout. Please create a real Admin account for persistent storage.");
        }

        if (staffId && staffId !== 'local') {
            try {
                const apiPayload = {};
                // Map frontend keys to backend expectations - ONLY send changed fields
                if (updatedData.name !== undefined) apiPayload.name = updatedData.name;
                if (updatedData.email !== undefined) apiPayload.email = updatedData.email;
                if (updatedData.phone !== undefined) apiPayload.phone = updatedData.phone;
                if (updatedData.dob !== undefined) apiPayload.dob = updatedData.dob;
                if (updatedData.gender !== undefined) apiPayload.gender = updatedData.gender;
                if (updatedData.image !== undefined) apiPayload.profile_image = updatedData.image;

                await axios.put(`/api/staff/${staffId}/`, apiPayload);

            } catch (err) {
                console.error("Backend save failed", err);
                const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to save to server.';
                showToast(errorMsg, 'danger');
                return;
            }
        }

        setUser(prev => ({ ...prev, ...updatedData }));

        // Save to localStorage 
        if (Object.prototype.hasOwnProperty.call(updatedData, 'name')) localStorage.setItem('staff_name', updatedData.name);
        if (Object.prototype.hasOwnProperty.call(updatedData, 'role')) localStorage.setItem('role', updatedData.role);
        if (Object.prototype.hasOwnProperty.call(updatedData, 'dob')) localStorage.setItem('staff_dob', updatedData.dob);
        if (Object.prototype.hasOwnProperty.call(updatedData, 'gender')) localStorage.setItem('staff_gender', updatedData.gender);
        if (Object.prototype.hasOwnProperty.call(updatedData, 'phone')) localStorage.setItem('staff_phone', updatedData.phone);
        if (Object.prototype.hasOwnProperty.call(updatedData, 'email')) localStorage.setItem('staff_email', updatedData.email);

        if (Object.prototype.hasOwnProperty.call(updatedData, 'image')) {
            if (updatedData.image) {
                try {
                    localStorage.setItem('staff_image', updatedData.image);
                } catch (e) {
                    console.warn("Profile image too large for local storage.", e);
                    showToast('Profile image too large to cache locally, but saved to server.', 'warning');
                }
            } else {
                localStorage.removeItem('staff_image');
            }
        }

        // Also persist a full profile snapshot keyed by staff_id so it survives logout/login
        const sId = localStorage.getItem('staff_id') || 'local';
        const profileToSave = {
            name: Object.prototype.hasOwnProperty.call(updatedData, 'name') ? updatedData.name : (localStorage.getItem('staff_name') || user.name || ''),
            dob: Object.prototype.hasOwnProperty.call(updatedData, 'dob') ? updatedData.dob : (localStorage.getItem('staff_dob') || user.dob || ''),
            gender: Object.prototype.hasOwnProperty.call(updatedData, 'gender') ? updatedData.gender : (localStorage.getItem('staff_gender') || user.gender || ''),
            phone: Object.prototype.hasOwnProperty.call(updatedData, 'phone') ? updatedData.phone : (localStorage.getItem('staff_phone') || user.phone || ''),
            email: Object.prototype.hasOwnProperty.call(updatedData, 'email') ? updatedData.email : (localStorage.getItem('staff_email') || user.email || ''),
            image: Object.prototype.hasOwnProperty.call(updatedData, 'image') ? (updatedData.image || null) : (localStorage.getItem('staff_image') || user.image || null)
        };
        try {
            localStorage.setItem(`staff_profile_${sId}`, JSON.stringify(profileToSave));
        } catch (e) {
            console.warn('Failed to save profile snapshot', e);
        }

        // Notify other components (like Sidebar) about the update
        window.dispatchEvent(new Event('userInfoUpdated'));

        showToast('Profile updated successfully!');
    };

    return (
        <div className="settings-page">
            <Outlet context={{
                user,
                notifications,
                toggleNotification,
                openLegalModal,
                handleSaveProfile
            }} />

            {/* Legal Modal */}
            <LegalModal
                show={legalModal.show}
                onClose={closeLegalModal}
                title={legalModal.title}
                content={legalModal.content}
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

Settings.propTypes = {};

export default Settings;
