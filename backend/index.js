import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
import { verifyToken, JWT_SECRET } from './middleware/auth.js';
import errorHandler from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import usersRouter from './routes/users.js';
import requestsRouter from './routes/requests.js';
import dashboardRouter from './routes/dashboard.js';
import alertsRouter from './routes/alerts.js';
import donorsRouter from './routes/donors.js';
import adminAuthRouter from './routes/adminAuth.js';
import adminPanelRouter from './routes/adminPanel.js';
import announcementsRouter from './routes/announcements.js';
import chatRouter from './routes/chat.js';
import hospitalsRouter from './routes/hospitals.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const ensureAdminUser = async () => {
    const adminEmail = 'lifelink.nepal@gmail.com';
    const adminPassword = 'lifelink';

    const existing = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND role = $2',
        [adminEmail, 'admin']
    );

    if (existing.rows.length === 0) {
        const hash = await bcrypt.hash(adminPassword, 10);
        await pool.query(
            'INSERT INTO users (email, password, role, name) VALUES ($1, $2, $3, $4)',
            [adminEmail, hash, 'admin', 'LifeLink Admin']
        );
        console.log('Admin user created');
    }
};

// PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'lifelink_db',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

const ensureAdminUser = async () => {
    const adminEmail = 'lifelink.nepal@gmail.com';
    const adminPassword = 'lifelink';

    const existing = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND role = $2',
        [adminEmail, 'admin']
    );

    if (existing.rows.length === 0) {
        const hash = await bcrypt.hash(adminPassword, 10);
        await pool.query(
            'INSERT INTO users (email, password, role, name) VALUES ($1, $2, $3, $4)',
            [adminEmail, hash, 'admin', 'LifeLink Admin']
        );
        console.log('Admin user created');
    }
};

