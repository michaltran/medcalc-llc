const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { one } = require('../_lib/db');
const { JWT_SECRET, cors } = require('../_lib/auth');

module.exports = cors(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }

  const user = await one('SELECT * FROM users WHERE username = $1 AND is_active = TRUE', [username]);
  if (!user) return res.status(401).json({ error: 'Tài khoản không tồn tại' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Mật khẩu không đúng' });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({
    token,
    user: {
      id: user.id, username: user.username, full_name: user.full_name,
      role: user.role, department: user.department
    }
  });
});
