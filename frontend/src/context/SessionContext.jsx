import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const SessionContext = createContext();

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
};

export const SessionProvider = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showWarning, setShowWarning] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const activityTimer = useRef(null);
    const warningTimer = useRef(null);

    const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
    const WARNING_TIME = 1 * 60 * 1000; // 1 minute warning before logout

    const resetTimers = useCallback(() => {
        // Clear existing timers
        if (activityTimer.current) clearTimeout(activityTimer.current);
        if (warningTimer.current) clearTimeout(warningTimer.current);

        // Hide warning
        setShowWarning(false);
        setCountdown(60);

        // Set new timers if user is logged in
        if (user) {
            // Set warning timer (14 minutes)
            warningTimer.current = setTimeout(() => {
                setShowWarning(true);
            }, SESSION_TIMEOUT - WARNING_TIME);

            // Set logout timer (15 minutes)
            activityTimer.current = setTimeout(async () => {
                await logout();
                navigate('/login', {
                    state: {
                        message: 'Your session has expired due to inactivity. Please login again.',
                        type: 'warning'
                    }
                });
            }, SESSION_TIMEOUT);
        }
    }, [user, logout, navigate, SESSION_TIMEOUT, WARNING_TIME]);

    const handleUserActivity = useCallback(() => {
        if (user) {
            resetTimers();
        }
    }, [user, resetTimers]);

    // Countdown timer for warning
    useEffect(() => {
        let interval;
        if (showWarning) {
            interval = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [showWarning]);

    // Listen for user activity events
    useEffect(() => {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove'];

        const handleActivity = () => {
            handleUserActivity();
        };

        events.forEach(event => {
            document.addEventListener(event, handleActivity, { passive: true });
        });

        // Initialize timers
        resetTimers();

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
            if (activityTimer.current) clearTimeout(activityTimer.current);
            if (warningTimer.current) clearTimeout(warningTimer.current);
        };
    }, [handleUserActivity, resetTimers]);

    // Reset timers when user changes
    useEffect(() => {
        resetTimers();
        return () => {
            if (activityTimer.current) clearTimeout(activityTimer.current);
            if (warningTimer.current) clearTimeout(warningTimer.current);
        };
    }, [resetTimers]);

    const extendSession = useCallback(async () => {
        if (user) {
            try {
                // You can make an API call here to update server-side activity
                resetTimers();
                setShowWarning(false);
            } catch (error) {
                console.error('Error extending session:', error);
            }
        }
    }, [user, resetTimers]);

    return (
        <SessionContext.Provider value={{
            showWarning,
            countdown,
            extendSession,
            resetTimers: handleUserActivity
        }}>
            {children}
        </SessionContext.Provider>
    );
};