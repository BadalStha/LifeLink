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

const verifyAdminToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: 'No admin token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid or expired admin token' });
        }

        if (!decoded.isAdmin && decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        req.adminId = decoded.adminId || decoded.userId || null;
        req.adminEmail = decoded.email || null;
        next();
    });
};

const ensureAdminTables = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_user_reviews (
            user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            review_note TEXT,
            reviewed_by VARCHAR(255),
            reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS notification_templates (
            id SERIAL PRIMARY KEY,
            template_key VARCHAR(100) UNIQUE NOT NULL,
            subject VARCHAR(255) NOT NULL,
            body TEXT NOT NULL,
            channel VARCHAR(20) NOT NULL DEFAULT 'email',
            updated_by VARCHAR(255),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS notification_logs (
            id SERIAL PRIMARY KEY,
            channel VARCHAR(20) NOT NULL,
            target_audience VARCHAR(50),
            subject VARCHAR(255),
            message TEXT NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'sent',
            created_by VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_settings (
            key VARCHAR(100) PRIMARY KEY,
            value TEXT NOT NULL,
            updated_by VARCHAR(255),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(
        `INSERT INTO notification_templates (template_key, subject, body, channel)
         VALUES
         ('emergency_blood', 'Emergency Blood Requirement', 'Urgent need for {blood_type} donors at {location}.', 'sms'),
         ('campaign_awareness', 'Donate and Save Lives', 'Join our upcoming donation drive this week.', 'email')
         ON CONFLICT (template_key) DO NOTHING`
    );

    await pool.query(
        `INSERT INTO admin_settings (key, value)
         VALUES
         ('require_donor_verification', 'true'),
         ('require_hospital_verification', 'true'),
         ('default_broadcast_channel', 'email')
         ON CONFLICT (key) DO NOTHING`
    );
};

router.use(verifyAdminToken);

router.get('/overview', async (req, res) => {
    try {
        await ensureAdminTables();

        const [
            donorCount,
            recipientCount,
            activeReqCount,
            fulfilledReqCount,
            bloodDistribution,
            organDistribution,
            locationDistribution,
            weeklyStats,
            monthlyStats
        ] = await Promise.all([
            pool.query(`SELECT COUNT(*)::int AS total FROM users WHERE role = 'user'`),
            pool.query(`SELECT COUNT(*)::int AS total FROM users WHERE role = 'patient'`),
            pool.query(`SELECT COUNT(*)::int AS total FROM donation_requests WHERE status = 'open'`),
            pool.query(`SELECT COUNT(*)::int AS total FROM donation_requests WHERE status = 'fulfilled'`),
            pool.query(`
                SELECT COALESCE(blood_type, 'Unknown') AS blood_type, COUNT(*)::int AS count
                FROM users
                WHERE role = 'user'
                GROUP BY blood_type
                ORDER BY count DESC
            `),
            pool.query(`
                SELECT organ_type, COUNT(*)::int AS count
                FROM organ_donations
                GROUP BY organ_type
                ORDER BY count DESC
            `),
            pool.query(`
                SELECT COALESCE(city, 'Unknown') AS city, COUNT(*)::int AS count
                FROM users
                WHERE role = 'user'
                GROUP BY city
                ORDER BY count DESC
                LIMIT 20
            `),
            pool.query(`
                SELECT TO_CHAR(date_trunc('week', created_at), 'IYYY-"W"IW') AS period, COUNT(*)::int AS donations
                FROM blood_donations
                GROUP BY 1
                ORDER BY period DESC
                LIMIT 12
            `),
            pool.query(`
                SELECT TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') AS period, COUNT(*)::int AS donations
                FROM blood_donations
                GROUP BY 1
                ORDER BY period DESC
                LIMIT 12
            `)
        ]);

        res.json({
            stats: {
                total_donors: donorCount.rows[0].total,
                total_recipients: recipientCount.rows[0].total,
                requests_pending: activeReqCount.rows[0].total,
                requests_fulfilled: fulfilledReqCount.rows[0].total
            },
            blood_group_distribution: bloodDistribution.rows,
            organ_type_distribution: organDistribution.rows,
            donor_location_distribution: locationDistribution.rows,
            weekly_donation_stats: weeklyStats.rows,
            monthly_donation_stats: monthlyStats.rows
        });
    } catch (err) {
        console.error('Admin overview error:', err);
        res.status(500).json({ error: 'Failed to load admin overview' });
    }
});

router.get('/users', async (req, res) => {
    const { role = '', search = '', status = '', limit = 50, offset = 0 } = req.query;

    try {
        await ensureAdminTables();

        let query = `
            SELECT
                u.id,
                u.name,
                u.email,
                u.role,
                u.blood_type,
                u.city,
                u.phone,
                u.medical_history,
                u.is_active,
                u.created_at,
                COALESCE(r.status, 'pending') AS verification_status,
                r.review_note,
                r.reviewed_by,
                r.reviewed_at
            FROM users u
            LEFT JOIN admin_user_reviews r ON r.user_id = u.id
            WHERE u.role != 'admin'
        `;
        const params = [];
        let idx = 1;

        if (role) {
            query += ` AND u.role = $${idx++}`;
            params.push(role);
        }

        if (search) {
            query += ` AND (LOWER(COALESCE(u.name, '')) LIKE LOWER($${idx}) OR LOWER(u.email) LIKE LOWER($${idx}))`;
            params.push(`%${search}%`);
            idx++;
        }

        if (status === 'active') {
            query += ` AND u.is_active = true`;
        } else if (status === 'inactive') {
            query += ` AND u.is_active = false`;
        }

        query += ` ORDER BY u.created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
        params.push(Number(limit), Number(offset));

        const result = await pool.query(query, params);
        res.json({ users: result.rows, count: result.rows.length });
    } catch (err) {
        console.error('Admin users list error:', err);
        res.status(500).json({ error: 'Failed to load users' });
    }
});

router.get('/users/:id/profile', async (req, res) => {
    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user id' });
    }

    try {
        const [profile, requests, bloodHistory, organHistory] = await Promise.all([
            pool.query(
                `SELECT id, name, email, role, phone, city, address, blood_type, age, medical_history, is_active, created_at
                 FROM users WHERE id = $1`,
                [userId]
            ),
            pool.query(
                `SELECT id, request_type, blood_type, organ_type, urgency, status, location, created_at
                 FROM donation_requests WHERE requester_id = $1 ORDER BY created_at DESC LIMIT 20`,
                [userId]
            ),
            pool.query(
                `SELECT id, blood_type, units, location, donation_date, status
                 FROM blood_donations WHERE donor_id = $1 ORDER BY donation_date DESC LIMIT 20`,
                [userId]
            ),
            pool.query(
                `SELECT id, organ_type, blood_type, donation_date, status
                 FROM organ_donations WHERE donor_id = $1 ORDER BY donation_date DESC LIMIT 20`,
                [userId]
            )
        ]);

        if (!profile.rows[0]) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user: profile.rows[0],
            requests: requests.rows,
            blood_donations: bloodHistory.rows,
            organ_donations: organHistory.rows
        });
    } catch (err) {
        console.error('Admin user profile error:', err);
        res.status(500).json({ error: 'Failed to load user profile' });
    }
});

router.patch('/users/:id/verification', async (req, res) => {
    const userId = Number(req.params.id);
    const { status, review_note = '' } = req.body;

    if (Number.isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user id' });
    }

    if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ error: 'Invalid verification status' });
    }

    try {
        await ensureAdminTables();

        const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (!userResult.rows[0]) {
            return res.status(404).json({ error: 'User not found' });
        }

        await pool.query(
            `INSERT INTO admin_user_reviews (user_id, status, review_note, reviewed_by, reviewed_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id)
             DO UPDATE SET
                status = EXCLUDED.status,
                review_note = EXCLUDED.review_note,
                reviewed_by = EXCLUDED.reviewed_by,
                reviewed_at = CURRENT_TIMESTAMP`,
            [userId, status, review_note, req.adminEmail || 'admin']
        );

        res.json({ message: 'Verification status updated' });
    } catch (err) {
        console.error('Admin verify user error:', err);
        res.status(500).json({ error: 'Failed to update verification' });
    }
});

router.patch('/users/:id/account-status', async (req, res) => {
    const userId = Number(req.params.id);
    const { is_active } = req.body;

    if (Number.isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user id' });
    }

    if (typeof is_active !== 'boolean') {
        return res.status(400).json({ error: 'is_active must be boolean' });
    }

    try {
        const result = await pool.query(
            'UPDATE users SET is_active = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, is_active',
            [userId, is_active]
        );

        if (!result.rows[0]) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User account status updated', user: result.rows[0] });
    } catch (err) {
        console.error('Admin update account status error:', err);
        res.status(500).json({ error: 'Failed to update account status' });
    }
});

router.get('/requests', async (req, res) => {
    const { status = '', request_type = '', urgency = '', limit = 100, offset = 0 } = req.query;

    try {
        let query = `
            SELECT dr.*, u.name AS requester_name, u.email AS requester_email
            FROM donation_requests dr
            LEFT JOIN users u ON dr.requester_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let idx = 1;

        if (status) {
            query += ` AND dr.status = $${idx++}`;
            params.push(status);
        }

        if (request_type) {
            query += ` AND dr.request_type = $${idx++}`;
            params.push(request_type);
        }

        if (urgency) {
            query += ` AND dr.urgency = $${idx++}`;
            params.push(urgency);
        }

        query += ` ORDER BY dr.created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
        params.push(Number(limit), Number(offset));

        const result = await pool.query(query, params);
        res.json({ requests: result.rows, count: result.rows.length });
    } catch (err) {
        console.error('Admin requests list error:', err);
        res.status(500).json({ error: 'Failed to load requests' });
    }
});

router.patch('/requests/:id/status', async (req, res) => {
    const requestId = Number(req.params.id);
    const { status } = req.body;

    if (Number.isNaN(requestId)) {
        return res.status(400).json({ error: 'Invalid request id' });
    }

    if (!['open', 'fulfilled', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const result = await pool.query(
            `UPDATE donation_requests
             SET status = $2,
                 fulfillment_date = CASE WHEN $2 = 'fulfilled' THEN CURRENT_DATE ELSE fulfillment_date END,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [requestId, status]
        );

        if (!result.rows[0]) {
            return res.status(404).json({ error: 'Request not found' });
        }

        res.json({ message: 'Request status updated', request: result.rows[0] });
    } catch (err) {
        console.error('Admin request status update error:', err);
        res.status(500).json({ error: 'Failed to update request status' });
    }
});

router.post('/requests/:id/match', async (req, res) => {
    const requestId = Number(req.params.id);
    const { donor_id } = req.body;

    if (Number.isNaN(requestId) || Number.isNaN(Number(donor_id))) {
        return res.status(400).json({ error: 'Invalid request or donor id' });
    }

    try {
        const [requestResult, donorResult] = await Promise.all([
            pool.query(
                `SELECT dr.*, u.name AS requester_name
                 FROM donation_requests dr
                 LEFT JOIN users u ON dr.requester_id = u.id
                 WHERE dr.id = $1`,
                [requestId]
            ),
            pool.query(
                `SELECT id, name, email, blood_type, city, is_active
                 FROM users WHERE id = $1 AND role = 'user'`,
                [donor_id]
            )
        ]);

        if (!requestResult.rows[0]) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (!donorResult.rows[0]) {
            return res.status(404).json({ error: 'Donor not found' });
        }

        await pool.query(
            `INSERT INTO alerts (created_by, alert_type, message, urgency, target_audience, related_request_id)
             VALUES (NULL, 'donation_available', $1, $2, 'specific_user', $3)`,
            [
                `Admin matched donor ${donorResult.rows[0].name || donorResult.rows[0].email} for request #${requestId}`,
                requestResult.rows[0].urgency || 'medium',
                requestId
            ]
        );

        res.json({
            message: 'Donor matched successfully',
            request: requestResult.rows[0],
            donor: donorResult.rows[0]
        });
    } catch (err) {
        console.error('Admin donor match error:', err);
        res.status(500).json({ error: 'Failed to match donor' });
    }
});

router.get('/hospitals', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT h.*, u.name AS admin_name, u.email AS admin_email
             FROM hospitals h
             LEFT JOIN users u ON h.admin_id = u.id
             ORDER BY h.created_at DESC`
        );
        res.json({ hospitals: result.rows, count: result.rows.length });
    } catch (err) {
        console.error('Admin hospitals list error:', err);
        res.status(500).json({ error: 'Failed to load hospitals' });
    }
});

router.patch('/hospitals/:id/status', async (req, res) => {
    const hospitalId = Number(req.params.id);
    const { is_active } = req.body;

    if (Number.isNaN(hospitalId)) {
        return res.status(400).json({ error: 'Invalid hospital id' });
    }

    if (typeof is_active !== 'boolean') {
        return res.status(400).json({ error: 'is_active must be boolean' });
    }

    try {
        const result = await pool.query(
            `UPDATE hospitals
             SET is_active = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [hospitalId, is_active]
        );

        if (!result.rows[0]) {
            return res.status(404).json({ error: 'Hospital not found' });
        }

        res.json({ message: 'Hospital status updated', hospital: result.rows[0] });
    } catch (err) {
        console.error('Admin hospital status update error:', err);
        res.status(500).json({ error: 'Failed to update hospital status' });
    }
});

