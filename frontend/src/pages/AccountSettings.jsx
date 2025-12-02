import React, { useState } from 'react';
import { User, Settings, MapPin, Shield, Bell } from 'lucide-react';

const AccountSettings = () => {
    const [activeSection, setActiveSection] = useState('profile');

    const sections = [
        { id: 'profile', name: 'Profile', icon: User },
        { id: 'addresses', name: 'Shipping Addresses', icon: MapPin },
        { id: 'security', name: 'Security', icon: Shield },
        { id: 'notifications', name: 'Notifications', icon: Bell },
    ];

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Account Settings</h1>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="lg:w-1/4">
                        <div className="bg-white rounded-xl shadow-md p-4">
                            <div className="space-y-2">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`flex items-center w-full px-4 py-3 rounded-lg text-left ${activeSection === section.id
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <section.icon className="h-5 w-5 mr-3" />
                                        <span className="font-medium">{section.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="lg:w-3/4">
                        <div className="bg-white rounded-xl shadow-md p-6">
                            {activeSection === 'profile' && (
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Profile Information</h2>
                                    {/* Profile form */}
                                </div>
                            )}

                            {activeSection === 'addresses' && (
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-semibold text-gray-800">Shipping Addresses</h2>
                                    </div>
                                    <ShippingAddresses />
                                </div>
                            )}

                            {activeSection === 'security' && (
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Security Settings</h2>
                                    {/* Security settings */}
                                </div>
                            )}

                            {activeSection === 'notifications' && (
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Notification Preferences</h2>
                                    {/* Notification settings */}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountSettings;