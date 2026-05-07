const { all, insertReturning } = require('../_lib/db');
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

  if (req.method === 'POST') {
    const { patient_id, calculator_id, calculator_name, inputs, result, interpretation, notes } = req.body || {};
    if (!calculator_id || !calculator_name || !inputs || !result) {
      return res.status(400).json({ error: 'Thiếu thông tin tính toán' });
    }
    const entry = await insertReturning(
      `INSERT INTO calculation_history
        (user_id, patient_id, calculator_id, calculator_name, inputs_json, result_json, interpretation, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [auth.id, patient_id || null, calculator_id, calculator_name,
       JSON.stringify(inputs), JSON.stringify(result), interpretation || null, notes || null]
    );
    return res.status(201).json({ entry: parseRow(entry) });
  }

  if (req.method === 'GET') {
    const { patient_id, calculator_id, limit = 50 } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;
    if (patient_id) { conditions.push(`h.patient_id = $${idx++}`); params.push(patient_id); }
    if (calculator_id) { conditions.push(`h.calculator_id = $${idx++}`); params.push(calculator_id); }
    if (auth.role !== 'admin' && !patient_id) {
      conditions.push(`h.user_id = $${idx++}`); params.push(auth.id);
    }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    params.push(Number(limit));

    const rows = await all(
      `SELECT h.*, u.full_name AS user_name, p.full_name AS patient_name, p.medical_record_number
       FROM calculation_history h
       LEFT JOIN users u ON u.id = h.user_id
       LEFT JOIN patients p ON p.id = h.patient_id
       ${where} ORDER BY h.created_at DESC LIMIT $${idx}`,
      params
    );
    return res.json({ history: rows.map(parseRow) });
  }

  res.status(405).json({ error: 'Method not allowed' });
});
