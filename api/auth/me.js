const { one } = require('../_lib/db');
const { requireAuth, cors } = require('../_lib/auth');

module.exports = cors(async (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;

  const user = await one(
    'SELECT id, username, full_name, role, department FROM users WHERE id = $1',
    [auth.id]
  );
  res.json({ user });
});
