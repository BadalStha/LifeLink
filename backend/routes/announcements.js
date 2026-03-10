import express from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this';

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'lifelink_db',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).json({ error: 'No token provided' });
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid or expired token' });
        req.userId = decoded.userId;
        req.role = decoded.role;
        next();
    });
};

// GET /api/announcements - Public, get published announcements
router.get('/announcements', async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        const result = await pool.query(
            `SELECT a.*, u.name AS author_name
             FROM announcements a
             LEFT JOIN users u ON a.created_by = u.id
             WHERE a.is_published = true
             ORDER BY a.created_at DESC
             LIMIT $1 OFFSET $2`,
            [parseInt(limit), parseInt(offset)]
        );
        res.json({ announcements: result.rows });
    } catch (err) {
        console.error('Get announcements error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/announcements - Create announcement (admin only)
router.post('/announcements', verifyToken, async (req, res) => {
    if (req.role !== 'admin' && req.role !== 'hospital') {
        return res.status(403).json({ error: 'Only admins can create announcements' });
    }
    const { title, content, image_url } = req.body;
    if (!title || !content) {
        return res.status(400).json({ error: 'title and content are required' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO announcements (created_by, title, content, image_url, is_published)
             VALUES ($1, $2, $3, $4, true)
             RETURNING *`,
            [req.userId, title, content, image_url || null]
        );
        res.status(201).json({ announcement: result.rows[0] });
    } catch (err) {
        console.error('Create announcement error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/announcements/:id - Delete announcement (admin only)
router.delete('/announcements/:id', verifyToken, async (req, res) => {
    if (req.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can delete announcements' });
    }
    try {
        await pool.query('DELETE FROM announcements WHERE id = $1', [req.params.id]);
        res.json({ message: 'Announcement deleted' });
    } catch (err) {
        console.error('Delete announcement error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