const ensureSchema = async () => {
    // Create all tables if they don't exist yet (safe on every boot)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL,
            name VARCHAR(255),
            phone VARCHAR(20),
            address TEXT,
            city VARCHAR(100),
            state VARCHAR(100),
            country VARCHAR(100),
            blood_type VARCHAR(10),
            age INT,
            medical_history TEXT,
            donation_type VARCHAR(20),
            donation_organ VARCHAR(50),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS blood_donations (
            id SERIAL PRIMARY KEY,
            donor_id INT NOT NULL,
            blood_type VARCHAR(10) NOT NULL,
            units INT NOT NULL,
            donation_date DATE NOT NULL,
            location VARCHAR(255),
            status VARCHAR(50) DEFAULT 'completed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(donor_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS organ_donations (
            id SERIAL PRIMARY KEY,
            donor_id INT NOT NULL,
            organ_type VARCHAR(50) NOT NULL,
            blood_type VARCHAR(10),
            donation_date DATE NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            recipient_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(donor_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(recipient_id) REFERENCES users(id) ON DELETE SET NULL
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS donation_requests (
            id SERIAL PRIMARY KEY,
            requester_id INT NOT NULL,
            request_type VARCHAR(20) NOT NULL,
            blood_type VARCHAR(10),
            organ_type VARCHAR(50),
            units_needed INT,
            urgency VARCHAR(20) DEFAULT 'medium',
            reason TEXT,
            location VARCHAR(255),
            status VARCHAR(50) DEFAULT 'open',
            fulfillment_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(requester_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS alerts (
            id SERIAL PRIMARY KEY,
            created_by INT,
            alert_type VARCHAR(50) NOT NULL,
            message TEXT NOT NULL,
            urgency VARCHAR(20) DEFAULT 'medium',
            target_audience VARCHAR(50),
            blood_type_target VARCHAR(10),
            organ_type_target VARCHAR(50),
            is_read BOOLEAN DEFAULT false,
            related_request_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY(related_request_id) REFERENCES donation_requests(id) ON DELETE SET NULL
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS announcements (
            id SERIAL PRIMARY KEY,
            created_by INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            image_url TEXT,
            is_published BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            sender_id INT NOT NULL,
            recipient_id INT NOT NULL,
            content TEXT NOT NULL,
            is_read BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(recipient_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS hospitals (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            admin_id INT NOT NULL,
            location TEXT,
            city VARCHAR(100),
            phone VARCHAR(20),
            email VARCHAR(255),
            address TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(admin_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Ensure donation columns exist on older databases that predate the schema update
    await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS donation_type VARCHAR(20)
    `).catch(() => {});
    await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS donation_organ VARCHAR(50)
    `).catch(() => {});
    await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS profile_picture TEXT
    `).catch(() => {});
};

const ensurePasswordResetTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS password_reset_codes (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            email VARCHAR(255) NOT NULL,
            code_hash VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            verified BOOLEAN DEFAULT false,
            consumed BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
};

const buildEmailTransport = () => {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = String(process.env.SMTP_SECURE || 'false') === 'true';

    if (!host || !user || !pass) {
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
    });
};

const sendResetCodeEmail = async (email, accountName, code) => {
    const transport = buildEmailTransport();

    if (!transport) {
        throw new Error('SMTP_NOT_CONFIGURED');
    }

    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
    await transport.sendMail({
        from: fromAddress,
        to: email,
        subject: 'LifeLink Password Reset Code',
        text: `Hello ${accountName},\n\nYour LifeLink password reset code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, you can ignore this email.`,
        html: `
          <p>Hello ${accountName},</p>
          <p>Your LifeLink password reset code is:</p>
          <h2 style="letter-spacing:2px;">${code}</h2>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request this, you can ignore this email.</p>
        `,
    });

    return true;
};

// Test route
app.get('/', (req, res) => {
    res.send('LifeLink Backend running!');
});

// Registration route
app.post('/api/register', async (req, res) => {
    const { email, password, role, name, phone, address, city, blood_type, age } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedRole = role?.trim().toLowerCase();
    const allowedRoles = ['user', 'patient', 'admin', 'hospital'];

    if (!normalizedEmail || !password || !normalizedRole) {
        return res.status(400).json({ error: 'Missing fields: email, password, role' });
    }

    if (!allowedRoles.includes(normalizedRole)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Validate blood type for donors
    const validBloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
    if (normalizedRole === 'user' && blood_type && !validBloodTypes.includes(blood_type)) {
        return res.status(400).json({ error: 'Invalid blood type' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (email, password, role, name, phone, address, city, blood_type, age) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, email, role, name',
            [normalizedEmail, hashedPassword, normalizedRole, name?.trim() || null, phone?.trim() || null, address?.trim() || null, city?.trim() || null, blood_type || null, age || null]
        );

        res.status(201).json({
            message: 'Registered successfully',
            userId: result.rows[0].id,
            email: result.rows[0].email,
            role: result.rows[0].role,
            name: result.rows[0].name
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Email already exists' });
        }
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Server error during registration'});
    }
});

// Login route with JWT
app.post('/api/login', async (req, res) => {
    const { email, password} = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    // Checking if email and password are provided
    if (!normalizedEmail || !password) {
        return res.status(400).json({ error: 'Missing email or password'});
    }

    try {
        // Finding user by email
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [normalizedEmail]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Compare password with stored hash
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: 'Your account has been deactivated. Please contact the administrator.' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION || '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Forgot password step 1: verify account name + email and send code
app.post('/api/forgot-password/request-code', async (req, res) => {
    const rawEmail = req.body?.email;
    const rawName = req.body?.name;
    const email = rawEmail?.trim().toLowerCase();
    const name = rawName?.trim();

    if (!email || !name) {
        return res.status(400).json({ error: 'Name and email are required' });
    }

    try {
        const userResult = await pool.query(
            `SELECT id, name, email
             FROM users
             WHERE email = $1 AND LOWER(name) = LOWER($2)
             LIMIT 1`,
            [email, name]
        );

        const user = userResult.rows[0];
        if (!user) {
            return res.status(404).json({ error: 'Account name and email do not match' });
        }

        const code = String(Math.floor(100000 + Math.random() * 900000));
        const codeHash = await bcrypt.hash(code, 10);

        await pool.query(
            'UPDATE password_reset_codes SET consumed = true WHERE email = $1 AND consumed = false',
            [email]
        );

        await pool.query(
            `INSERT INTO password_reset_codes (user_id, email, code_hash, expires_at)
             VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')`,
            [user.id, email, codeHash]
        );

        try {
            await sendResetCodeEmail(email, user.name || name, code);
        } catch (mailErr) {
            await pool.query('UPDATE password_reset_codes SET consumed = true WHERE email = $1 AND consumed = false', [email]);

            if (mailErr.message === 'SMTP_NOT_CONFIGURED') {
                return res.status(503).json({
                    error: 'Email service is not configured. Please contact support.',
                });
            }

            console.error('Send reset email error:', mailErr);
            return res.status(500).json({ error: 'Unable to send verification code right now' });
        }

        return res.json({ message: 'Verification code sent to your email' });
    } catch (err) {
        console.error('Request reset code error:', err);
        return res.status(500).json({ error: 'Unable to send verification code right now' });
    }
});

// Forgot password step 2: verify code and issue short-lived reset token
app.post('/api/forgot-password/verify-code', async (req, res) => {
    const email = req.body?.email?.trim().toLowerCase();
    const code = req.body?.code?.trim();

    if (!email || !code) {
        return res.status(400).json({ error: 'Email and verification code are required' });
    }

    try {
        const codeResult = await pool.query(
            `SELECT id, user_id, code_hash, expires_at
             FROM password_reset_codes
             WHERE email = $1 AND consumed = false
             ORDER BY created_at DESC
             LIMIT 1`,
            [email]
        );

        const record = codeResult.rows[0];
        if (!record) {
            return res.status(400).json({ error: 'No reset request found. Request a new code.' });
        }

        if (new Date(record.expires_at) < new Date()) {
            await pool.query('UPDATE password_reset_codes SET consumed = true WHERE id = $1', [record.id]);
            return res.status(400).json({ error: 'Code expired. Please request a new code.' });
        }

        const isCodeValid = await bcrypt.compare(code, record.code_hash);
        if (!isCodeValid) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        await pool.query(
            'UPDATE password_reset_codes SET verified = true WHERE id = $1',
            [record.id]
        );

        const resetToken = jwt.sign(
            { userId: record.user_id, resetId: record.id, purpose: 'password_reset' },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        return res.json({
            message: 'Code verified successfully',
            reset_token: resetToken,
        });
    } catch (err) {
        console.error('Verify reset code error:', err);
        return res.status(500).json({ error: 'Unable to verify code right now' });
    }
});

// Forgot password step 3: reset password using verified reset token
app.post('/api/forgot-password/reset', async (req, res) => {
    const token = req.body?.reset_token;
    const newPassword = req.body?.new_password;

    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Reset token and new password are required' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (decoded.purpose !== 'password_reset') {
            return res.status(401).json({ error: 'Invalid reset token' });
        }

        const resetRecord = await pool.query(
            `SELECT id, user_id, verified, consumed, expires_at
             FROM password_reset_codes
             WHERE id = $1`,
            [decoded.resetId]
        );

        const record = resetRecord.rows[0];
        if (!record || record.user_id !== decoded.userId) {
            return res.status(401).json({ error: 'Invalid reset session' });
        }

        if (record.consumed || !record.verified || new Date(record.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Reset session expired. Request a new code.' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [passwordHash, decoded.userId]);
        await pool.query('UPDATE password_reset_codes SET consumed = true WHERE id = $1', [record.id]);

        return res.json({ message: 'Password changed successfully' });
    } catch (err) {
        if (err?.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Reset session expired. Request a new code.' });
        }

        if (err?.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid reset token' });
        }

        console.error('Reset password error:', err);
        return res.status(500).json({ error: 'Unable to reset password right now' });
    }
});

// Protected route - Get current user info
app.get('/api/profile', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.id, u.email, u.role, u.name, u.phone, u.address, u.city, u.state, u.country, u.blood_type, u.age, u.medical_history, u.donation_type, u.donation_organ, u.is_active, u.created_at, u.profile_picture,
                    COALESCE(r.status, 'pending') AS verification_status
             FROM users u
             LEFT JOIN admin_user_reviews r ON r.user_id = u.id
             WHERE u.id = $1`,
            [req.userId]
        );

        if (!result.rows[0]) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
});

// Protected route - Logout (optional, mainly for frontend to clear token)
app.post('/api/logout', verifyToken, (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

// Mount all route modules
app.use('/api', usersRouter);
app.use('/api', requestsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api', alertsRouter);
app.use('/api/donors', donorsRouter);
app.use('/api/admin', adminAuthRouter);
app.use('/api/admin', adminPanelRouter);
app.use('/api', announcementsRouter);
app.use('/api', chatRouter);
app.use('/api', hospitalsRouter);

// Centralized error handler (must be after all routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await ensureSchema();
        await ensurePasswordResetTable();
        await ensureAdminUser();
        app.listen(PORT, () => {
            console.log(`Server started on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

startServer();
