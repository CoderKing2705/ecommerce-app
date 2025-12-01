import React from 'react';
import { useSession } from '../context/SessionContext';
import { AlertTriangle, X, Clock } from 'lucide-react';

const SessionWarning = () => {
    const { showWarning, countdown, extendSession } = useSession();

    if (!showWarning) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="bg-yellow-100 p-4">
                    <div className="flex items-center">
                        <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3" />
                        <h3 className="text-lg font-semibold text-yellow-900">
                            Session Timeout Warning
                        </h3>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="flex items-center justify-center mb-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-8 border-gray-200 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-800">{countdown}</div>
                                    <div className="text-xs text-gray-600 mt-1">seconds</div>
                                </div>
                            </div>
                            <Clock className="absolute -right-2 -top-2 h-8 w-8 text-yellow-600" />
                        </div>
                    </div>

                    <p className="text-gray-700 mb-2 text-center">
                        Your session will expire in <span className="font-semibold">{countdown} seconds</span> due to inactivity.
                    </p>
                    <p className="text-sm text-gray-500 text-center mb-6">
                        Would you like to continue your session?
                    </p>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                        <div
                            className="bg-yellow-600 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${(countdown / 60) * 100}%` }}
                        ></div>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col space-y-3">
                        <button
                            onClick={extendSession}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
                        >
                            <Clock className="h-5 w-5 mr-2" />
                            Continue Session
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-gray-100 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            Logout Now
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        For security reasons, you will be automatically logged out after 15 minutes of inactivity.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SessionWarning;