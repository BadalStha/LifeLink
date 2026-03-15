import express from 'express';
import pool from '../db.js';
import { verifyToken } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer config for avatar uploads
const avatarsDir = path.join(__dirname, '../uploads/avatars');
fs.mkdirSync(avatarsDir, { recursive: true });

const avatarStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, avatarsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, `user-${req.userId}-${Date.now()}${ext}`);
    },
});

const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (/^image\/(jpeg|jpg|png|webp|gif)$/.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, PNG, WebP) are allowed'));
        }
    },
});

// POST /api/profile/avatar - Upload profile picture
router.post('/profile/avatar', verifyToken, uploadAvatar.single('avatar'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
    }

    const profilePicturePath = `/uploads/avatars/${req.file.filename}`;

    try {
        // Delete old avatar file if it exists (best-effort cleanup)
        const existing = await pool.query('SELECT profile_picture FROM users WHERE id = $1', [req.userId]);
        const oldPath = existing.rows[0]?.profile_picture;
        if (oldPath) {
            fs.unlink(path.join(__dirname, '..', oldPath), () => {});
        }

        const result = await pool.query(
            'UPDATE users SET profile_picture = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING profile_picture',
            [profilePicturePath, req.userId]
        );

        res.json({ message: 'Profile picture updated', profile_picture: result.rows[0].profile_picture });
    } catch (err) {
        console.error('Avatar upload error:', err);
        res.status(500).json({ error: 'Failed to save profile picture' });
    }
});

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
             RETURNING id, email, role, name, phone, address, city, state, country, blood_type, age, medical_history, donation_type, donation_organ, profile_picture`,
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

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const result = await pool.query(
            `SELECT id, email, role, name, phone, address, city, state, country, blood_type, age,
                    donation_type, donation_organ, medical_history, profile_picture, is_active, created_at
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

// GET /api/users/:userId/donation-history - Get public donation history for a donor
router.get('/users/:userId/donation-history', async (req, res) => {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

    try {
        const userResult = await pool.query(
            `SELECT id FROM users WHERE id = $1 AND is_active = true`,
            [userId]
        );

        if (!userResult.rows[0]) {
            return res.status(404).json({ error: 'User not found' });
        }

        const bloodDonations = await pool.query(
            `SELECT
                bd.id,
                bd.donation_date,
                bd.location as hospital_name,
                bd.blood_type,
                NULL::text as organ_type,
                'Blood' as donation_type,
                bd.status,
                bd.created_at
             FROM blood_donations bd
             WHERE bd.donor_id = $1
             ORDER BY bd.donation_date DESC
             LIMIT $2`,
            [userId, parsedLimit]
        );

        const organDonations = await pool.query(
            `SELECT
                od.id,
                od.donation_date,
                NULL::text as hospital_name,
                od.blood_type,
                od.organ_type,
                'Organ' as donation_type,
                od.status,
                od.created_at
             FROM organ_donations od
             WHERE od.donor_id = $1
             ORDER BY od.donation_date DESC
             LIMIT $2`,
            [userId, parsedLimit]
        );

        const history = [
            ...bloodDonations.rows,
            ...organDonations.rows
        ]
            .sort((a, b) => new Date(b.donation_date) - new Date(a.donation_date))
            .slice(0, parsedLimit);

        res.json({ history });
    } catch (err) {
        console.error('Get public donation history error:', err);
        res.status(500).json({ error: 'Server error fetching donation history' });
    }
});

