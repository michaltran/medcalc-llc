const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/patients?q=...
router.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  let rows;
  if (q) {
    const like = `%${q}%`;
    rows = db.prepare(`
      SELECT * FROM patients
      WHERE medical_record_number LIKE ? OR full_name LIKE ? OR phone LIKE ?
      ORDER BY created_at DESC LIMIT 50
    `).all(like, like, like);
  } else {
    rows = db.prepare('SELECT * FROM patients ORDER BY created_at DESC LIMIT 50').all();
  }
  res.json({ patients: rows });
});

// GET /api/patients/:id
router.get('/:id', (req, res) => {
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Không tìm thấy bệnh nhân' });

  const history = db.prepare(`
    SELECT h.*, u.full_name AS user_name
    FROM calculation_history h
    LEFT JOIN users u ON u.id = h.user_id
    WHERE h.patient_id = ?
    ORDER BY h.created_at DESC
  `).all(req.params.id);

  res.json({ patient, history });
});

// POST /api/patients
router.post('/', (req, res) => {
  const { medical_record_number, full_name, date_of_birth, gender, phone, address } = req.body || {};
  if (!medical_record_number || !full_name) {
    return res.status(400).json({ error: 'Mã bệnh án và họ tên là bắt buộc' });
  }
  try {
    const result = db.prepare(`
      INSERT INTO patients (medical_record_number, full_name, date_of_birth, gender, phone, address, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(medical_record_number, full_name, date_of_birth || null, gender || null, phone || null, address || null, req.user.id);

    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ patient });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Mã bệnh án đã tồn tại' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/patients/:id
router.put('/:id', (req, res) => {
  const { full_name, date_of_birth, gender, phone, address } = req.body || {};
  db.prepare(`
    UPDATE patients SET full_name = COALESCE(?, full_name),
      date_of_birth = COALESCE(?, date_of_birth),
      gender = COALESCE(?, gender),
      phone = COALESCE(?, phone),
      address = COALESCE(?, address)
    WHERE id = ?
  `).run(full_name, date_of_birth, gender, phone, address, req.params.id);

  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  res.json({ patient });
});

module.exports = router;
