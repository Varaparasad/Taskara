import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Sidebar from '../components/Sidebar.jsx'; // Adjust path as necessary
import Topbar from '../components/Topbar.jsx';
import MessageOverlay from '../components/MessageOverlay.jsx'; // Path to the MessageOverlay component

// Import Lucide React icons
import {
    User, Mail, Lock, Camera, Edit, Save, X, Loader2,
    AlertCircle, CheckCircle, XCircle, Info, KeyRound, Image // Removed BookOpenText as projects section is gone
} from 'lucide-react';
import { format } from 'date-fns';

const fetchUserData = async () => {
    const res = await axios.get('http://localhost:3000/user/data', { withCredentials: true });
    return res.data.user;
};

const Profile = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Message Overlay States
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info'); // 'success', 'error', 'info'
    const [showMessageOverlay, setShowMessageOverlay] = useState(false);

    // Edit Modals Control
    const [showEditNameModal, setShowEditNameModal] = useState(false);
    const [showEditEmailModal, setShowEditEmailModal] = useState(false);
    const [showEditPasswordModal, setShowEditPasswordModal] = useState(false);
    const [showEditProfilePicModal, setShowEditProfilePicModal] = useState(false);
    // NEW STATE: Control for enlarged profile picture
    const [isProfilePicEnlarged, setIsProfilePicEnlarged] = useState(false);


    // Form States
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [profilePicInput, setProfilePicInput] = useState(''); // For the URL input

    const queryClient = useQueryClient();

    const { data: userData, isLoading, isError, error } = useQuery({
        queryKey: ['userData'],
        queryFn: fetchUserData,
        staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
        refetchOnWindowFocus: true,
    });

    // Effect to initialize edit form fields when user data loads or changes
    useEffect(() => {
        if (userData) {
            setEditName(userData.name || '');
            setEditEmail(userData.email || '');
            // Ensure profilePicInput defaults correctly if userData.profilePic is null/undefined
            setProfilePicInput(userData.profilePic || 'https://placehold.co/150x150/cbd5e1/1f2937?text=Profile');
        }
    }, [userData]);

    // Function to display messages via the overlay
    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setShowMessageOverlay(true);
    };

    const closeMessageOverlay = () => {
        setShowMessageOverlay(false);
        setMessage('');
        setMessageType('info');
    };

    // Function to toggle the enlarged profile picture
    const toggleEnlargeProfilePic = () => {
        setIsProfilePicEnlarged(!isProfilePicEnlarged);
    };

    // --- Edit Handlers ---

    const handleUpdateName = async () => {
        if (!editName.trim()) {
            showMessage('Name cannot be empty.', 'error');
            return;
        }
        try {
            await axios.put('http://localhost:3000/user/update', { name: editName }, { withCredentials: true });
            showMessage('Name updated successfully!', 'success');
            queryClient.invalidateQueries(['userData']); // Invalidate cache to refetch
            setShowEditNameModal(false);
        } catch (err) {
            console.error('Error updating name:', err);
            showMessage('Failed to update name. ' + (err.response?.data?.message || 'Please try again.'), 'error');
        }
    };

    const handleUpdateEmail = async () => {
        if (!editEmail.trim()) {
            showMessage('Email cannot be empty.', 'error');
            return;
        }
        // Basic email format validation
        if (!/\S+@\S+\.\S+/.test(editEmail)) {
            showMessage('Please enter a valid email address.', 'error');
            return;
        }
        try {
            await axios.put('http://localhost:3000/user/update', { email: editEmail }, { withCredentials: true });
            showMessage('Email updated successfully!', 'success');
            queryClient.invalidateQueries(['userData']);
            setShowEditEmailModal(false);
        } catch (err) {
            console.error('Error updating email:', err);
            showMessage('Failed to update email. ' + (err.response?.data?.message || 'Email might already be in use.'), 'error');
        }
    };

    const handleUpdatePassword = async () => {
        if (!oldPassword || !newPassword || !confirmNewPassword) {
            showMessage('All password fields are required.', 'error');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            showMessage('New password and confirm password do not match.', 'error');
            return;
        }
        if (newPassword.length < 6) { // Example: minimum password length
            showMessage('New password must be at least 6 characters long.', 'error');
            return;
        }
        try {
            await axios.put('http://localhost:3000/user/update', { oldPassword, newPassword }, { withCredentials: true });
            showMessage('Password updated successfully!', 'success');
            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setShowEditPasswordModal(false);
        } catch (err) {
            console.error('Error updating password:', err);
            showMessage('Failed to update password. ' + (err.response?.data?.message || 'Old password might be incorrect.'), 'error');
        }
    };

    const handleUpdateProfilePic = async () => {
        if (!profilePicInput.trim()) {
            showMessage('Profile picture URL cannot be empty.', 'error');
            return;
        }
        try {
            await axios.put('http://localhost:3000/user/update', { profilePic: profilePicInput }, { withCredentials: true });
            showMessage('Profile picture updated successfully!', 'success');
            queryClient.invalidateQueries(['userData']);
            setShowEditProfilePicModal(false);
        } catch (err) {
            console.error('Error updating profile picture:', err);
            showMessage('Failed to update profile picture. ' + (err.response?.data?.message || 'Please try a valid URL.'), 'error');
        }
    };

    // Render loading state while data is being fetched
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <Loader2 className="animate-spin-slow text-blue-500 h-16 w-16" />
            </div>
        );
    }

    // Render error state if data fetching fails
    if (isError) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md animate-fadeIn" role="alert">
                    <strong className="font-bold text-lg">Error:</strong>
                    <span className="block sm:inline ml-2">{error.message || "Could not load user data."}</span>
                </div>
            </div>
        );
    }

    // Main Profile Page content
    return (
        <div className="flex h-screen bg-gray-50 font-inter">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className="flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-300 ease-in-out">
                <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title="User Profile" />

                {/* User Profile Card */}
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6 animate-fadeIn transition-all duration-500">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6 pb-6 border-b border-gray-100">
                        {/* Profile Picture Section */}
                        <div className="relative group flex-shrink-0">
                            <img
                                // Use optional chaining and fallback to ensure userData is defined before accessing profilePic
                                src={userData?.profilePic || 'https://placehold.co/150x150/cbd5e1/1f2937?text=Profile'}
                                alt="Profile"
                                className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-blue-200 shadow-md group-hover:border-blue-400 transition-colors duration-300 cursor-pointer" // Added cursor-pointer
                                onClick={toggleEnlargeProfilePic} // Add onClick to enlarge
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/150x150/cbd5e1/1f2937?text=Profile'; }}
                            />
                            <button
                                onClick={() => setShowEditProfilePicModal(true)}
                                className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-1 group-hover:translate-y-0"
                                title="Change Profile Picture"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                        </div>

                        {/* User Details and Edit Buttons */}
                        <div className="flex-grow text-center sm:text-left">
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 flex items-center justify-center sm:justify-start gap-3 mb-2">
                                {/* Use optional chaining here */}
                                {userData?.name || 'N/A'}
                                <button
                                    onClick={() => setShowEditNameModal(true)}
                                    className="text-gray-500 hover:text-blue-600 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
                                    title="Edit Name"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                            </h1>
                            <p className="text-gray-600 text-lg sm:text-xl flex items-center justify-center sm:justify-start gap-2 mb-2">
                                <Mail className="w-5 h-5 text-gray-500" />
                                {/* Use optional chaining here */}
                                {userData?.email || 'N/A'}
                                <button
                                    onClick={() => setShowEditEmailModal(true)}
                                    className="text-gray-500 hover:text-blue-600 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
                                    title="Edit Email"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                            </p>
                            <button
                                onClick={() => setShowEditPasswordModal(true)}
                                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg mt-3 text-sm sm:text-base"
                            >
                                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                                Change Password
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Modals for Editing --- */}

            {/* Edit Name Modal */}
            {showEditNameModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md animate-scaleIn">
                        <div className="flex justify-between items-center mb-4 border-b pb-3">
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Edit Name</h3>
                            <button onClick={() => setShowEditNameModal(false)} className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none">×</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-2">
                                    New Name
                                </label>
                                <input
                                    id="edit-name"
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm"
                                    placeholder="Enter new name"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
                            <button
                                onClick={() => { setShowEditNameModal(false); setEditName(userData?.name || ''); }} // Added optional chaining
                                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition duration-200 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateName}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                disabled={!editName.trim()}
                            >
                                <Save className="inline-block w-4 h-4 mr-2" /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Email Modal */}
            {showEditEmailModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md animate-scaleIn">
                        <div className="flex justify-between items-center mb-4 border-b pb-3">
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Edit Email</h3>
                            <button onClick={() => setShowEditEmailModal(false)} className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none">×</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-2">
                                    New Email
                                </label>
                                <input
                                    id="edit-email"
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm"
                                    placeholder="Enter new email"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
                            <button
                                onClick={() => { setShowEditEmailModal(false); setEditEmail(userData?.email || ''); }} // Added optional chaining
                                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition duration-200 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateEmail}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                disabled={!editEmail.trim()}
                            >
                                <Save className="inline-block w-4 h-4 mr-2" /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Password Modal */}
            {showEditPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md animate-scaleIn">
                        <div className="flex justify-between items-center mb-4 border-b pb-3">
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Change Password</h3>
                            <button onClick={() => setShowEditPasswordModal(false)} className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none">×</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="old-password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Old Password
                                </label>
                                <input
                                    id="old-password"
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm"
                                    placeholder="Enter old password"
                                />
                            </div>
                            <div>
                                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                                    New Password
                                </label>
                                <input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm"
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm New Password
                                </label>
                                <input
                                    id="confirm-new-password"
                                    type="password"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
                            <button
                                onClick={() => {
                                    setShowEditPasswordModal(false);
                                    setOldPassword('');
                                    setNewPassword('');
                                    setConfirmNewPassword('');
                                }}
                                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition duration-200 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdatePassword}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                disabled={!oldPassword || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
                            >
                                <Save className="inline-block w-4 h-4 mr-2" /> Change Password
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Profile Picture Modal */}
            {showEditProfilePicModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md animate-scaleIn">
                        <div className="flex justify-between items-center mb-4 border-b pb-3">
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Update Profile Picture</h3>
                            <button onClick={() => setShowEditProfilePicModal(false)} className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none">×</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="profile-pic-url" className="block text-sm font-medium text-gray-700 mb-2">
                                    Profile Picture URL
                                </label>
                                <input
                                    id="profile-pic-url"
                                    type="url"
                                    value={profilePicInput}
                                    onChange={(e) => setProfilePicInput(e.target.value)}
                                    className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm"
                                    placeholder="Enter image URL"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Example: <code>https://example.com/your-image.jpg</code>
                                </p>
                            </div>
                            {profilePicInput && (
                                <div className="mt-4 text-center">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                                    <img
                                        src={profilePicInput}
                                        alt="Profile Preview"
                                        className="w-24 h-24 rounded-full object-cover mx-auto border border-gray-200"
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/e0e0e0/555555?text=Invalid+URL'; }}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
                            <button
                                onClick={() => { setShowEditProfilePicModal(false); setProfilePicInput(userData?.profilePic || 'https://placehold.co/150x150/cbd5e1/1f2937?text=Profile'); }} // Added optional chaining
                                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition duration-200 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateProfilePic}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                disabled={!profilePicInput.trim()}
                            >
                                <Save className="inline-block w-4 h-4 mr-2" /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Enlarged Profile Picture Modal (New) --- */}
            {isProfilePicEnlarged && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn"
                    onClick={toggleEnlargeProfilePic} // Close when clicking outside the image
                >
                    <div className="relative" onClick={e => e.stopPropagation()}> {/* Prevent click on image from closing modal */}
                        <img
                            src={userData?.profilePic || 'https://placehold.co/500x500/cbd5e1/1f2937?text=Profile+Enlarged'} // Use a larger placeholder for enlarged view
                            alt={userData?.name ? `${userData.name}'s Profile (Enlarged)` : 'User profile picture (Enlarged)'}
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-lg cursor-pointer"
                            onClick={toggleEnlargeProfilePic} // Also close if the enlarged image itself is clicked
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/500x500/cbd5e1/1f2937?text=Profile+Error'; }}
                        />
                        <button
                            className="absolute top-2 right-2 text-white bg-gray-800 rounded-full p-2 hover:bg-gray-700 transition-colors duration-200"
                            onClick={toggleEnlargeProfilePic}
                            aria-label="Close enlarged picture"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>
            )}


            {/* Global Message Overlay */}
            {showMessageOverlay && (
                <MessageOverlay
                    message={message}
                    type={messageType}
                    onClose={closeMessageOverlay}
                />
            )}
        </div>
    );
};

export default Profile;