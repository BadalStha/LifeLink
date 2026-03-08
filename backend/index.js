import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import usersRouter from './routes/users.js';

// Loading .env variables
dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this';

// Middleware
app.use(cors());
app.use(express.json());

// JWT Verification Middleware
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

// PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'lifelink_db',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

// Test route
app.get('/', (req, res) => {
    res.send('LifeLink Backend running!');
});

// Registration route
app.post('/api/register', async (req, res) => {
    const { email, password, role, name, phone, address, city, blood_type, age } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ error: 'Missing fields: email, password, role' });
    }

    // Validate blood type for donors
    const validBloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
    if (role === 'user' && blood_type && !validBloodTypes.includes(blood_type)) {
        return res.status(400).json({ error: 'Invalid blood type' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (email, password, role, name, phone, address, city, blood_type, age) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, email, role, name',
            [email, hashedPassword, role, name || null, phone || null, address || null, city || null, blood_type || null, age || null]
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

    // Checking if email and password are provided
    if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password'});
    }

    try {
        // Finding user by email
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
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

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
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

// Protected route - Get current user info
app.get('/api/profile', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, role, name, phone, address, city, state, country, blood_type, age, medical_history, is_active, created_at FROM users WHERE id = $1',
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

// User profile management routes
app.use('/api', usersRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
