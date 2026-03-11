import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this';

// Admin credentials (for demo/testing)
// In production, this would come from a secure database
const ADMIN_EMAIL = 'admin@lifelink.org';
const ADMIN_PASSWORD = 'admin@123456'; // Change this in production!

// Admin Login endpoint
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Check credentials
    if (email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
        // Generate admin token with admin flag
        const token = jwt.sign(
            { 
                adminId: 'admin_1', 
                isAdmin: true, 
                email: ADMIN_EMAIL 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.json({
            message: 'Admin login successful',
            token,
            isAdmin: true,
            email: ADMIN_EMAIL
        });
    }

    // Failed login
    res.status(401).json({ error: 'Invalid admin credentials' });
});

// Admin Logout endpoint
router.post('/logout', (req, res) => {
    res.json({ message: 'Admin logged out successfully' });
});

export default router;
