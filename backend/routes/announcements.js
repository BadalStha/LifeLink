import express from 'express';
import pool from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

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
    try {
        const announcementId = parseInt(req.params.id, 10);
        if (Number.isNaN(announcementId)) {
            return res.status(400).json({ error: 'Invalid announcement id' });
        }

        if (req.role === 'admin') {
            const result = await pool.query('DELETE FROM announcements WHERE id = $1 RETURNING id', [announcementId]);
            if (!result.rows[0]) {
                return res.status(404).json({ error: 'Announcement not found' });
            }
            return res.json({ message: 'Announcement deleted' });
        }

        if (req.role === 'hospital') {
            const result = await pool.query(
                'DELETE FROM announcements WHERE id = $1 AND created_by = $2 RETURNING id',
                [announcementId, req.userId]
            );

            if (!result.rows[0]) {
                return res.status(404).json({ error: 'Announcement not found or not owned by this hospital' });
            }

            return res.json({ message: 'Announcement deleted' });
        }

        return res.status(403).json({ error: 'Only admins and hospitals can delete announcements' });
    } catch (err) {
        console.error('Delete announcement error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
