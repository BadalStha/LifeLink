import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'lifelink_db',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

app.get('/', (req, res) => {
    res.send('LifeLink Backend running!');
});




app.post('/api/register', async (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password || !role) return res.status(400).json({ error: 'Missing fields' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id',
            [email, hashedPassword, role]
        );
        res.status(201).json({ message: 'Registered', userId: result.rows[0].id });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Email exists' });
        res.status(500).json({ error: 'Server error during registration'});
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
})
