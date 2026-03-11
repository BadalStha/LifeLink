import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize database pool
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'lifelink_db',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

// GET /api/donors/locations - Get all active donors with location data
router.get('/locations', async (req, res) => {
    const { blood_type, city, limit = 50 } = req.query;

    try {
        let query = `
            SELECT 
                id,
                name, 
                blood_type,
                city,
                state,
                country,
                role,
                age
            FROM users 
            WHERE is_active = true 
            AND (role = 'user' OR role = 'patient')
            AND city IS NOT NULL
        `;
        
        const params = [];
        let paramCount = 1;

        if (blood_type) {
            query += ` AND blood_type = $${paramCount}`;
            params.push(blood_type);
            paramCount++;
        }

        if (city) {
            query += ` AND LOWER(city) LIKE LOWER($${paramCount})`;
            params.push(`%${city}%`);
            paramCount++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
        params.push(parseInt(limit));

        const result = await pool.query(query, params);

        // Map cities to approximate coordinates (Nepal cities)
        const cityCoordinates = {
            'kathmandu': [27.7172, 85.3240],
            'pokhara': [28.2096, 83.9856],
            'lalitpur': [27.6710, 85.3240],
            'bhaktapur': [27.6710, 85.4298],
            'biratnagar': [26.4525, 87.2718],
            'birgunj': [27.0000, 84.8800],
            'dharan': [26.8167, 87.2833],
            'hetauda': [27.4167, 85.0333],
            'itahari': [26.6611, 87.2778],
            'bharatpur': [27.6833, 84.4333],
            'butwal': [27.7000, 83.4500],
            'janakpur': [26.7271, 85.9235],
            'nepalgunj': [28.0500, 81.6167],
            'dhangadhi': [28.6944, 80.5833],
            'tulsipur': [28.1167, 82.2833],
        };

        const donors = result.rows.map(donor => {
            const cityLower = donor.city?.toLowerCase().trim() || '';
            const coordinates = cityCoordinates[cityLower] || [27.7172, 85.3240]; // Default to Kathmandu

            return {
                id: donor.id,
                name: donor.name || 'Anonymous Donor',
                blood_type: donor.blood_type,
                city: donor.city,
                state: donor.state,
                country: donor.country || 'Nepal',
                age: donor.age,
                coordinates: coordinates,
                role: donor.role
            };
        });

        res.json({
            donors,
            count: donors.length,
            total: result.rows.length
        });
    } catch (err) {
        console.error('Get donor locations error:', err);
        res.status(500).json({ error: 'Server error fetching donor locations' });
    }
});

export default router;
