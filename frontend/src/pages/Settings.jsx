import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Camera,
    Save,
    Shield,
    Key,
    Bell,
    Globe,
    Eye,
    EyeOff,
    Upload,
    X
} from 'lucide-react';
import { settingsAPI } from '../utils/api';

// Validation schema for user profile
const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    notifications: z.object({
        emailNotifications: z.boolean(),
        orderUpdates: z.boolean(),
        promotionalOffers: z.boolean(),
        securityAlerts: z.boolean()
    })
});

// Validation schema for password change
const passwordSchema = z.object({
    currentPassword: z.string().min(6, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
});

const Settings = () => {
    const { user, logout, setUser, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    // Profile form
    const {
        register: registerProfile,
        handleSubmit: handleProfileSubmit,
        formState: { errors: profileErrors },
        reset: resetProfile,
        watch
    } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            address: user?.address || '',
            city: user?.city || '',
            state: user?.state || '',
            country: user?.country || '',
            postalCode: user?.postalCode || '',
            notifications: {
                emailNotifications: user?.notifications?.emailNotifications || true,
                orderUpdates: user?.notifications?.orderUpdates || true,
                promotionalOffers: user?.notifications?.promotionalOffers || false,
                securityAlerts: user?.notifications?.securityAlerts || true
            }
        }
    });

    // Password form
    const {
        register: registerPassword,
        handleSubmit: handlePasswordSubmit,
        formState: { errors: passwordErrors },
        reset: resetPassword,
        setError
    } = useForm({
        resolver: zodResolver(passwordSchema)
    });

    // Initialize form with user data
    useEffect(() => {
        if (user) {
            resetProfile({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
                city: user.city || '',
                state: user.state || '',
                country: user.country || '',
                postalCode: user.postalCode || '',
                notifications: {
                    emailNotifications: user.notifications?.emailNotifications || true,
                    orderUpdates: user.notifications?.orderUpdates || true,
                    promotionalOffers: user.notifications?.promotionalOffers || false,
                    securityAlerts: user.notifications?.securityAlerts || true
                }
            });
        }
    }, [user, resetProfile]);



    // Update profile
    const onProfileSubmit = async (data) => {
        setLoading(true);
        try {
            const response = await settingsAPI.updateProfile(data);

            setUser(prev => ({
                ...prev,
                ...response.data
            }));

            // Refresh user data
            await refreshUser();

            setIsEditing(false);
            toast.success('Profile updated successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };


    const onProfileImageChange = async () => {
        if (!profileImage) return;

        const formData = new FormData();
        formData.append('profileImage', profileImage);

        await settingsAPI.uploadProfileImage(formData);
        await refreshUser();   // 🔥 THIS updates image in UI

        toast.success('Profile image updated');
    };



    // Change password
    const onPasswordSubmit = async (data) => {
        setLoading(true);
        try {
            await settingsAPI.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            });

            resetPassword();
            setShowPasswordForm(false);
            toast.success('Password changed successfully!');

            // Logout after password change for security
            setTimeout(() => {
                logout();
                toast('Please login with your new password');
            }, 2000);
        } catch (error) {
            if (error.response?.status === 401) {
                setError('currentPassword', {
                    type: 'manual',
                    message: 'Current password is incorrect'
                });
            } else {
                toast.error(error.response?.data?.message || 'Failed to change password');
            }
        } finally {
            setLoading(false);
        }
    };

    // Get user initials for avatar
    const getUserInitials = () => {
        if (!user?.name) return 'U';
        return user.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Tab navigation
    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
        { id: 'security', label: 'Security', icon: <Shield className="h-4 w-4" /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
        { id: 'preferences', label: 'Preferences', icon: <Globe className="h-4 w-4" /> }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
                    <p className="text-gray-600 mt-2">
                        Manage your profile information, security, and preferences
                    </p>
                </motion.div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <div className="lg:w-1/4">
                        <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
                            <div className="flex flex-col items-center mb-8">
                                <div className="relative mb-4">
                                    <div className="h-24 w-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                        {getUserInitials()}
                                    </div>
                                    <label
                                        htmlFor="profileImage"
                                        className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors"
                                    >
                                        <Camera className="h-4 w-4" />
                                    </label>
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
                                <p className="text-gray-600 text-sm mt-1">{user?.email}</p>
                                <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${user?.role === 'ADMIN'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-blue-100 text-blue-800'
                                    }`}>
                                    {user?.role}
                                </div>
                            </div>

                            <nav className="space-y-2">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${activeTab === tab.id
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="mr-3">{tab.icon}</span>
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:w-3/4">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white rounded-xl shadow-sm p-6"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                                        <p className="text-gray-600 mt-1">
                                            Update your personal details and contact information
                                        </p>
                                    </div>
                                    {!isEditing ? (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Edit Profile
                                        </button>
                                    ) : (
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    resetProfile();
                                                    setProfileImage(null);
                                                    setImagePreview(user?.profileImage || '');
                                                }}
                                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleProfileSubmit(onProfileSubmit)}
                                                disabled={loading}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                                            >
                                                {loading ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="h-4 w-4 mr-2" />
                                                        Save Changes
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <form onSubmit={handleProfileSubmit(onProfileSubmit)}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Personal Information */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                                <User className="h-5 w-5 mr-2 text-blue-600" />
                                                Personal Information
                                            </h3>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Full Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    {...registerProfile('name')}
                                                    disabled={!isEditing}
                                                    className={`w-full px-4 py-2 rounded-lg border ${isEditing
                                                        ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                                        : 'border-transparent bg-gray-50'
                                                        } transition-colors`}
                                                />
                                                {profileErrors.name && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {profileErrors.name.message}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Email Address *
                                                </label>
                                                <div className="flex items-center">
                                                    <Mail className="h-5 w-5 text-gray-400 mr-2" />
                                                    <input
                                                        type="email"
                                                        {...registerProfile('email')}
                                                        disabled={!isEditing || user?.role !== 'ADMIN'}
                                                        className={`w-full px-4 py-2 rounded-lg border ${isEditing && user?.role === 'ADMIN'
                                                            ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                                            : 'border-transparent bg-gray-50'
                                                            } transition-colors`}
                                                    />
                                                </div>
                                                {profileErrors.email && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {profileErrors.email.message}
                                                    </p>
                                                )}
                                                {user?.role !== 'ADMIN' && isEditing && (
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        Contact an administrator to change your email
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Phone Number
                                                </label>
                                                <div className="flex items-center">
                                                    <Phone className="h-5 w-5 text-gray-400 mr-2" />
                                                    <input
                                                        type="tel"
                                                        {...registerProfile('phone')}
                                                        disabled={!isEditing}
                                                        className={`w-full px-4 py-2 rounded-lg border ${isEditing
                                                            ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                                            : 'border-transparent bg-gray-50'
                                                            } transition-colors`}
                                                        placeholder="+1 (555) 123-4567"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Address Information */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                                                Address Information
                                            </h3>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Address
                                                </label>
                                                <input
                                                    type="text"
                                                    {...registerProfile('address')}
                                                    disabled={!isEditing}
                                                    className={`w-full px-4 py-2 rounded-lg border ${isEditing
                                                        ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                                        : 'border-transparent bg-gray-50'
                                                        } transition-colors`}
                                                    placeholder="123 Main Street"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        City
                                                    </label>
                                                    <input
                                                        type="text"
                                                        {...registerProfile('city')}
                                                        disabled={!isEditing}
                                                        className={`w-full px-4 py-2 rounded-lg border ${isEditing
                                                            ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                                            : 'border-transparent bg-gray-50'
                                                            } transition-colors`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        State
                                                    </label>
                                                    <input
                                                        type="text"
                                                        {...registerProfile('state')}
                                                        disabled={!isEditing}
                                                        className={`w-full px-4 py-2 rounded-lg border ${isEditing
                                                            ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                                            : 'border-transparent bg-gray-50'
                                                            } transition-colors`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Country
                                                    </label>
                                                    <input
                                                        type="text"
                                                        {...registerProfile('country')}
                                                        disabled={!isEditing}
                                                        className={`w-full px-4 py-2 rounded-lg border ${isEditing
                                                            ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                                            : 'border-transparent bg-gray-50'
                                                            } transition-colors`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Postal Code
                                                    </label>
                                                    <input
                                                        type="text"
                                                        {...registerProfile('postalCode')}
                                                        disabled={!isEditing}
                                                        className={`w-full px-4 py-2 rounded-lg border ${isEditing
                                                            ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                                            : 'border-transparent bg-gray-50'
                                                            } transition-colors`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white rounded-xl shadow-sm p-6"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
                                        <p className="text-gray-600 mt-1">
                                            Manage your password and account security
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Change Password Form */}
                                    {showPasswordForm ? (
                                        <div className="border border-gray-200 rounded-xl p-6">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                                    <Key className="h-5 w-5 mr-2 text-blue-600" />
                                                    Change Password
                                                </h3>
                                                <button
                                                    onClick={() => {
                                                        setShowPasswordForm(false);
                                                        resetPassword();
                                                    }}
                                                    className="text-gray-500 hover:text-gray-700"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>

                                            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Current Password *
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={showCurrentPassword ? "text" : "password"}
                                                            {...registerPassword('currentPassword')}
                                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                        >
                                                            {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                        </button>
                                                    </div>
                                                    {passwordErrors.currentPassword && (
                                                        <p className="mt-1 text-sm text-red-600">
                                                            {passwordErrors.currentPassword.message}
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        New Password *
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={showNewPassword ? "text" : "password"}
                                                            {...registerPassword('newPassword')}
                                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                        >
                                                            {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                        </button>
                                                    </div>
                                                    {passwordErrors.newPassword && (
                                                        <p className="mt-1 text-sm text-red-600">
                                                            {passwordErrors.newPassword.message}
                                                        </p>
                                                    )}
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        Must be at least 8 characters long
                                                    </p>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Confirm New Password *
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={showConfirmPassword ? "text" : "password"}
                                                            {...registerPassword('confirmPassword')}
                                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                        >
                                                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                        </button>
                                                    </div>
                                                    {passwordErrors.confirmPassword && (
                                                        <p className="mt-1 text-sm text-red-600">
                                                            {passwordErrors.confirmPassword.message}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex justify-end pt-4">
                                                    <button
                                                        type="submit"
                                                        disabled={loading}
                                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {loading ? 'Changing Password...' : 'Change Password'}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    ) : (
                                        <div className="border border-gray-200 rounded-xl p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                                                Password Security
                                            </h3>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-gray-900 font-medium">Password</p>
                                                    <p className="text-gray-600 text-sm mt-1">
                                                        Last changed 30 days ago
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setShowPasswordForm(true)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    Change Password
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Two-Factor Authentication */}
                                    <div className="border border-gray-200 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                            <Shield className="h-5 w-5 mr-2 text-blue-600" />
                                            Two-Factor Authentication
                                        </h3>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-gray-900 font-medium">Add extra security to your account</p>
                                                <p className="text-gray-600 text-sm mt-1">
                                                    Protect your account with an additional layer of security
                                                </p>
                                            </div>
                                            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                                Enable 2FA
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white rounded-xl shadow-sm p-6"
                            >
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
                                    <p className="text-gray-600 mt-1">
                                        Choose how you want to be notified about your account activity
                                    </p>
                                </div>

                                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                            <Bell className="h-5 w-5 mr-2 text-blue-600" />
                                            Email Notifications
                                        </h3>

                                        <div className="space-y-4">
                                            {[
                                                { field: 'emailNotifications', label: 'All Email Notifications', description: 'Receive all email notifications from GlowNest Decor' },
                                                { field: 'orderUpdates', label: 'Order Updates', description: 'Get notified about your order status and shipping updates' },
                                                { field: 'promotionalOffers', label: 'Promotional Offers', description: 'Receive special offers, discounts, and promotions' },
                                                { field: 'securityAlerts', label: 'Security Alerts', description: 'Get notified about important security updates and changes' }
                                            ].map((item) => (
                                                <div key={item.field} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">{item.label}</p>
                                                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            {...registerProfile(`notifications.${item.field}`)}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4 mr-2" />
                                                    Save Preferences
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {/* Preferences Tab */}
                        {activeTab === 'preferences' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white rounded-xl shadow-sm p-6"
                            >
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Preferences</h2>
                                    <p className="text-gray-600 mt-1">
                                        Customize your experience on GlowNest Decor
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="border border-gray-200 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                            <Globe className="h-5 w-5 mr-2 text-blue-600" />
                                            Language & Region
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Preferred Language
                                                </label>
                                                <select className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                                                    <option>English (US)</option>
                                                    <option>English (UK)</option>
                                                    <option>Spanish</option>
                                                    <option>French</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Time Zone
                                                </label>
                                                <select className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                                                    <option>UTC-05:00 Eastern Time (US & Canada)</option>
                                                    <option>UTC-08:00 Pacific Time (US & Canada)</option>
                                                    <option>UTC+00:00 Greenwich Mean Time</option>
                                                    <option>UTC+05:30 India Standard Time</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border border-gray-200 rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                            <Bell className="h-5 w-5 mr-2 text-blue-600" />
                                            Data & Privacy
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-gray-900">Download Your Data</p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Get a copy of your personal data
                                                    </p>
                                                </div>
                                                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                                    Request Data
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-gray-900">Delete Account</p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Permanently delete your account and all data
                                                    </p>
                                                </div>
                                                <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                                                    Delete Account
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;