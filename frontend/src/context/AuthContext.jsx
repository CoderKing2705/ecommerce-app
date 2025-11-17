import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Set base URL for API calls
    useEffect(() => {
        axios.defaults.baseURL = 'http://localhost:5000/api';

        // Add response interceptor to handle 401 errors
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    console.log('Auto-logout due to 401 error');
                    localStorage.removeItem('token');
                    delete axios.defaults.headers.common['Authorization'];
                    setUser(null);
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    const verifyToken = useCallback(async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            setLoading(false);
            return;
        }

        try {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const response = await axios.get('/auth/me');
            setUser(response.data);
        } catch (error) {
            console.log('Token invalid, clearing auth...');
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        verifyToken();
    }, [verifyToken]);

    const login = async (email, password) => {
        try {
            const response = await axios.post('/auth/login', { email, password });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);

            return { success: true, user };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const register = async (email, password, name) => {
        try {
            const response = await axios.post('/auth/register', { email, password, name });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);

            return { success: true, user };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const handleGoogleAuth = () => {
        window.location.href = 'http://localhost:5000/api/auth/google';
    };

    const value = {
        user,
        login,
        register,
        logout,
        handleGoogleAuth,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};