// GET /api/search - Search for users by blood type, role, city, organ type
router.get('/search', async (req, res) => {
    const { blood_type, role, city, organ_type, ready_to_donate, limit = 20, offset = 0, search } = req.query;

    // Extract userId from token if provided (to exclude current user from results)
    let currentUserId = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
        try {
            const token = authHeader.split(' ')[1];
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_change_this');
                currentUserId = decoded.userId;
            }
        } catch (err) {
            // Token invalid or expired, that's okay - just proceed without filtering
        }
    }

    try {
        let query = `SELECT id, email, role, name, city, blood_type, age, donation_type, donation_organ AS organ_type, is_active, created_at, profile_picture, phone, address, state, country, medical_history
                     FROM users
                     WHERE is_active = true`;
        const params = [];
        let paramCount = 1;

        // Exclude current user from search results
        if (currentUserId) {
            query += ` AND id != $${paramCount}`;
            params.push(currentUserId);
            paramCount++;
        }

        if (ready_to_donate === 'true') {
            query += ` AND donation_type IS NOT NULL`;
        }

        if (search) {
            query += ` AND LOWER(name) LIKE LOWER($${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

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
        const bloodDonations = await pool.query(
            `SELECT COUNT(*) as count FROM blood_donations WHERE donor_id = $1`,
            [req.userId]
        );

        const organDonations = await pool.query(
            `SELECT COUNT(*) as count FROM organ_donations WHERE donor_id = $1`,
            [req.userId]
        );

        const requestsCreated = await pool.query(
            `SELECT COUNT(*) as count FROM donation_requests WHERE requester_id = $1`,
            [req.userId]
        );

        const totalDonations = parseInt(bloodDonations.rows[0].count) + parseInt(organDonations.rows[0].count);

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

// GET /api/user/notifications - Get notifications for current user
router.get('/user/notifications', verifyToken, async (req, res) => {
    const { limit = 20 } = req.query;
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

    try {
        const userResult = await pool.query(
            `SELECT blood_type FROM users WHERE id = $1`,
            [req.userId]
        );

        const userBloodType = userResult.rows[0]?.blood_type || null;

        const unreadMessagesResult = await pool.query(
            `SELECT
                m.id,
                m.sender_id,
                s.name AS sender_name,
                m.content,
                m.created_at,
                m.is_read
             FROM messages m
             JOIN users s ON s.id = m.sender_id
             WHERE m.recipient_id = $1
             ORDER BY m.created_at DESC
             LIMIT $2`,
            [req.userId, parsedLimit]
        );

        const adminAlertsResult = await pool.query(
            `SELECT
                a.id,
                a.alert_type,
                a.message,
                a.urgency,
                a.target_audience,
                a.blood_type_target,
                a.created_at
             FROM alerts a
             JOIN users u ON u.id = a.created_by
             WHERE u.role = 'admin'
               AND (
                    a.alert_type IN ('blood_needed', 'donation_available')
                    OR LOWER(a.message) LIKE '%blood%'
               )
               AND (
                    a.target_audience IS NULL
                    OR a.target_audience = 'all_users'
                    OR (
                        a.target_audience = 'specific_blood_type'
                        AND LOWER(COALESCE(a.blood_type_target, '')) = LOWER($2::text)
                    )
               )
             ORDER BY a.created_at DESC
             LIMIT $1`,
            [parsedLimit, userBloodType]
        );

        const myRequestsResult = await pool.query(
            `SELECT
                id,
                request_type,
                blood_type,
                organ_type,
                urgency,
                status,
                created_at
             FROM donation_requests
             WHERE requester_id = $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [req.userId, parsedLimit]
        );

        const requestAlertsResult = await pool.query(
            `SELECT
                a.id,
                a.message,
                a.urgency,
                a.created_at,
                a.related_request_id,
                dr.request_type,
                dr.blood_type,
                dr.organ_type,
                dr.status,
                dr.location,
                u.name AS requester_name
             FROM alerts a
             JOIN donation_requests dr ON dr.id = a.related_request_id
             JOIN users u ON u.id = dr.requester_id
             WHERE a.related_request_id IS NOT NULL
                 AND dr.requester_id != $1
                 AND dr.status = 'open'
             ORDER BY a.created_at DESC
             LIMIT $2`,
            [req.userId, parsedLimit]
        );

        const otherOpenRequestsResult = await pool.query(
            `SELECT
                dr.id,
                dr.request_type,
                dr.blood_type,
                dr.organ_type,
                dr.urgency,
                dr.status,
                dr.location,
                dr.created_at,
                u.name AS requester_name
             FROM donation_requests dr
             JOIN users u ON u.id = dr.requester_id
             WHERE dr.requester_id != $1
                 AND dr.status = 'open'
             ORDER BY dr.created_at DESC
             LIMIT $2`,
            [req.userId, parsedLimit]
        );

        const messageNotifications = unreadMessagesResult.rows.map((row) => ({
            id: `msg-${row.id}`,
            type: 'message',
            title: `New message from ${row.sender_name || 'User'}`,
            body: row.content,
            created_at: row.created_at,
            is_unread: row.is_read === false,
            reference_id: row.sender_id
        }));

        const alertNotifications = adminAlertsResult.rows.map((row) => ({
            id: `alert-${row.id}`,
            type: 'alert',
            title: 'Admin Blood Campaign Alert',
            body: row.message,
            created_at: row.created_at,
            is_unread: true,
            urgency: row.urgency,
            reference_id: row.id
        }));

        const requestNotifications = myRequestsResult.rows.map((row) => {
            const requestLabel = row.request_type === 'blood'
                ? `Blood request${row.blood_type ? ` (${row.blood_type})` : ''}`
                : `Organ request${row.organ_type ? ` (${row.organ_type})` : ''}`;

            return {
                id: `request-${row.id}`,
                type: 'request',
                title: 'Request Help Submitted',
                body: `${requestLabel} is ${row.status}. Urgency: ${row.urgency}.`,
                created_at: row.created_at,
                is_unread: true,
                urgency: row.urgency,
                reference_id: row.id
            };
        });

        const communityRequestNotifications = requestAlertsResult.rows.map((row) => {
            const requestLabel = row.request_type === 'blood'
                ? `Blood request${row.blood_type ? ` (${row.blood_type})` : ''}`
                : `Organ request${row.organ_type ? ` (${row.organ_type})` : ''}`;

            return {
                id: `community-request-${row.related_request_id || row.id}`,
                type: 'request',
                title: `New Help Request from ${row.requester_name || 'User'}`,
                body: row.message || `${requestLabel} • Urgency: ${row.urgency}${row.location ? ` • ${row.location}` : ''}`,
                created_at: row.created_at,
                is_unread: true,
                urgency: row.urgency,
                reference_id: row.related_request_id || row.id
            };
        });

        const fallbackCommunityRequestNotifications = otherOpenRequestsResult.rows.map((row) => {
            const requestLabel = row.request_type === 'blood'
                ? `Blood request${row.blood_type ? ` (${row.blood_type})` : ''}`
                : `Organ request${row.organ_type ? ` (${row.organ_type})` : ''}`;

            return {
                id: `community-request-fallback-${row.id}`,
                type: 'request',
                title: `New Help Request from ${row.requester_name || 'User'}`,
                body: `${requestLabel} • Urgency: ${row.urgency}${row.location ? ` • ${row.location}` : ''}`,
                created_at: row.created_at,
                is_unread: true,
                urgency: row.urgency,
                reference_id: row.id
            };
        });

        const requestNotificationMap = new Map();
        [...communityRequestNotifications, ...fallbackCommunityRequestNotifications].forEach((item) => {
            const key = String(item.reference_id);
            if (!requestNotificationMap.has(key)) {
                requestNotificationMap.set(key, item);
            }
        });
        const mergedCommunityRequestNotifications = Array.from(requestNotificationMap.values());

        const notifications = [
            ...messageNotifications,
            ...alertNotifications,
            ...requestNotifications,
            ...mergedCommunityRequestNotifications
        ]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, parsedLimit);

        const unread_count = notifications.filter((item) => item.is_unread).length;

        res.json({
            notifications,
            unread_count,
            counts: {
                messages: messageNotifications.filter((item) => item.is_unread).length,
                alerts: alertNotifications.length,
                requests: requestNotifications.length + mergedCommunityRequestNotifications.length
            }
        });
    } catch (err) {
        console.error('Get user notifications error:', err);
        res.status(500).json({ error: 'Server error fetching notifications' });
    }
});

export default router;
