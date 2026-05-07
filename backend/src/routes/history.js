const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// POST /api/history - Save a calculation
router.post('/', (req, res) => {
  const { patient_id, calculator_id, calculator_name, inputs, result, interpretation, notes } = req.body || {};
  if (!calculator_id || !calculator_name || !inputs || !result) {
    return res.status(400).json({ error: 'Thiếu thông tin tính toán' });
  }

  const stmt = db.prepare(`
    INSERT INTO calculation_history
      (user_id, patient_id, calculator_id, calculator_name, inputs_json, result_json, interpretation, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result_ = stmt.run(
    req.user.id,
    patient_id || null,
    calculator_id,
    calculator_name,
    JSON.stringify(inputs),
    JSON.stringify(result),
    interpretation || null,
    notes || null
  );

  const row = db.prepare('SELECT * FROM calculation_history WHERE id = ?').get(result_.lastInsertRowid);
  res.status(201).json({ entry: parseRow(row) });
});

// GET /api/history?patient_id=&calculator_id=&limit=
router.get('/', (req, res) => {
  const { patient_id, calculator_id, limit = 50 } = req.query;
  const conditions = [];
  const params = [];

  if (patient_id) { conditions.push('h.patient_id = ?'); params.push(patient_id); }
  if (calculator_id) { conditions.push('h.calculator_id = ?'); params.push(calculator_id); }

  // Non-admin users see only their own history (unless patient is specified)
  if (req.user.role !== 'admin' && !patient_id) {
    conditions.push('h.user_id = ?'); params.push(req.user.id);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const rows = db.prepare(`
    SELECT h.*, u.full_name AS user_name, p.full_name AS patient_name, p.medical_record_number
    FROM calculation_history h
    LEFT JOIN users u ON u.id = h.user_id
    LEFT JOIN patients p ON p.id = h.patient_id
    ${where}
    ORDER BY h.created_at DESC
    LIMIT ?
  `).all(...params, Number(limit));

  res.json({ history: rows.map(parseRow) });
});

// GET /api/history/:id
router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT h.*, u.full_name AS user_name, p.full_name AS patient_name, p.medical_record_number, p.date_of_birth, p.gender
    FROM calculation_history h
    LEFT JOIN users u ON u.id = h.user_id
    LEFT JOIN patients p ON p.id = h.patient_id
    WHERE h.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Không tìm thấy bản ghi' });
  res.json({ entry: parseRow(row) });
});

// DELETE /api/history/:id (only admin or owner)
router.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT user_id FROM calculation_history WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Không tìm thấy' });
  if (req.user.role !== 'admin' && row.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Không có quyền xóa' });
  }
  db.prepare('DELETE FROM calculation_history WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

function parseRow(row) {
  return {
    ...row,
    inputs: JSON.parse(row.inputs_json),
    result: JSON.parse(row.result_json)
  };
}

module.exports = router;
