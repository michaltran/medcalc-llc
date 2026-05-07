const express = require('express');
const { all, one, insertReturning, query } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/patients?q=...
router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    let rows;
    if (q) {
      const like = `%${q}%`;
      rows = await all(
        `SELECT * FROM patients
         WHERE medical_record_number ILIKE $1 OR full_name ILIKE $1 OR phone ILIKE $1
         ORDER BY created_at DESC LIMIT 50`,
        [like]
      );
    } else {
      rows = await all('SELECT * FROM patients ORDER BY created_at DESC LIMIT 50');
    }
    res.json({ patients: rows });
  } catch (err) { next(err); }
});

// GET /api/patients/:id
router.get('/:id', async (req, res, next) => {
  try {
    const patient = await one('SELECT * FROM patients WHERE id = $1', [req.params.id]);
    if (!patient) return res.status(404).json({ error: 'Không tìm thấy bệnh nhân' });

    const history = await all(
      `SELECT h.*, u.full_name AS user_name
       FROM calculation_history h
       LEFT JOIN users u ON u.id = h.user_id
       WHERE h.patient_id = $1
       ORDER BY h.created_at DESC`,
      [req.params.id]
    );

    res.json({ patient, history });
  } catch (err) { next(err); }
});

// POST /api/patients
router.post('/', async (req, res, next) => {
  try {
    const { medical_record_number, full_name, date_of_birth, gender, phone, address } = req.body || {};
    if (!medical_record_number || !full_name) {
      return res.status(400).json({ error: 'Mã bệnh án và họ tên là bắt buộc' });
    }
    const patient = await insertReturning(
      `INSERT INTO patients (medical_record_number, full_name, date_of_birth, gender, phone, address, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [medical_record_number, full_name, date_of_birth || null, gender || null, phone || null, address || null, req.user.id]
    );
    res.status(201).json({ patient });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Mã bệnh án đã tồn tại' });
    }
    next(err);
  }
});

// PUT /api/patients/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { full_name, date_of_birth, gender, phone, address } = req.body || {};
    const patient = await insertReturning(
      `UPDATE patients SET
        full_name = COALESCE($1, full_name),
        date_of_birth = COALESCE($2, date_of_birth),
        gender = COALESCE($3, gender),
        phone = COALESCE($4, phone),
        address = COALESCE($5, address)
       WHERE id = $6 RETURNING *`,
      [full_name, date_of_birth, gender, phone, address, req.params.id]
    );
    if (!patient) return res.status(404).json({ error: 'Không tìm thấy bệnh nhân' });
    res.json({ patient });
  } catch (err) { next(err); }
});

module.exports = router;
