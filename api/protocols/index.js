const { all, insertReturning } = require('../_lib/db');
const { requireAuth, requireRole, cors } = require('../_lib/auth');

module.exports = cors(async (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    const protocols = await all(
      `SELECT p.*, u.full_name AS updated_by_name FROM protocols p
       LEFT JOIN users u ON u.id = p.updated_by
       WHERE p.is_active = TRUE ORDER BY p.updated_at DESC`
    );
    return res.json({ protocols });
  }

  if (req.method === 'POST') {
    const adminUser = requireRole(req, res, ['admin']);
    if (!adminUser) return;
    const { calculator_id, title, content_md, department, version } = req.body || {};
    if (!calculator_id || !title || !content_md) {
      return res.status(400).json({ error: 'Thiếu thông tin' });
    }
    const protocol = await insertReturning(
      `INSERT INTO protocols (calculator_id, title, content_md, department, version, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [calculator_id, title, content_md, department || null, version || '1.0', adminUser.id]
    );
    return res.status(201).json({ protocol });
  }

  res.status(405).json({ error: 'Method not allowed' });
});
