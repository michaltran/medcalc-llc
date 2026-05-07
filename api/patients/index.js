const { all, insertReturning } = require('../_lib/db');
const { requireAuth, cors } = require('../_lib/auth');

module.exports = cors(async (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    const q = (req.query.q || '').trim();
    let rows;
    if (q) {
      const like = `%${q}%`;
      rows = await all(
        `SELECT * FROM patients
         WHERE medical_record_number ILIKE $1 OR full_name ILIKE $1 OR phone ILIKE $1
         ORDER BY created_at DESC LIMIT 50`,
        [like]
      );
    } else {
      rows = await all('SELECT * FROM patients ORDER BY created_at DESC LIMIT 50');
    }
    return res.json({ patients: rows });
  }

  if (req.method === 'POST') {
    const { medical_record_number, full_name, date_of_birth, gender, phone, address } = req.body || {};
    if (!medical_record_number || !full_name) {
      return res.status(400).json({ error: 'Mã bệnh án và họ tên là bắt buộc' });
    }
    try {
      const patient = await insertReturning(
        `INSERT INTO patients (medical_record_number, full_name, date_of_birth, gender, phone, address, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [medical_record_number, full_name, date_of_birth || null, gender || null, phone || null, address || null, auth.id]
      );
      return res.status(201).json({ patient });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Mã bệnh án đã tồn tại' });
      }
      throw err;
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
});
