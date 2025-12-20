import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const normalizeUser = (u) => {
    if (!u) return null;

    return {
        ...u,
        profileImage: u.profile_image,   // 🔥 THIS IS THE KEY FIX
    };
};


export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sessionExpired, setSessionExpired] = useState(false);
    const [lastActivity, setLastActivity] = useState(Date.now());
    const inactivityTimerRef = useRef(null);

    // Set base URL for API calls
    useEffect(() => {
        axios.defaults.baseURL = 'http://localhost:5000/api';
    }, []);

    // Set up activity tracking
    const resetInactivityTimer = useCallback(() => {
        setLastActivity(Date.now());
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        // Set timeout for 15 minutes (900000 ms)
        inactivityTimerRef.current = setTimeout(() => {
            if (user) {
                setSessionExpired(true);
                logout();
            }
        }, 15 * 60 * 1000); // 15 minutes
    }, [user]);

    // Listen for user activity
    useEffect(() => {
        if (!user) return;

        const handleUserActivity = () => {
            resetInactivityTimer();
        };

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

        events.forEach(event => {
            window.addEventListener(event, handleUserActivity);
        });

        // Initial timer setup
        resetInactivityTimer();

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleUserActivity);
            });
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
        };
    }, [user, resetInactivityTimer]);


    const refreshUser = useCallback(async () => {
        try {
            const response = await axios.get('/auth/me');
            setUser(response.data);
        } catch (error) {
            console.error('Failed to refresh user', error);
        }
    }, []);

    const verifyToken = useCallback(async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            setLoading(false);
            return;
        }

        try {
            // Set the Authorization header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            const response = await axios.get('/auth/me');
            // setUser(response.data);
            setUser(normalizeUser(response.data));
            setSessionExpired(false);
        } catch (error) {
            handleAuthError(error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleAuthError = useCallback((error) => {
        const errorCode = error.response?.data?.code;

        if (error.response?.status === 401) {
            if (errorCode === 'SESSION_EXPIRED' || errorCode === 'TOKEN_EXPIRED') {
                setSessionExpired(true);
            }
            // Clear auth data
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
        }
    }, []);

    // Add response interceptor to handle 401 errors globally
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => {
                // Reset activity timer on successful response
                if (user) {
                    resetInactivityTimer();
                }
                return response;
            },
            (error) => {
                if (error.response?.status === 401) {
                    handleAuthError(error);
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [user, resetInactivityTimer, handleAuthError]);

    // Initial token verification
    useEffect(() => {
        verifyToken();
    }, [verifyToken]);

    const login = async (email, password) => {
        try {
            // Clear any existing headers first
            delete axios.defaults.headers.common['Authorization'];

            const response = await axios.post('/auth/login', { email, password });
            const { token, user: userData } = response.data;

            // Store token and set header
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // setUser(userData);
            setUser(normalizeUser(userData));
            setSessionExpired(false);
            resetInactivityTimer();
            return { success: true, user: userData };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const register = async (email, password, name) => {
        try {
            delete axios.defaults.headers.common['Authorization'];

            const response = await axios.post('/auth/register', { email, password, name });
            const { token, user: userData } = response.data;

            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // setUser(userData);
            setUser(normalizeUser(userData));
            setSessionExpired(false);
            resetInactivityTimer();
            return { success: true, user: userData };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const logout = useCallback(() => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        setSessionExpired(false);
        setLastActivity(Date.now());
    }, []);

    const handleGoogleAuth = () => {
        window.location.href = 'http://localhost:5000/api/auth/google';
    };


    const value = {
        user,
        setUser,
        login,
        register,
        logout,
        refreshUser,
        handleGoogleAuth,
        loading,
        sessionExpired,
        setSessionExpired,
        resetInactivityTimer,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};