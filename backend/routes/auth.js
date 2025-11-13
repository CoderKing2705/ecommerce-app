import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import { register, login, getMe } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty().trim()
], register);

// Login
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
], login);

// Get current user
router.get('/me', auth, getMe);

// Google OAuth
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    (req, res) => {
        const token = jwt.sign(
            { userId: req.user.id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
    }
);

export default router;