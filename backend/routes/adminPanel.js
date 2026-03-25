import bcrypt from 'bcrypt';
import express from 'express';
import nodemailer from 'nodemailer';
import pool from '../db.js';
import { verifyAdminToken } from '../middleware/auth.js';

const router = express.Router();

const mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

export const ensureAdminTables = async () => {
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
        CREATE TABLE IF NOT EXISTS user_kyc (
            user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            document_type VARCHAR(50) NOT NULL,
            document_number VARCHAR(100) NOT NULL,
            issued_date DATE,
            issued_district VARCHAR(100),
            gender VARCHAR(20),
            father_name VARCHAR(255),
            grandfather_name VARCHAR(255),
            occupation VARCHAR(100),
            marital_status VARCHAR(50),
            permanent_address TEXT,
            current_address TEXT,
            front_image VARCHAR(255) NOT NULL,
            back_image VARCHAR(255),
            selfie_image VARCHAR(255) NOT NULL,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Ensure all columns exist for existing tables
    const kycColumns = [
        ['gender', 'VARCHAR(20)'],
        ['father_name', 'VARCHAR(255)'],
        ['grandfather_name', 'VARCHAR(255)'],
        ['occupation', 'VARCHAR(100)'],
        ['marital_status', 'VARCHAR(50)'],
        ['permanent_address', 'TEXT'],
        ['current_address', 'TEXT']
    ];

    for (const [col, type] of kycColumns) {
        await pool.query(`ALTER TABLE user_kyc ADD COLUMN IF NOT EXISTS ${col} ${type}`).catch(() => {});
    }

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
            channel VARCHAR(100) NOT NULL,
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

    await pool.query(`ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    await pool.query(`ALTER TABLE donation_requests ADD COLUMN IF NOT EXISTS fulfillment_date DATE`);
    await pool.query(`ALTER TABLE alerts ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP`);
    await pool.query(`ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP`);
    await pool.query(`ALTER TABLE notification_logs ALTER COLUMN channel TYPE VARCHAR(100)`);
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
    const { role = '', search = '', status = '', verification = '', limit = 50, offset = 0 } = req.query;

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
                (k.user_id IS NOT NULL) AS has_kyc,
                COALESCE(r.status, 'pending') AS verification_status,
                r.review_note,
                r.reviewed_by,
                r.reviewed_at
            FROM users u
            LEFT JOIN admin_user_reviews r ON r.user_id = u.id
            LEFT JOIN user_kyc k ON k.user_id = u.id
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

        if (verification === 'pending') {
            query += ` AND k.user_id IS NOT NULL AND COALESCE(r.status, 'pending') = 'pending'`;
        } else if (verification === 'approved') {
            query += ` AND COALESCE(r.status, 'pending') = 'approved'`;
        } else if (verification === 'rejected') {
            query += ` AND COALESCE(r.status, 'pending') = 'rejected'`;
        } else if (verification === 'awaiting_submission') {
            query += ` AND k.user_id IS NULL`;
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
        const [profile, requests, bloodHistory, organHistory, kyc] = await Promise.all([
            pool.query(
                `SELECT u.id, u.name, u.email, u.role, u.phone, u.city, u.address, u.blood_type, u.age,
                        u.medical_history, u.is_active, u.created_at,
                        COALESCE(r.status, 'pending') AS verification_status,
                        r.review_note,
                        r.reviewed_by,
                        r.reviewed_at
                 FROM users u
                 LEFT JOIN admin_user_reviews r ON r.user_id = u.id
                 WHERE u.id = $1`,
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
            ),
            pool.query(
                `SELECT k.*, COALESCE(r.status, 'pending') AS verification_status,
                        r.review_note, r.reviewed_by, r.reviewed_at
                 FROM user_kyc k
                 LEFT JOIN admin_user_reviews r ON r.user_id = k.user_id
                 WHERE k.user_id = $1`,
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
            organ_donations: organHistory.rows,
            kyc: kyc.rows[0] || null
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

        if (status === 'approved') {
            const kycResult = await pool.query('SELECT user_id FROM user_kyc WHERE user_id = $1', [userId]);
            if (!kycResult.rows[0]) {
                return res.status(400).json({ error: 'User has not submitted KYC documents' });
            }
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
            `UPDATE donation_requests SET status = $2 WHERE id = $1 RETURNING *`,
            [requestId, status]
        );

        if (!result.rows[0]) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (status === 'cancelled' || status === 'fulfilled') {
            await pool.query(
                `DELETE FROM alerts WHERE related_request_id = $1`,
                [requestId]
            );
        }

        res.json({ message: 'Request status updated', request: result.rows[0] });
    } catch (err) {
        console.error('Admin request status update error:', err);
        res.status(500).json({ error: err.message || 'Failed to update request status' });
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

router.post('/hospitals', async (req, res) => {
    const { name, email, password, phone, city, address, location } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'name, email, and password are required' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userResult = await pool.query(
            'INSERT INTO users (email, password, role, name, phone, city, address) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [normalizedEmail, hashedPassword, 'hospital', name.trim(), phone?.trim() || null, city?.trim() || null, address?.trim() || null]
        );
        const userId = userResult.rows[0].id;

        const hospResult = await pool.query(
            'INSERT INTO hospitals (name, admin_id, phone, email, city, address, location) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name.trim(), userId, phone?.trim() || null, normalizedEmail, city?.trim() || null, address?.trim() || null, location?.trim() || null]
        );

        res.status(201).json({ message: 'Hospital account created', hospital: hospResult.rows[0], userId });
    } catch (err) {
        console.error('Admin create hospital error:', err);
        res.status(500).json({ error: 'Failed to create hospital account' });
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
    const { title, message, expires_at, channels = ['notification', 'email'] } = req.body;

    if (!title || !message) {
        return res.status(400).json({ error: 'title and message are required' });
    }

    const validChannels = ['notification', 'announcement', 'email'];
    const selectedChannels = (Array.isArray(channels) ? channels : []).filter((c) => validChannels.includes(c));
    if (selectedChannels.length === 0) {
        return res.status(400).json({ error: 'at least one valid channel is required (notification, announcement, email)' });
    }

    let resolvedExpiresAt = null;
    if (expires_at) {
        const d = new Date(expires_at);
        if (Number.isNaN(d.getTime())) {
            return res.status(400).json({ error: 'expires_at must be a valid date-time' });
        }
        if (d <= new Date()) {
            return res.status(400).json({ error: 'expires_at must be in the future' });
        }
        resolvedExpiresAt = d.toISOString();
    }

    try {
        await ensureAdminTables();

        // In-app notification alert
        if (selectedChannels.includes('notification')) {
            await pool.query(
                `INSERT INTO alerts (created_by, alert_type, message, urgency, target_audience, expires_at)
                 VALUES (NULL, 'system_alert', $1, 'high', 'all_users', $2)`,
                [`${title}: ${message}`, resolvedExpiresAt]
            );
        }

        // Homepage announcement
        if (selectedChannels.includes('announcement')) {
            const fallbackAdmin = req.adminId
                ? { rows: [{ id: req.adminId }] }
                : await pool.query(`SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1`);
            const createdBy = fallbackAdmin.rows[0]?.id;

            if (!createdBy) {
                return res.status(400).json({ error: 'No admin account found to publish announcement' });
            }

            await pool.query(
                `INSERT INTO announcements (created_by, title, content, is_published)
                 VALUES ($1, $2, $3, true)`,
                [createdBy, title, message]
            );
        }

        // Log the broadcast
        await pool.query(
            `INSERT INTO notification_logs (channel, target_audience, subject, message, status, created_by, expires_at)
             VALUES ($1, 'all_users', $2, $3, 'sent', $4, $5)`,
            [selectedChannels.join(','), title, message, req.adminEmail || 'admin', resolvedExpiresAt]
        );

        // Send emails
        let recipients = 0;
        if (selectedChannels.includes('email')) {
            const usersResult = await pool.query(
                `SELECT email, name FROM users WHERE is_active = true AND role != 'admin'`
            );
            recipients = usersResult.rows.length;

            const emailPromises = usersResult.rows.map((user) =>
                mailer.sendMail({
                    from: process.env.SMTP_FROM,
                    to: user.email,
                    subject: title,
                    text: message,
                    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
                    <h2 style="color:#dc2626">${title}</h2>
                    <p style="color:#374151;line-height:1.6">${message}</p>
                    <hr style="border-color:#e5e7eb;margin:24px 0">
                    <p style="color:#9ca3af;font-size:12px">This message was sent by LifeLink Nepal admin.</p>
                  </div>`,
                }).catch((err) => console.error(`Email failed for ${user.email}:`, err))
            );

            await Promise.all(emailPromises);
        }

        res.status(201).json({ message: 'Broadcast sent', recipients, channels: selectedChannels, expires_at: resolvedExpiresAt });
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

router.delete('/notification-logs', async (req, res) => {
    try {
        await pool.query(`DELETE FROM notification_logs`);
        // Also remove broadcast alerts created from the admin panel (created_by IS NULL, system_alert)
        await pool.query(
            `DELETE FROM alerts WHERE alert_type = 'system_alert' AND created_by IS NULL`
        );
        res.json({ message: 'Broadcast history cleared' });
    } catch (err) {
        console.error('Admin clear logs error:', err);
        res.status(500).json({ error: 'Failed to clear broadcast history' });
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