const { all, one, insertReturning } = require('../_lib/db');
const { requireAuth, cors } = require('../_lib/auth');

module.exports = cors(async (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;

  const { id } = req.query;

  if (req.method === 'GET') {
    const patient = await one('SELECT * FROM patients WHERE id = $1', [id]);
    if (!patient) return res.status(404).json({ error: 'Không tìm thấy bệnh nhân' });

    const history = await all(
      `SELECT h.*, u.full_name AS user_name
       FROM calculation_history h
       LEFT JOIN users u ON u.id = h.user_id
       WHERE h.patient_id = $1
       ORDER BY h.created_at DESC`,
      [id]
    );
    return res.json({ patient, history });
  }

  if (req.method === 'PUT') {
    const { full_name, date_of_birth, gender, phone, address } = req.body || {};
    const patient = await insertReturning(
      `UPDATE patients SET
        full_name = COALESCE($1, full_name),
        date_of_birth = COALESCE($2, date_of_birth),
        gender = COALESCE($3, gender),
        phone = COALESCE($4, phone),
        address = COALESCE($5, address)
       WHERE id = $6 RETURNING *`,
      [full_name, date_of_birth, gender, phone, address, id]
    );
    if (!patient) return res.status(404).json({ error: 'Không tìm thấy bệnh nhân' });
    return res.json({ patient });
  }

  res.status(405).json({ error: 'Method not allowed' });
});
