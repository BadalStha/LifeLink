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

// POST /api/alerts - Create a new alert (admin/hospital only)
router.post('/alerts', verifyToken, async (req, res) => {
    const {
        alert_type,
        message,
        urgency,
        target_audience,
        blood_type_target,
        organ_type_target,
        related_request_id
    } = req.body;

    if (req.role !== 'admin' && req.role !== 'hospital') {
        return res.status(403).json({ error: 'Only admins and hospitals can create alerts' });
    }

    if (!alert_type || !message) {
        return res.status(400).json({ error: 'alert_type and message are required' });
    }

    const validAlertTypes = ['blood_needed', 'organ_needed', 'donation_available', 'system_alert'];
    if (!validAlertTypes.includes(alert_type)) {
        return res.status(400).json({ error: 'Invalid alert_type' });
    }

    const validUrgency = ['low', 'medium', 'high', 'critical'];
    if (urgency && !validUrgency.includes(urgency)) {
        return res.status(400).json({ error: 'Invalid urgency level' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO alerts 
             (created_by, alert_type, message, urgency, target_audience, blood_type_target, organ_type_target, related_request_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
             RETURNING *`,
            [
                req.userId,
                alert_type,
                message,
                urgency || 'medium',
                target_audience || 'all_users',
                blood_type_target || null,
                organ_type_target || null,
                related_request_id || null
            ]
        );

        res.status(201).json({
            message: 'Alert created successfully',
            alert: result.rows[0]
        });
    } catch (err) {
        console.error('Create alert error:', err);
        res.status(500).json({ error: 'Server error creating alert' });
    }
});

// GET /api/alerts - Get all alerts (filtered by user's profile for targeting)
router.get('/alerts', async (req, res) => {
    const { limit = 20, offset = 0, urgency = '', alert_type = '' } = req.query;

    try {
        let query = `
            SELECT a.*, u.name as created_by_name 
            FROM alerts a
            LEFT JOIN users u ON a.created_by = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (urgency) {
            query += ` AND a.urgency = $${paramCount}`;
            params.push(urgency);
            paramCount++;
        }

        if (alert_type) {
            query += ` AND a.alert_type = $${paramCount}`;
            params.push(alert_type);
            paramCount++;
        }

        query += ` ORDER BY 
            CASE a.urgency 
                WHEN 'critical' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'medium' THEN 3 
                WHEN 'low' THEN 4 
            END,
            a.created_at DESC
            LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        res.json({
            alerts: result.rows,
            count: result.rows.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (err) {
        console.error('Get alerts error:', err);
        res.status(500).json({ error: 'Server error fetching alerts' });
    }
});

// DELETE /api/alerts/:id - Delete alert (admin only)
router.delete('/alerts/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    if (req.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can delete alerts' });
    }

    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid alert ID' });
    }

    try {
        const result = await pool.query('DELETE FROM alerts WHERE id = $1 RETURNING *', [id]);

        if (!result.rows[0]) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        res.json({ message: 'Alert deleted successfully' });
    } catch (err) {
        console.error('Delete alert error:', err);
        res.status(500).json({ error: 'Server error deleting alert' });
    }
});

export default router;
