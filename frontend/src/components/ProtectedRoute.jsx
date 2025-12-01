import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { useSession } from '../context/SessionContext';
import { useEffect } from 'react';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, loading, sessionExpired, resetInactivityTimer } = useAuth();
    const location = useLocation();

    useEffect(() => {
        if (user) {
            resetInactivityTimer?.();
        }
    }, [user, resetInactivityTimer, location.pathname]);
    if (loading) {
        return <LoadingSpinner text="Checking authentication..." />;
    }

    if (sessionExpired) {
        // Clear any stored token to prevent auto-login attempts
        localStorage.removeItem('token');
        return <Navigate to="/login" state={{
            from: location,
            message: 'Your session has expired. Please login again.',
            type: 'warning'
        }} replace />;
    }

    if (!user) {
        // Redirect to login page with return url
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (adminOnly && user.role !== 'ADMIN') {
        // Redirect non-admin users to dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;