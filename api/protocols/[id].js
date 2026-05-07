const { one, insertReturning } = require('../_lib/db');
const { requireAuth, requireRole, cors } = require('../_lib/auth');

module.exports = cors(async (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const { id } = req.query;

  if (req.method === 'GET') {
    const protocol = await one('SELECT * FROM protocols WHERE id = $1', [id]);
    if (!protocol) return res.status(404).json({ error: 'Không tìm thấy phác đồ' });
    return res.json({ protocol });
  }

  if (req.method === 'PUT') {
    const adminUser = requireRole(req, res, ['admin']);
    if (!adminUser) return;
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
      [title, content_md, department, version, is_active, adminUser.id, id]
    );
    if (!protocol) return res.status(404).json({ error: 'Không tìm thấy phác đồ' });
    return res.json({ protocol });
  }

  res.status(405).json({ error: 'Method not allowed' });
});
