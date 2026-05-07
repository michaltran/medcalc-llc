const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '..', 'data', 'medcalc.db');

let db;
try {
  // Production: use better-sqlite3 (faster, more features)
  const Database = require('better-sqlite3');
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  console.log('[db] Using better-sqlite3 driver');
} catch (err) {
  // Fallback: Node.js built-in node:sqlite (Node 22+)
  console.log('[db] better-sqlite3 unavailable, falling back to node:sqlite');
  const { DatabaseSync } = require('node:sqlite');
  const native = new DatabaseSync(DB_PATH);
  // Adapter to make node:sqlite mimic better-sqlite3 API used in this project
  db = {
    exec: (sql) => native.exec(sql),
    pragma: (s) => native.exec(`PRAGMA ${s}`),
    prepare: (sql) => {
      const stmt = native.prepare(sql);
      return {
        get: (...args) => stmt.get(...args),
        all: (...args) => stmt.all(...args),
        run: (...args) => {
          const r = stmt.run(...args);
          return { lastInsertRowid: r.lastInsertRowid, changes: r.changes };
        }
      };
    },
    close: () => native.close()
  };
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
}

module.exports = db;
