const { query } = require('./_lib/db');
const { cors } = require('./_lib/auth');

module.exports = cors(async (req, res) => {
  try {
    const r = await query('SELECT 1 AS ok');
    res.json({
      status: 'ok',
      service: 'MedCalc LLC API',
      facility: 'Trung tâm Y tế khu vực Liên Chiểu',
      db_connected: r.rows[0]?.ok === 1,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'degraded',
      db_connected: false,
      error: err.message
    });
  }
});
