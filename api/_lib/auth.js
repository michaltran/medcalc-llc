/**
 * Auth helpers cho Vercel serverless functions
 * Dùng pattern: const user = requireAuth(req); if (!user) return; (đã response 401)
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE-ME';

/**
 * Verify JWT, return user payload or null (đã set response 401)
 */
function requireAuth(req, res) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !String(authHeader).startsWith('Bearer ')) {
    res.status(401).json({ error: 'Chưa xác thực' });
    return null;
  }
  const token = String(authHeader).slice(7);
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    return null;
  }
}

function requireRole(req, res, roles) {
  const user = requireAuth(req, res);
  if (!user) return null;
  if (!roles.includes(user.role)) {
    res.status(403).json({ error: 'Không đủ quyền truy cập' });
    return null;
  }
  return user;
}

/**
 * CORS wrapper cho serverless functions
 */
function cors(handler) {
  return async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    try {
      await handler(req, res);
    } catch (err) {
      console.error('[api error]', err);
      res.status(500).json({ error: 'Lỗi máy chủ', detail: err.message });
    }
  };
}

module.exports = { JWT_SECRET, requireAuth, requireRole, cors };
