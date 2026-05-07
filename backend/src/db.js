/**
 * PostgreSQL connection pool
 * Hỗ trợ cả Express server (long-lived) và Vercel serverless (short-lived)
 */
const { Pool } = require('pg');
require('dotenv').config();

const config = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      database: process.env.PGDATABASE || 'medcalc_db',
      user: process.env.PGUSER || 'medcalc_user',
      password: process.env.PGPASSWORD || '',
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
    };

// Connection pool sizing:
// - Express server: 10-20 connections is fine
// - Vercel serverless: keep low (1-3) since each function spawns its own
config.max = process.env.VERCEL ? 3 : 10;
config.idleTimeoutMillis = 30000;
config.connectionTimeoutMillis = 10000;

const pool = new Pool(config);

pool.on('error', (err) => {
  console.error('[pg] Unexpected pool error:', err);
});

/**
 * Helper: execute a query, return rows
 */
async function query(text, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

/**
 * Helper: get one row
 */
async function one(text, params = []) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

/**
 * Helper: get all rows
 */
async function all(text, params = []) {
  const result = await query(text, params);
  return result.rows;
}

/**
 * Helper: insert and return the inserted row
 */
async function insertReturning(text, params = []) {
  const result = await query(text, params);
  return result.rows[0];
}

module.exports = { pool, query, one, all, insertReturning };
