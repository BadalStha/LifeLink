import express from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

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
    const { name, phone, address, city, state, country, blood_type, age, medical_history, donation_type, donation_organ } = req.body;

    // Validate blood type if provided
    const validBloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
    if (blood_type && !validBloodTypes.includes(blood_type)) {
        return res.status(400).json({ error: 'Invalid blood type' });
    }

    const validDonationTypes = ['blood', 'organ'];
    const validOrgans = ['kidney', 'liver', 'heart', 'lung', 'cornea', 'pancreas', 'intestine'];

    if (donation_type && !validDonationTypes.includes(donation_type)) {
        return res.status(400).json({ error: 'Invalid donation type' });
    }

    if (donation_type === 'organ' && (!donation_organ || !validOrgans.includes(donation_organ))) {
        return res.status(400).json({ error: 'Select a valid organ' });
    }

    if (donation_organ && !validOrgans.includes(donation_organ)) {
        return res.status(400).json({ error: 'Invalid organ type' });
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
                 donation_type = COALESCE($11, donation_type),
                 donation_organ = CASE
                    WHEN $11 = 'blood' THEN NULL
                    WHEN $11 = 'organ' THEN $12
                    ELSE donation_organ
                 END,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 
             RETURNING id, email, role, name, phone, address, city, state, country, blood_type, age, medical_history, donation_type, donation_organ`,
            [req.userId, name, phone, address, city, state, country, blood_type, age, medical_history, donation_type, donation_organ]
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
            `SELECT id, email, role, name, city, blood_type, age, donation_type, donation_organ, is_active, created_at 
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
    const { blood_type, role, city, organ_type, ready_to_donate, limit = 20, offset = 0, search } = req.query;

    try {
        let query = `SELECT id, email, role, name, city, blood_type, age, donation_type, donation_organ AS organ_type, is_active, created_at 
                     FROM users 
                     WHERE is_active = true`;
        const params = [];
        let paramCount = 1;

        if (ready_to_donate === 'true') {
            query += ` AND donation_type IS NOT NULL`;
        }

        if (search) {
            query += ` AND LOWER(name) LIKE LOWER($${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        // Add filters
        if (blood_type) {
            query += ` AND donation_type = 'blood' AND blood_type = $${paramCount}`;
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

        if (organ_type) {
            query += ` AND donation_type = 'organ' AND LOWER(donation_organ) = LOWER($${paramCount})`;
            params.push(organ_type);
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

// GET /api/user/stats - Get current user's statistics
router.get('/user/stats', verifyToken, async (req, res) => {
    try {
        // Count blood donations by this user
        const bloodDonations = await pool.query(
            `SELECT COUNT(*) as count FROM blood_donations WHERE donor_id = $1`,
            [req.userId]
        );

        // Count organ donations by this user
        const organDonations = await pool.query(
            `SELECT COUNT(*) as count FROM organ_donations WHERE donor_id = $1`,
            [req.userId]
        );

        // Count donation requests created by this user
        const requestsCreated = await pool.query(
            `SELECT COUNT(*) as count FROM donation_requests WHERE user_id = $1`,
            [req.userId]
        );

        const totalDonations = parseInt(bloodDonations.rows[0].count) + parseInt(organDonations.rows[0].count);
        
        // Determine status based on activity
        let status = 'New Member';
        if (totalDonations >= 10) {
            status = 'Legendary Hero';
        } else if (totalDonations >= 5) {
            status = 'Super Hero';
        } else if (totalDonations >= 2) {
            status = 'Active Hero';
        } else if (totalDonations >= 1) {
            status = 'Rising Hero';
        }

        res.json({
            stats: {
                lives_saved: totalDonations,
                blood_donations: parseInt(bloodDonations.rows[0].count),
                organ_donations: parseInt(organDonations.rows[0].count),
                requests_created: parseInt(requestsCreated.rows[0].count),
                status: status
            }
        });
    } catch (err) {
        console.error('Get user stats error:', err);
        res.status(500).json({ error: 'Server error fetching user stats' });
    }
});

// GET /api/user/donation-history - Get current user's donation history
router.get('/user/donation-history', verifyToken, async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        // Get blood donations
        const bloodDonations = await pool.query(
            `SELECT 
                bd.id,
                bd.donation_date,
                bd.location as hospital_name,
                bd.blood_type,
                'Blood' as donation_type,
                bd.created_at
             FROM blood_donations bd
             WHERE bd.donor_id = $1
             ORDER BY bd.donation_date DESC
             LIMIT $2`,
            [req.userId, parseInt(limit)]
        );

        // Get organ donations
        const organDonations = await pool.query(
            `SELECT 
                od.id,
                od.donation_date,
                NULL::text as hospital_name,
                od.organ_type,
                'Organ' as donation_type,
                od.created_at
             FROM organ_donations od
             WHERE od.donor_id = $1
             ORDER BY od.donation_date DESC
             LIMIT $2`,
            [req.userId, parseInt(limit)]
        );

        // Combine and sort by donation_date
        const allDonations = [
            ...bloodDonations.rows,
            ...organDonations.rows
        ].sort((a, b) => new Date(b.donation_date) - new Date(a.donation_date));

        res.json({
            history: allDonations.slice(0, parseInt(limit))
        });
    } catch (err) {
        console.error('Get donation history error:', err);
        res.status(500).json({ error: 'Server error fetching donation history' });
    }
});

export default router;
