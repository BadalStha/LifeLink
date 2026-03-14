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

// GET /api/dashboard/stats - Get platform statistics
router.get('/stats', async (req, res) => {
    try {
        // Get total users count
        const usersResult = await pool.query(
            'SELECT COUNT(*) as total_users FROM users WHERE is_active = true'
        );

           // Get donors count (users who completed donation preference form)
        const donorsResult = await pool.query(
            `SELECT COUNT(*) as total_donors FROM users 
               WHERE is_active = true AND donation_type IS NOT NULL`
        );

        // Get active requests count
        const activeRequestsResult = await pool.query(
            `SELECT COUNT(*) as active_requests FROM donation_requests 
             WHERE status = 'open'`
        );

        // Get critical requests count
        const criticalRequestsResult = await pool.query(
            `SELECT COUNT(*) as critical_requests FROM donation_requests 
             WHERE status = 'open' AND urgency = 'critical'`
        );

        // Get fulfilled requests count (total lives saved)
        const fulfilledResult = await pool.query(
            `SELECT COUNT(*) as fulfilled_requests FROM donation_requests 
             WHERE status = 'fulfilled'`
        );

        // Get blood donations count
        const bloodDonationsResult = await pool.query(
            'SELECT COUNT(*) as blood_donations FROM blood_donations'
        );

        // Get organ donations count
        const organDonationsResult = await pool.query(
            'SELECT COUNT(*) as organ_donations FROM organ_donations'
        );

        // Get unique cities count (district reach)
        const citiesResult = await pool.query(
            'SELECT COUNT(DISTINCT city) as districts_count FROM users WHERE city IS NOT NULL'
        );

        // Get recent requests (last 5)
        const recentRequestsResult = await pool.query(
            `SELECT dr.*, u.name as requester_name, u.city 
             FROM donation_requests dr
             LEFT JOIN users u ON dr.requester_id = u.id
             WHERE dr.status = 'open'
             ORDER BY dr.created_at DESC
             LIMIT 5`
        );

        // Get blood type distribution
        const bloodTypeResult = await pool.query(
            `SELECT blood_type, COUNT(*) as count 
             FROM users 
             WHERE blood_type IS NOT NULL AND is_active = true
             GROUP BY blood_type
             ORDER BY count DESC`
        );

        res.json({
            stats: {
                total_users: parseInt(usersResult.rows[0].total_users),
                total_donors: parseInt(donorsResult.rows[0].total_donors),
                active_requests: parseInt(activeRequestsResult.rows[0].active_requests),
                critical_requests: parseInt(criticalRequestsResult.rows[0].critical_requests),
                lives_saved: parseInt(fulfilledResult.rows[0].fulfilled_requests),
                blood_donations: parseInt(bloodDonationsResult.rows[0].blood_donations),
                organ_donations: parseInt(organDonationsResult.rows[0].organ_donations),
                districts_count: parseInt(citiesResult.rows[0].districts_count)
            },
            recent_requests: recentRequestsResult.rows,
            blood_type_distribution: bloodTypeResult.rows
        });
    } catch (err) {
        console.error('Dashboard stats error:', err);
        res.status(500).json({ error: 'Server error fetching dashboard stats' });
    }
});

// GET /api/dashboard/users - Get all users for admin (paginated)
router.get('/users', async (req, res) => {
    const { limit = 20, offset = 0, search = '', role = '' } = req.query;

    try {
        let query = `
            SELECT id, name, email, role, blood_type, city, phone, age, is_active, created_at
            FROM users 
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (search) {
            query += ` AND (LOWER(name) LIKE LOWER($${paramCount}) OR LOWER(email) LIKE LOWER($${paramCount}))`;
            params.push(`%${search}%`);
            paramCount++;
        }

        if (role) {
            query += ` AND role = $${paramCount}`;
            params.push(role);
            paramCount++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM users WHERE 1=1 ${search ? 'AND (LOWER(name) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1))' : ''}`;
        const countResult = await pool.query(countQuery, search ? [`%${search}%`] : []);

        res.json({
            users: result.rows,
            total: parseInt(countResult.rows[0].total),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({ error: 'Server error fetching users' });
    }
});

export default router;
