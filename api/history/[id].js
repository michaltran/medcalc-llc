const { one, query } = require('../_lib/db');
const { requireAuth, cors } = require('../_lib/auth');

function parseRow(row) {
  return {
    ...row,
    inputs: typeof row.inputs_json === 'string' ? JSON.parse(row.inputs_json) : row.inputs_json,
    result: typeof row.result_json === 'string' ? JSON.parse(row.result_json) : row.result_json
  };
}

module.exports = cors(async (req, res) => {
  const auth = requireAuth(req, res);
  if (!auth) return;
  const { id } = req.query;

  if (req.method === 'GET') {
    const entry = await one(
      `SELECT h.*, u.full_name AS user_name, p.full_name AS patient_name,
              p.medical_record_number, p.date_of_birth, p.gender
       FROM calculation_history h
       LEFT JOIN users u ON u.id = h.user_id
       LEFT JOIN patients p ON p.id = h.patient_id
       WHERE h.id = $1`,
      [id]
    );
    if (!entry) return res.status(404).json({ error: 'Không tìm thấy bản ghi' });
    return res.json({ entry: parseRow(entry) });
  }

  if (req.method === 'DELETE') {
    const row = await one('SELECT user_id FROM calculation_history WHERE id = $1', [id]);
    if (!row) return res.status(404).json({ error: 'Không tìm thấy' });
    if (auth.role !== 'admin' && row.user_id !== auth.id) {
      return res.status(403).json({ error: 'Không có quyền xóa' });
    }
    await query('DELETE FROM calculation_history WHERE id = $1', [id]);
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
});
