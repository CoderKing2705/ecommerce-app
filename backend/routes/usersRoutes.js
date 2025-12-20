import express from 'express';
import { pool } from '../config/database.js';
import { auth } from "../middleware/auth.js";


const router = express.Router();


router.put('/profile', auth, async (req, res) => {
    try {
        const {
            name,
            phone,
            address,
            city,
            state,
            country,
            postalCode,
            notifications
        } = req.body;

        const userId = req.user.id;

        const result = await pool.query(
            `
            UPDATE users SET
                name = $1,
                phone = $2,
                address = $3,
                city = $4,
                state = $5,
                country = $6,
                postal_code = $7,
                notifications = $9,
                updated_at = NOW()
            WHERE id = $10
            RETURNING
                id,
                email,
                name,
                role,
                phone,
                notifications,
                status,
                email_verified,
                created_at,
                updated_at;
            `,
            [
                name,
                phone,
                address,
                city,
                state,
                country,
                postalCode,
                notifications,
                userId
            ]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating profile' });
    }
});


// Change password
router.put('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const result = await pool.query(
            'SELECT password FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(
            currentPassword,
            result.rows[0].password
        );

        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query(
            'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
            [hashedPassword, req.user.id]
        );

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error changing password' });
    }
});




export default router;