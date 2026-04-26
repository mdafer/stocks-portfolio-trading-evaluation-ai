const path = require('path');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const { v4: uuid } = require('uuid');

const dbPath = process.env.DB_PATH_ABS || '/app/data/stock_eval.db';
const email = 'admin@localhost';
const password = 'admin1234';
const name = 'Admin User';

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

const hash = bcrypt.hashSync(password, 10);
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

if (existing) {
  db.prepare(`UPDATE users SET password = ?, updated_at = datetime('now') WHERE email = ?`).run(hash, email);
  console.log('Updated existing user:', email);
} else {
  db.prepare('INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)').run(uuid(), email, hash, name);
  console.log('Created user:', email);
}

console.log('All users:', db.prepare('SELECT id, email, name FROM users').all());
console.log('Login credentials → email:', email, '| password:', password);
