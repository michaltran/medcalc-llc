/**
 * PostgreSQL connection pool cho Vercel serverless
 * Pool được cache global để tái sử dụng connection giữa các invocation (warm start)
 */
const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    const config = process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
        }
      : {
          host: process.env.PGHOST,
          port: Number(process.env.PGPORT) || 5432,
          database: process.env.PGDATABASE,
          user: process.env.PGUSER,
          password: process.env.PGPASSWORD,
          ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
        };

    config.max = 3;
    config.idleTimeoutMillis = 30000;
    config.connectionTimeoutMillis = 10000;

    pool = new Pool(config);
    pool.on('error', (err) => console.error('[pg] pool error:', err));
  }
  return pool;
}

async function query(text, params = []) {
  const result = await getPool().query(text, params);
  return result;
}

async function one(text, params = []) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

async function all(text, params = []) {
  const result = await query(text, params);
  return result.rows;
}

async function insertReturning(text, params = []) {
  const result = await query(text, params);
  return result.rows[0];
}

module.exports = { getPool, query, one, all, insertReturning };
