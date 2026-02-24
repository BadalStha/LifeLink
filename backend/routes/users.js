import express from 'express';
import { Pool } from 'pg';

const router = express.Router();

// Initialize database pool
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'lifelink_db',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: 'No token provided' });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this';
    const jwt = require('jsonwebtoken');
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        req.userId = decoded.userId;
        req.role = decoded.role;
        next();
    });
};

// PUT /api/profile - Update current user's profile
router.put('/profile', verifyToken, async (req, res) => {
    const { name, phone, address, city, state, country, blood_type, age, medical_history } = req.body;

    // Validate blood type if provided
    const validBloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
    if (blood_type && !validBloodTypes.includes(blood_type)) {
        return res.status(400).json({ error: 'Invalid blood type' });
    }

    try {
        const result = await pool.query(
            `UPDATE users 
             SET name = COALESCE($2, name), 
                 phone = COALESCE($3, phone), 
                 address = COALESCE($4, address), 
                 city = COALESCE($5, city), 
                 state = COALESCE($6, state), 
                 country = COALESCE($7, country), 
                 blood_type = COALESCE($8, blood_type), 
                 age = COALESCE($9, age), 
                 medical_history = COALESCE($10, medical_history),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 
             RETURNING id, email, role, name, phone, address, city, state, country, blood_type, age, medical_history`,
            [req.userId, name, phone, address, city, state, country, blood_type, age, medical_history]
        );

        if (!result.rows[0]) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ 
            message: 'Profile updated successfully',
            user: result.rows[0] 
        });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Server error updating profile' });
    }
});

// GET /api/users/:userId - Get any user's public profile
router.get('/users/:userId', async (req, res) => {
    const { userId } = req.params;

    // Validate user ID is a number
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const result = await pool.query(
            `SELECT id, email, role, name, city, blood_type, age, is_active, created_at 
             FROM users 
             WHERE id = $1 AND is_active = true`,
            [userId]
        );

        if (!result.rows[0]) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ error: 'Server error fetching user' });
    }
});

// GET /api/users/search - Search for users by blood type, role, city, organ type
router.get('/search', async (req, res) => {
    const { blood_type, role, city, organ_type, limit = 20, offset = 0 } = req.query;

    try {
        let query = `SELECT id, email, role, name, city, blood_type, age, created_at 
                     FROM users 
                     WHERE is_active = true`;
        const params = [];
        let paramCount = 1;

        // Add filters
        if (blood_type) {
            query += ` AND blood_type = $${paramCount}`;
            params.push(blood_type);
            paramCount++;
        }

        if (role) {
            query += ` AND role = $${paramCount}`;
            params.push(role);
            paramCount++;
        }

        if (city) {
            query += ` AND LOWER(city) LIKE LOWER($${paramCount})`;
            params.push(`%${city}%`);
            paramCount++;
        }

        // Add limit and offset
        query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        res.json({ 
            users: result.rows,
            count: result.rows.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (err) {
        console.error('Search users error:', err);
        res.status(500).json({ error: 'Server error searching users' });
    }
});

export default router;
