/**
 * MedCalc LLC - Backend API Server
 * Trung tâm Y tế khu vực Liên Chiểu
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const historyRoutes = require('./routes/history');
const protocolRoutes = require('./routes/protocols');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: ['https://medcalc-llc.vercel.app', /\.vercel\.app$/, 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MedCalc LLC API',
    facility: 'Trung tâm Y tế khu vực Liên Chiểu',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/protocols', protocolRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Lỗi máy chủ', detail: err.message });
});

app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════════════════╗`);
  console.log(`║  MedCalc LLC Backend                               ║`);
  console.log(`║  Trung tâm Y tế khu vực Liên Chiểu                 ║`);
  console.log(`║  Listening on http://localhost:${PORT}              ║`);
  console.log(`╚════════════════════════════════════════════════════╝\n`);
});
