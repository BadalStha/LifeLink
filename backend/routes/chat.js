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

// GET /api/messages/conversations - get unique conversation partners with last message
router.get('/messages/conversations', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT DISTINCT ON (partner_id)
                 partner_id,
                 partner_name,
                 last_message,
                 last_message_at,
                 unread_count
             FROM (
                 SELECT
                     CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END AS partner_id,
                     CASE WHEN m.sender_id = $1 THEN ru.name ELSE su.name END AS partner_name,
                     m.content AS last_message,
                     m.created_at AS last_message_at,
                     COUNT(CASE WHEN m.recipient_id = $1 AND m.is_read = false THEN 1 END)
                         OVER (PARTITION BY CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END) AS unread_count
                 FROM messages m
                 JOIN users su ON m.sender_id = su.id
                 JOIN users ru ON m.recipient_id = ru.id
                 WHERE m.sender_id = $1 OR m.recipient_id = $1
                 ORDER BY m.created_at DESC
             ) conversations
             ORDER BY partner_id, last_message_at DESC`,
            [req.userId]
        );
        res.json({ conversations: result.rows });
    } catch (err) {
        console.error('Get conversations error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/messages/:userId - get messages thread with a specific user
router.get('/messages/:userId', verifyToken, async (req, res) => {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });
    try {
        const result = await pool.query(
            `SELECT m.*, s.name AS sender_name
             FROM messages m
             JOIN users s ON m.sender_id = s.id
             WHERE (m.sender_id = $1 AND m.recipient_id = $2)
                OR (m.sender_id = $2 AND m.recipient_id = $1)
             ORDER BY m.created_at ASC
             LIMIT $3 OFFSET $4`,
            [req.userId, userId, parseInt(limit), parseInt(offset)]
        );
        // Mark messages from the other user as read
        await pool.query(
            `UPDATE messages SET is_read = true
             WHERE sender_id = $1 AND recipient_id = $2 AND is_read = false`,
            [userId, req.userId]
        );
        res.json({ messages: result.rows });
    } catch (err) {
        console.error('Get messages error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/messages - send a message
router.post('/messages', verifyToken, async (req, res) => {
    const { recipient_id, content } = req.body;
    if (!recipient_id || !content?.trim()) {
        return res.status(400).json({ error: 'recipient_id and content are required' });
    }
    if (Number(recipient_id) === req.userId) {
        return res.status(400).json({ error: 'Cannot send message to yourself' });
    }
    try {
        const recipientCheck = await pool.query('SELECT id FROM users WHERE id = $1', [recipient_id]);
        if (!recipientCheck.rows[0]) {
            return res.status(404).json({ error: 'Recipient not found' });
        }
        const insert = await pool.query(
            `INSERT INTO messages (sender_id, recipient_id, content)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [req.userId, recipient_id, content.trim()]
        );
        const withSender = await pool.query(
            `SELECT m.*, u.name AS sender_name FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.id = $1`,
            [insert.rows[0].id]
        );
        res.status(201).json({ message: withSender.rows[0] });
    } catch (err) {
        console.error('Send message error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