router.put('/hospitals/:id', async (req, res) => {
    const hospitalId = Number(req.params.id);
    const { name, phone, email, city, address, location } = req.body;

    if (Number.isNaN(hospitalId)) {
        return res.status(400).json({ error: 'Invalid hospital id' });
    }

    try {
        const result = await pool.query(
            `UPDATE hospitals
             SET name = COALESCE($2, name),
                 phone = COALESCE($3, phone),
                 email = COALESCE($4, email),
                 city = COALESCE($5, city),
                 address = COALESCE($6, address),
                 location = COALESCE($7, location),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [hospitalId, name, phone, email, city, address, location]
        );

        if (!result.rows[0]) {
            return res.status(404).json({ error: 'Hospital not found' });
        }

        res.json({ message: 'Hospital profile updated', hospital: result.rows[0] });
    } catch (err) {
        console.error('Admin hospital update error:', err);
        res.status(500).json({ error: 'Failed to update hospital profile' });
    }
});

router.post('/broadcast', async (req, res) => {
    const {
        message,
        urgency = 'high',
        target_audience = 'all_users',
        channel = 'email',
        subject = 'Emergency Alert'
    } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'message is required' });
    }

    try {
        await ensureAdminTables();

        const alertResult = await pool.query(
            `INSERT INTO alerts (created_by, alert_type, message, urgency, target_audience)
             VALUES (NULL, 'system_alert', $1, $2, $3)
             RETURNING *`,
            [message, urgency, target_audience]
        );

        await pool.query(
            `INSERT INTO notification_logs (channel, target_audience, subject, message, status, created_by)
             VALUES ($1, $2, $3, $4, 'sent', $5)`,
            [channel, target_audience, subject, message, req.adminEmail || 'admin']
        );

        res.status(201).json({ message: 'Emergency broadcast sent', alert: alertResult.rows[0] });
    } catch (err) {
        console.error('Admin broadcast error:', err);
        res.status(500).json({ error: 'Failed to send broadcast' });
    }
});

router.get('/notification-templates', async (req, res) => {
    try {
        await ensureAdminTables();
        const result = await pool.query('SELECT * FROM notification_templates ORDER BY template_key ASC');
        res.json({ templates: result.rows });
    } catch (err) {
        console.error('Admin templates list error:', err);
        res.status(500).json({ error: 'Failed to load templates' });
    }
});

router.put('/notification-templates/:templateKey', async (req, res) => {
    const { templateKey } = req.params;
    const { subject, body, channel = 'email' } = req.body;

    if (!subject || !body) {
        return res.status(400).json({ error: 'subject and body are required' });
    }

    try {
        await ensureAdminTables();

        const result = await pool.query(
            `INSERT INTO notification_templates (template_key, subject, body, channel, updated_by, updated_at)
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
             ON CONFLICT (template_key)
             DO UPDATE SET
                subject = EXCLUDED.subject,
                body = EXCLUDED.body,
                channel = EXCLUDED.channel,
                updated_by = EXCLUDED.updated_by,
                updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [templateKey, subject, body, channel, req.adminEmail || 'admin']
        );

        res.json({ message: 'Template saved', template: result.rows[0] });
    } catch (err) {
        console.error('Admin template update error:', err);
        res.status(500).json({ error: 'Failed to save template' });
    }
});

