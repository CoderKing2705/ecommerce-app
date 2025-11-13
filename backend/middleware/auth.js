import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

export const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await pool.query('SELECT id, email, name, role FROM users WHERE id = $1', [decoded.userId]);

        if (user.rows.length === 0) {
            return res.status(401).json({ message: 'Token is not valid' });
        }

        req.user = user.rows[0];
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};