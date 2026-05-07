const express = require('express');
const { all, one, insertReturning, query } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// POST /api/history
router.post('/', async (req, res, next) => {
  try {
    const { patient_id, calculator_id, calculator_name, inputs, result, interpretation, notes } = req.body || {};
    if (!calculator_id || !calculator_name || !inputs || !result) {
      return res.status(400).json({ error: 'Thiếu thông tin tính toán' });
    }

    const entry = await insertReturning(
      `INSERT INTO calculation_history
        (user_id, patient_id, calculator_id, calculator_name, inputs_json, result_json, interpretation, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        req.user.id,
        patient_id || null,
        calculator_id,
        calculator_name,
        JSON.stringify(inputs),
        JSON.stringify(result),
        interpretation || null,
        notes || null
      ]
    );

    res.status(201).json({ entry: parseRow(entry) });
  } catch (err) { next(err); }
});

// GET /api/history?patient_id=&calculator_id=&limit=
router.get('/', async (req, res, next) => {
  try {
    const { patient_id, calculator_id, limit = 50 } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (patient_id) { conditions.push(`h.patient_id = $${idx++}`); params.push(patient_id); }
    if (calculator_id) { conditions.push(`h.calculator_id = $${idx++}`); params.push(calculator_id); }

    if (req.user.role !== 'admin' && !patient_id) {
      conditions.push(`h.user_id = $${idx++}`);
      params.push(req.user.id);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    params.push(Number(limit));

    const rows = await all(
      `SELECT h.*, u.full_name AS user_name, p.full_name AS patient_name, p.medical_record_number
       FROM calculation_history h
       LEFT JOIN users u ON u.id = h.user_id
       LEFT JOIN patients p ON p.id = h.patient_id
       ${where}
       ORDER BY h.created_at DESC
       LIMIT $${idx}`,
      params
    );

    res.json({ history: rows.map(parseRow) });
  } catch (err) { next(err); }
});

// GET /api/history/:id
router.get('/:id', async (req, res, next) => {
  try {
    const entry = await one(
      `SELECT h.*, u.full_name AS user_name, p.full_name AS patient_name,
              p.medical_record_number, p.date_of_birth, p.gender
       FROM calculation_history h
       LEFT JOIN users u ON u.id = h.user_id
       LEFT JOIN patients p ON p.id = h.patient_id
       WHERE h.id = $1`,
      [req.params.id]
    );
    if (!entry) return res.status(404).json({ error: 'Không tìm thấy bản ghi' });
    res.json({ entry: parseRow(entry) });
  } catch (err) { next(err); }
});

// DELETE /api/history/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const row = await one('SELECT user_id FROM calculation_history WHERE id = $1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Không tìm thấy' });
    if (req.user.role !== 'admin' && row.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Không có quyền xóa' });
    }
    await query('DELETE FROM calculation_history WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

function parseRow(row) {
  // PostgreSQL JSONB tự động parse, không cần JSON.parse
  return {
    ...row,
    inputs: typeof row.inputs_json === 'string' ? JSON.parse(row.inputs_json) : row.inputs_json,
    result: typeof row.result_json === 'string' ? JSON.parse(row.result_json) : row.result_json
  };
}

module.exports = router;
