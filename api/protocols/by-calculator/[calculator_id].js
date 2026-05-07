const { all } = require('../../_lib/db');
const { requireAuth, cors } = require('../../_lib/auth');

module.exports = cors(async (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const protocols = await all(
    'SELECT * FROM protocols WHERE calculator_id = $1 AND is_active = TRUE ORDER BY updated_at DESC',
    [req.query.calculator_id]
  );
  res.json({ protocols });
});
