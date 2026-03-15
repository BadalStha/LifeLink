import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';
import { JWT_SECRET } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import pool from '../db.js';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this';

// Admin Login endpoint
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const result = await pool.query(
            'SELECT id, email, password FROM users WHERE email = $1 AND role = $2',
            [normalizedEmail, 'admin']
        );

        const admin = result.rows[0];

        if (!admin) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }

        const token = jwt.sign(
            { adminId: admin.id, isAdmin: true, email: admin.email },
            JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION || '24h' }
        );

        return res.json({
            message: 'Admin login successful',
            token,
            isAdmin: true,
            email: admin.email,
        });
    } catch (err) {
        console.error('Admin login error:', err);
        return res.status(500).json({ error: 'Server error during login' });
    }
});

// Admin Logout endpoint
router.post('/logout', (req, res) => {
    res.json({ message: 'Admin logged out successfully' });
});

export default router;
