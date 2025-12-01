import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';


const updateUserActivity = async (userId) => {
    try {
        await pool.query(
            'UPDATE users SET last_activity = NOW() WHERE id = $1',
            [userId]
        );
    } catch (error) {
        console.error('Error updating user activity:', error);
    }
};

export const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user with last_activity timestamp
        const user = await pool.query(
            'SELECT id, email, name, role, last_activity FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (user.rows.length === 0) {
            return res.status(401).json({
                message: 'Invalid token',
                code: 'TOKEN_INVALID'
            });
        }

        req.user = user.rows[0];

        // Update user activity
        await updateUserActivity(req.user.id);
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                message: 'Invalid token',
                code: 'TOKEN_INVALID'
            });
        }

        res.status(401).json({ message: 'Authentication failed' });
    }
};

export const withSessionTimeout = (timeoutMinutes = 15) => {
    return async (req, res, next) => {
        try {
            const lastActivity = req.user?.last_activity;
            if (lastActivity) {
                const now = new Date();
                const timeDiff = now - new Date(lastActivity);
                const SESSION_TIMEOUT = timeoutMinutes * 60 * 1000;

                if (timeDiff > SESSION_TIMEOUT) {
                    return res.status(401).json({
                        message: 'Session expired. Please login again.',
                        code: 'SESSION_EXPIRED'
                    });
                }
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};

// Admin auth middleware
export const adminAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const user = await pool.query(
            'SELECT id, email, name, role, last_activity FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (user.rows.length === 0) {
            return res.status(401).json({ message: 'Token is not valid' });
        }

        // Check if user is admin
        if (user.rows[0].role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }

        req.user = user.rows[0];

        // Update admin user activity timestamp
        await updateUserActivity(decoded.userId);

        next();
    } catch (error) {
        console.error('Admin auth middleware error:', error);
        res.status(401).json({ message: 'Token is not valid' });
    }
};