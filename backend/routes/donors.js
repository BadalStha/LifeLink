import express from 'express';
import pool from '../db.js';

const router = express.Router();

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
                age,
                donation_type,
                donation_organ
            FROM users
            WHERE is_active = true
            AND donation_type IS NOT NULL
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

        // Map districts/cities to coordinates — covers all Nepal districts from registration form
        const cityCoordinates = {
            // Province 1
            'bhojpur': [27.1743, 87.0521], 'dhankuta': [26.9833, 87.3500],
            'ilam': [26.9117, 87.9270], 'jhapa': [26.6400, 87.8780],
            'khotang': [27.0167, 86.8333], 'morang': [26.5000, 87.2833],
            'okhaldhunga': [27.3000, 86.5000], 'panchthar': [27.1500, 87.7833],
            'sankhuwasabha': [27.3667, 87.1167], 'solukhumbu': [27.7667, 86.6500],
            'sunsari': [26.6833, 87.1667], 'taplejung': [27.3500, 87.6667],
            'terhathum': [27.1167, 87.5333], 'udayapur': [26.9900, 86.5167],
            // Madhesh
            'bara': [27.0167, 85.0000], 'dhanusa': [26.8167, 85.9167],
            'dhanusha': [26.8167, 85.9167], 'mahottari': [26.6333, 85.7833],
            'parsa': [27.0000, 84.8833], 'rautahat': [27.0000, 85.3000],
            'saptari': [26.5833, 86.7167], 'sarlahi': [27.0167, 85.5833],
            'siraha': [26.6500, 86.2000],
            // Bagmati
            'bhaktapur': [27.6710, 85.4298], 'chitwan': [27.5291, 84.3542],
            'dhading': [27.8667, 84.9167], 'dolakha': [27.6833, 86.0833],
            'kathmandu': [27.7172, 85.3240], 'kavrepalanchok': [27.5333, 85.6833],
            'lalitpur': [27.6644, 85.3188], 'makwanpur': [27.4333, 85.0333],
            'nuwakot': [27.9167, 85.1667], 'ramechhap': [27.3333, 86.1000],
            'rasuwa': [28.1000, 85.3667], 'sindhuli': [27.2833, 85.9000],
            'sindhupalchok': [27.9500, 85.6833],
            // Gandaki
            'baglung': [28.2667, 83.5833], 'gorkha': [28.0000, 84.6333],
            'kaski': [28.2667, 84.0167], 'lamjung': [28.2667, 84.4167],
            'manang': [28.6667, 84.0167], 'mustang': [28.9667, 83.8667],
            'myagdi': [28.3667, 83.5833], 'nawalpur': [27.7000, 84.0333],
            'parbat': [28.2333, 83.7167], 'syangja': [28.0167, 83.8833],
            'tanahun': [27.9167, 84.2500],
            // Lumbini
            'arghakhanchi': [27.9167, 83.1167], 'banke': [28.0500, 81.6167],
            'bardiya': [28.3500, 81.5000], 'dang': [28.1000, 82.3000],
            'gulmi': [28.0833, 83.2667], 'kapilvastu': [27.5667, 83.0500],
            'nawalparasi west': [27.5333, 83.8333], 'nawalparasi': [27.5333, 83.8333],
            'palpa': [27.8667, 83.5500], 'pyuthan': [28.1000, 82.8333],
            'rolpa': [28.2500, 82.6500], 'rupandehi': [27.5000, 83.4500],
            // Karnali
            'dailekh': [28.8500, 81.7167], 'dolpa': [29.0000, 82.9667],
            'humla': [29.9667, 81.9167], 'jajarkot': [28.7000, 82.1833],
            'jumla': [29.2833, 82.1833], 'kalikot': [29.1333, 81.6333],
            'mugu': [29.7167, 82.5167], 'salyan': [28.3833, 82.1500],
            'surkhet': [28.6000, 81.6167], 'western rukum': [28.6167, 82.6500],
            // Sudurpashchim
            'achham': [29.0833, 81.1833], 'baitadi': [29.5333, 80.4333],
            'bajhang': [29.5500, 81.1667], 'bajura': [29.3500, 81.3833],
            'dadeldhura': [29.3000, 80.5833], 'darchula': [29.8500, 80.4833],
            'doti': [29.2667, 80.9333], 'kailali': [28.7000, 80.5833],
            'kanchanpur': [28.9167, 80.0833],
            // City fallbacks
            'pokhara': [28.2096, 83.9856], 'biratnagar': [26.4525, 87.2718],
            'birgunj': [27.0000, 84.8800], 'hetauda': [27.4167, 85.0333],
            'butwal': [27.7000, 83.4500], 'nepalgunj': [28.0500, 81.6167],
            'dhangadhi': [28.6944, 80.5833], 'janakpur': [26.7271, 85.9235],
            'itahari': [26.6611, 87.2778], 'bharatpur': [27.6833, 84.4333],
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
