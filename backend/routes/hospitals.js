import express from 'express';
import pool from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/hospital/stats - Get hospital statistics
router.get('/hospital/stats', verifyToken, async (req, res) => {
  if (req.role !== 'hospital') {
    return res.status(403).json({ error: 'Only hospitals can access this endpoint' });
  }

  try {
    const hospitalId = req.userId;

    // Get active requests
    const activeRequests = await pool.query(
      `SELECT COUNT(*) as count FROM donation_requests 
       WHERE status = 'open' AND location = (
         SELECT city FROM users WHERE id = $1 AND role = 'hospital'
       )`,
      [hospitalId]
    );

    // Get donations facilitated (completed requests attributed to this hospital)
    const donationsFacilitated = await pool.query(
      `SELECT COUNT(*) as count FROM donation_requests 
       WHERE status = 'completed' AND location = (
         SELECT city FROM users WHERE id = $1 AND role = 'hospital'
       )`,
      [hospitalId]
    );

    res.json({
      active_requests: parseInt(activeRequests.rows[0].count) || 0,
      donations_facilitated: parseInt(donationsFacilitated.rows[0].count) || 0,
    });
  } catch (err) {
    console.error('Get hospital stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/hospital/announcements - Get hospital's announcements
router.get('/hospital/announcements', verifyToken, async (req, res) => {
  if (req.role !== 'hospital') {
    return res.status(403).json({ error: 'Only hospitals can access this endpoint' });
  }

  try {
    const { limit = 10, offset = 0 } = req.query;
    const result = await pool.query(
      `SELECT a.* FROM announcements a
       WHERE a.created_by = $1 AND a.is_published = true
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.userId, parseInt(limit), parseInt(offset)]
    );

    res.json({ announcements: result.rows });
  } catch (err) {
    console.error('Get hospital announcements error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/hospital/requests - Get requests in hospital's area
router.get('/hospital/requests', verifyToken, async (req, res) => {
  if (req.role !== 'hospital') {
    return res.status(403).json({ error: 'Only hospitals can access this endpoint' });
  }

  try {
    const { request_type, blood_type } = req.query;

    // Get hospital's city
    const hospitalResult = await pool.query(
      'SELECT city FROM users WHERE id = $1',
      [req.userId]
    );

    const hospitalCity = hospitalResult.rows[0]?.city;
    if (!hospitalCity) {
      return res.json({ requests: [] });
    }

    let query = `
      SELECT * FROM donation_requests 
      WHERE location = $1 AND status = 'open'
    `;
    const params = [hospitalCity];

    if (request_type) {
      query += ` AND request_type = $${params.length + 1}`;
      params.push(request_type);
    }

    if (blood_type && request_type === 'blood') {
      query += ` AND blood_type = $${params.length + 1}`;
      params.push(blood_type);
    }

    query += ` ORDER BY urgency DESC, created_at DESC LIMIT 50`;

    const result = await pool.query(query, params);
    res.json({ requests: result.rows });
  } catch (err) {
    console.error('Get hospital requests error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/hospital/campaigns - Create a campaign
router.post('/hospital/campaigns', verifyToken, async (req, res) => {
  if (req.role !== 'hospital') {
    return res.status(403).json({ error: 'Only hospitals can create campaigns' });
  }

  const { title, description, blood_type, target_units, start_date, end_date } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'title and description are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO campaigns (hospital_id, title, description, blood_type, target_units, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
       RETURNING *`,
      [
        req.userId,
        title,
        description,
        blood_type || null,
        target_units || null,
        start_date || null,
        end_date || null,
      ]
    );

    const campaign = result.rows[0];

    // Create notification for all users
    try {
      const hospitalResult = await pool.query(
        'SELECT name FROM users WHERE id = $1',
        [req.userId]
      );
      const hospitalName = hospitalResult.rows[0]?.name || 'A hospital';

      await pool.query(
        `INSERT INTO alerts
         (created_by, alert_type, message, urgency, target_audience, blood_type_target, related_campaign_id)
         VALUES ($1, 'system_alert', $2, 'medium', 'all_users', $3, $4)`,
        [
          req.userId,
          `${hospitalName} has launched a new campaign: ${title}`,
          blood_type === 'All Types' ? null : (blood_type || null),
          campaign.id
        ]
      );
    } catch (alertErr) {
      console.error('Create campaign alert error:', alertErr);
    }

    res.status(201).json({ campaign });
  } catch (err) {
    console.error('Create campaign error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/hospital/campaigns - Get hospital's campaigns
router.get('/hospital/campaigns', verifyToken, async (req, res) => {
  if (req.role !== 'hospital') {
    return res.status(403).json({ error: 'Only hospitals can access this endpoint' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM campaigns WHERE hospital_id = $1 ORDER BY created_at DESC`,
      [req.userId]
    );

    res.json({ campaigns: result.rows });
  } catch (err) {
    console.error('Get campaigns error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
