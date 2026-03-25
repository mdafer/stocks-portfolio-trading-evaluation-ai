const { db } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

const User = {
  create(email, password, name) {
    const id = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
    const stmt = db.prepare('INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)');
    stmt.run(id, email, hashedPassword, name);
    return this.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?').get(id);
  },

  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  },

  update(id, fields) {
    const allowed = ['name', 'email'];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(fields)) {
      if (allowed.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) return this.findById(id);

    updates.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  },
};

module.exports = User;
