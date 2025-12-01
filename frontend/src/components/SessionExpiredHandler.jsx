import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SessionExpiredHandler = () => {
    const { sessionExpired } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (sessionExpired && window.location.pathname !== '/login') {
            navigate('/login', {
                state: {
                    message: 'Your session has expired. Please login again.',
                    type: 'warning'
                }
            });
        }
    }, [sessionExpired, navigate]);

    return null; // This component doesn't render anything
};

export default SessionExpiredHandler;