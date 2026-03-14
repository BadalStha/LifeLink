import express from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this';

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

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        req.userId = decoded.userId;
        req.role = decoded.role;
        next();
    });
};

// POST /api/requests - Create a new donation request
router.post('/requests', verifyToken, async (req, res) => {
    const { 
        request_type, 
        blood_type, 
        organ_type, 
        units_needed, 
        urgency, 
        reason, 
        location 
    } = req.body;

    if (!request_type || (request_type !== 'blood' && request_type !== 'organ')) {
        return res.status(400).json({ error: 'Invalid request_type. Must be "blood" or "organ"' });
    }

    if (request_type === 'blood' && !blood_type) {
        return res.status(400).json({ error: 'blood_type is required for blood requests' });
    }

    if (request_type === 'organ' && !organ_type) {
        return res.status(400).json({ error: 'organ_type is required for organ requests' });
    }

    const validUrgency = ['low', 'medium', 'high', 'critical'];
    if (urgency && !validUrgency.includes(urgency)) {
        return res.status(400).json({ error: 'Invalid urgency level' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO donation_requests 
             (requester_id, request_type, blood_type, organ_type, units_needed, urgency, reason, location, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open') 
             RETURNING *`,
            [
                req.userId,
                request_type,
                blood_type || null,
                organ_type || null,
                units_needed || null,
                urgency || 'medium',
                reason || null,
                location || null
            ]
        );

        // Create a notification alert for other users when a help request is submitted.
        try {
            const createdRequest = result.rows[0];
            const requesterResult = await pool.query(
                `SELECT name FROM users WHERE id = $1`,
                [req.userId]
            );
            const requesterName = requesterResult.rows[0]?.name || 'A user';
            const requestLabel = request_type === 'blood'
                ? `blood (${blood_type || 'unknown group'})`
                : `organ (${organ_type || 'unknown organ'})`;

            await pool.query(
                `INSERT INTO alerts
                 (created_by, alert_type, message, urgency, target_audience, blood_type_target, organ_type_target, related_request_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    req.userId,
                    request_type === 'blood' ? 'blood_needed' : 'organ_needed',
                    `${requesterName} submitted a ${requestLabel} help request${location ? ` at ${location}` : ''}.`,
                    urgency || 'medium',
                    request_type === 'blood' && blood_type ? 'specific_blood_type' : 'all_users',
                    request_type === 'blood' ? blood_type || null : null,
                    request_type === 'organ' ? organ_type || null : null,
                    createdRequest.id
                ]
            );
        } catch (alertErr) {
            // Alert creation should not block request submission.
            console.error('Create request alert error:', alertErr);
        }

        res.status(201).json({
            message: 'Donation request created successfully',
            request: result.rows[0]
        });
    } catch (err) {
        console.error('Create request error:', err);
        res.status(500).json({ error: 'Server error creating request' });
    }
});

// GET /api/requests - Get all donation requests (with filters)
router.get('/requests', async (req, res) => {
    const { 
        request_type, 
        blood_type, 
        organ_type, 
        urgency, 
        status = 'open',
        limit = 50, 
        offset = 0 
    } = req.query;

    try {
        let query = `
            SELECT dr.*, u.name as requester_name, u.email as requester_email, u.phone as requester_phone, u.city
            FROM donation_requests dr
            LEFT JOIN users u ON dr.requester_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (request_type) {
            query += ` AND dr.request_type = $${paramCount}`;
            params.push(request_type);
            paramCount++;
        }

        if (blood_type) {
            query += ` AND dr.blood_type = $${paramCount}`;
            params.push(blood_type);
            paramCount++;
        }

        if (organ_type) {
            query += ` AND dr.organ_type = $${paramCount}`;
            params.push(organ_type);
            paramCount++;
        }

        if (urgency) {
            query += ` AND dr.urgency = $${paramCount}`;
            params.push(urgency);
            paramCount++;
        }

        if (status) {
            query += ` AND dr.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        query += ` ORDER BY 
            CASE dr.urgency 
                WHEN 'critical' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'medium' THEN 3 
                WHEN 'low' THEN 4 
            END,
            dr.created_at DESC
            LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        res.json({
            requests: result.rows,
            count: result.rows.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (err) {
        console.error('Get requests error:', err);
        res.status(500).json({ error: 'Server error fetching requests' });
    }
});

// GET /api/requests/:id - Get specific request
router.get('/requests/:id', async (req, res) => {
    const { id } = req.params;

    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid request ID' });
    }

    try {
        const result = await pool.query(
            `SELECT dr.*, u.name as requester_name, u.email as requester_email, u.phone as requester_phone, u.city
             FROM donation_requests dr
             LEFT JOIN users u ON dr.requester_id = u.id
             WHERE dr.id = $1`,
            [id]
        );

        if (!result.rows[0]) {
            return res.status(404).json({ error: 'Request not found' });
        }

        res.json({ request: result.rows[0] });
    } catch (err) {
        console.error('Get request error:', err);
        res.status(500).json({ error: 'Server error fetching request' });
    }
});

// PUT /api/requests/:id - Update request (owner or admin only)
router.put('/requests/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { status, urgency, reason, location, units_needed } = req.body;

    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid request ID' });
    }

    try {
        // Check ownership
        const checkResult = await pool.query(
            'SELECT requester_id FROM donation_requests WHERE id = $1',
            [id]
        );

        if (!checkResult.rows[0]) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (checkResult.rows[0].requester_id !== req.userId && req.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to update this request' });
        }

        const validStatus = ['open', 'fulfilled', 'cancelled'];
        if (status && !validStatus.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const validUrgency = ['low', 'medium', 'high', 'critical'];
        if (urgency && !validUrgency.includes(urgency)) {
            return res.status(400).json({ error: 'Invalid urgency level' });
        }

        const result = await pool.query(
            `UPDATE donation_requests 
             SET status = COALESCE($2, status),
                 urgency = COALESCE($3, urgency),
                 reason = COALESCE($4, reason),
                 location = COALESCE($5, location),
                 units_needed = COALESCE($6, units_needed),
                 fulfillment_date = CASE WHEN $2 = 'fulfilled' THEN CURRENT_DATE ELSE fulfillment_date END,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [id, status, urgency, reason, location, units_needed]
        );

        res.json({
            message: 'Request updated successfully',
            request: result.rows[0]
        });
    } catch (err) {
        console.error('Update request error:', err);
        res.status(500).json({ error: 'Server error updating request' });
    }
});

// DELETE /api/requests/:id - Delete request (owner or admin only)
router.delete('/requests/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid request ID' });
    }

    try {
        const checkResult = await pool.query(
            'SELECT requester_id FROM donation_requests WHERE id = $1',
            [id]
        );

        if (!checkResult.rows[0]) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (checkResult.rows[0].requester_id !== req.userId && req.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to delete this request' });
        }

        await pool.query('DELETE FROM donation_requests WHERE id = $1', [id]);

        res.json({ message: 'Request deleted successfully' });
    } catch (err) {
        console.error('Delete request error:', err);
        res.status(500).json({ error: 'Server error deleting request' });
    }
});

// GET /api/requests/user/my-requests - Get current user's requests
router.get('/user/my-requests', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM donation_requests 
             WHERE requester_id = $1 
             ORDER BY created_at DESC`,
            [req.userId]
        );

        res.json({
            requests: result.rows,
            count: result.rows.length
        });
    } catch (err) {
        console.error('Get user requests error:', err);
        res.status(500).json({ error: 'Server error fetching user requests' });
    }
});

export default router;
