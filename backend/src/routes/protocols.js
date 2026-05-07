const express = require('express');
const { all, one, insertReturning } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/protocols/by-calculator/:calculator_id
router.get('/by-calculator/:calculator_id', async (req, res, next) => {
  try {
    const protocols = await all(
      'SELECT * FROM protocols WHERE calculator_id = $1 AND is_active = TRUE ORDER BY updated_at DESC',
      [req.params.calculator_id]
    );
    res.json({ protocols });
  } catch (err) { next(err); }
});

// GET /api/protocols
router.get('/', async (req, res, next) => {
  try {
    const protocols = await all(
      `SELECT p.*, u.full_name AS updated_by_name FROM protocols p
       LEFT JOIN users u ON u.id = p.updated_by
       WHERE p.is_active = TRUE ORDER BY p.updated_at DESC`
    );
    res.json({ protocols });
  } catch (err) { next(err); }
});

// GET /api/protocols/:id
router.get('/:id', async (req, res, next) => {
  try {
    const protocol = await one('SELECT * FROM protocols WHERE id = $1', [req.params.id]);
    if (!protocol) return res.status(404).json({ error: 'Không tìm thấy phác đồ' });
    res.json({ protocol });
  } catch (err) { next(err); }
});

// POST /api/protocols (admin)
router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const { calculator_id, title, content_md, department, version } = req.body || {};
    if (!calculator_id || !title || !content_md) {
      return res.status(400).json({ error: 'Thiếu thông tin' });
    }
    const protocol = await insertReturning(
      `INSERT INTO protocols (calculator_id, title, content_md, department, version, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [calculator_id, title, content_md, department || null, version || '1.0', req.user.id]
    );
    res.status(201).json({ protocol });
  } catch (err) { next(err); }
});

// PUT /api/protocols/:id (admin)
router.put('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const { title, content_md, department, version, is_active } = req.body || {};
    const protocol = await insertReturning(
      `UPDATE protocols SET
         title = COALESCE($1, title),
         content_md = COALESCE($2, content_md),
         department = COALESCE($3, department),
         version = COALESCE($4, version),
         is_active = COALESCE($5, is_active),
         updated_by = $6,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [title, content_md, department, version, is_active, req.user.id, req.params.id]
    );
    if (!protocol) return res.status(404).json({ error: 'Không tìm thấy phác đồ' });
    res.json({ protocol });
  } catch (err) { next(err); }
});

module.exports = router;
