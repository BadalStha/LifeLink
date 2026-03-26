import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET /api/campaigns - Get all active campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, h.name as hospital_name, h.city as hospital_city, h.phone as hospital_phone
       FROM campaigns c
       JOIN hospitals h ON c.hospital_id = h.admin_id
       WHERE c.status = 'active'
       ORDER BY c.created_at DESC`
    );
    res.json({ campaigns: result.rows });
  } catch (err) {
    console.error('Get all campaigns error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/campaigns/:id - Get specific campaign details
router.get('/campaigns/:id', async (req, res) => {
  const { id } = req.params;
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid campaign ID' });
  }
  try {
    const result = await pool.query(
      `SELECT c.*, h.name as hospital_name, h.city as hospital_city, h.phone as hospital_phone, h.location as hospital_location, h.email as hospital_email
       FROM campaigns c
       JOIN hospitals h ON c.hospital_id = h.admin_id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ campaign: result.rows[0] });
  } catch (err) {
    console.error('Get campaign details error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
