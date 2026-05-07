const express = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/protocols/by-calculator/:calculator_id
router.get('/by-calculator/:calculator_id', (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM protocols WHERE calculator_id = ? AND is_active = 1 ORDER BY updated_at DESC
  `).all(req.params.calculator_id);
  res.json({ protocols: rows });
});

// GET /api/protocols
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, u.full_name AS updated_by_name FROM protocols p
    LEFT JOIN users u ON u.id = p.updated_by
    WHERE p.is_active = 1 ORDER BY p.updated_at DESC
  `).all();
  res.json({ protocols: rows });
});

// GET /api/protocols/:id
router.get('/:id', (req, res) => {
  const protocol = db.prepare('SELECT * FROM protocols WHERE id = ?').get(req.params.id);
  if (!protocol) return res.status(404).json({ error: 'Không tìm thấy phác đồ' });
  res.json({ protocol });
});

// POST /api/protocols (admin only)
router.post('/', requireRole('admin'), (req, res) => {
  const { calculator_id, title, content_md, department, version } = req.body || {};
  if (!calculator_id || !title || !content_md) {
    return res.status(400).json({ error: 'Thiếu thông tin' });
  }
  const result = db.prepare(`
    INSERT INTO protocols (calculator_id, title, content_md, department, version, updated_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(calculator_id, title, content_md, department || null, version || '1.0', req.user.id);
  const protocol = db.prepare('SELECT * FROM protocols WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ protocol });
});

// PUT /api/protocols/:id (admin only)
router.put('/:id', requireRole('admin'), (req, res) => {
  const { title, content_md, department, version, is_active } = req.body || {};
  db.prepare(`
    UPDATE protocols SET
      title = COALESCE(?, title),
      content_md = COALESCE(?, content_md),
      department = COALESCE(?, department),
      version = COALESCE(?, version),
      is_active = COALESCE(?, is_active),
      updated_by = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title, content_md, department, version, is_active, req.user.id, req.params.id);
  const protocol = db.prepare('SELECT * FROM protocols WHERE id = ?').get(req.params.id);
  res.json({ protocol });
});

module.exports = router;