router.get('/notification-logs', async (req, res) => {
    const { limit = 100, offset = 0 } = req.query;

    try {
        await ensureAdminTables();
        const result = await pool.query(
            `SELECT * FROM notification_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
            [Number(limit), Number(offset)]
        );

        res.json({ logs: result.rows, count: result.rows.length });
    } catch (err) {
        console.error('Admin logs list error:', err);
        res.status(500).json({ error: 'Failed to load notification logs' });
    }
});

router.get('/announcements', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT a.*, u.name AS author_name
             FROM announcements a
             LEFT JOIN users u ON a.created_by = u.id
             ORDER BY a.created_at DESC`
        );

        res.json({ announcements: result.rows });
    } catch (err) {
        console.error('Admin announcements list error:', err);
        res.status(500).json({ error: 'Failed to load announcements' });
    }
});

router.post('/announcements', async (req, res) => {
    const { title, content, image_url = null, is_published = true } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'title and content are required' });
    }

    try {
        const fallbackAdmin = await pool.query(
            `SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1`
        );

        const createdBy = fallbackAdmin.rows[0]?.id || 1;

        const result = await pool.query(
            `INSERT INTO announcements (created_by, title, content, image_url, is_published)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [createdBy, title, content, image_url, is_published]
        );

        res.status(201).json({ message: 'Announcement published', announcement: result.rows[0] });
    } catch (err) {
        console.error('Admin create announcement error:', err);
        res.status(500).json({ error: 'Failed to create announcement' });
    }
});

router.delete('/announcements/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Invalid announcement id' });
    }

    try {
        const result = await pool.query('DELETE FROM announcements WHERE id = $1 RETURNING id', [id]);
        if (!result.rows[0]) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        res.json({ message: 'Announcement removed' });
    } catch (err) {
        console.error('Admin delete announcement error:', err);
        res.status(500).json({ error: 'Failed to delete announcement' });
    }
});

router.get('/reports/export', async (req, res) => {
    const { type = 'donors' } = req.query;

    try {
        let rows = [];
        let headers = [];

        if (type === 'donors') {
            const result = await pool.query(
                `SELECT id, name, email, phone, city, blood_type, is_active, created_at
                 FROM users WHERE role = 'user' ORDER BY created_at DESC`
            );
            rows = result.rows;
            headers = ['id', 'name', 'email', 'phone', 'city', 'blood_type', 'is_active', 'created_at'];
        } else if (type === 'recipients') {
            const result = await pool.query(
                `SELECT id, name, email, phone, city, blood_type, medical_history, is_active, created_at
                 FROM users WHERE role = 'patient' ORDER BY created_at DESC`
            );
            rows = result.rows;
            headers = ['id', 'name', 'email', 'phone', 'city', 'blood_type', 'medical_history', 'is_active', 'created_at'];
        } else {
            const result = await pool.query(
                `SELECT dr.id, dr.request_type, dr.blood_type, dr.organ_type, dr.urgency, dr.status, dr.created_at, u.name AS requester_name
                 FROM donation_requests dr
                 LEFT JOIN users u ON u.id = dr.requester_id
                 ORDER BY dr.created_at DESC`
            );
            rows = result.rows;
            headers = ['id', 'request_type', 'blood_type', 'organ_type', 'urgency', 'status', 'created_at', 'requester_name'];
        }

        const csvLines = [
            headers.join(','),
            ...rows.map((row) =>
                headers
                    .map((h) => {
                        const value = row[h] == null ? '' : String(row[h]);
                        return `"${value.replace(/"/g, '""')}"`;
                    })
                    .join(',')
            )
        ];

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${type}_report.csv`);
        res.send(csvLines.join('\n'));
    } catch (err) {
        console.error('Admin export report error:', err);
        res.status(500).json({ error: 'Failed to export report' });
    }
});

router.get('/settings', async (req, res) => {
    try {
        await ensureAdminTables();
        const settingsResult = await pool.query('SELECT key, value, updated_by, updated_at FROM admin_settings ORDER BY key ASC');

        const adminsResult = await pool.query(
            `SELECT id, name, email, is_active, created_at
             FROM users WHERE role = 'admin' ORDER BY created_at DESC`
        );

        const settings = settingsResult.rows.reduce((acc, row) => {
            acc[row.key] = row.value;
            return acc;
        }, {});

        res.json({ settings, admin_accounts: adminsResult.rows });
    } catch (err) {
        console.error('Admin settings get error:', err);
        res.status(500).json({ error: 'Failed to load system settings' });
    }
});

router.put('/settings', async (req, res) => {
    const { settings = {} } = req.body;

    try {
        await ensureAdminTables();

        const entries = Object.entries(settings);
        for (const [key, value] of entries) {
            await pool.query(
                `INSERT INTO admin_settings (key, value, updated_by, updated_at)
                 VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                 ON CONFLICT (key)
                 DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = CURRENT_TIMESTAMP`,
                [key, String(value), req.adminEmail || 'admin']
            );
        }

        res.json({ message: 'System settings updated' });
    } catch (err) {
        console.error('Admin settings update error:', err);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;