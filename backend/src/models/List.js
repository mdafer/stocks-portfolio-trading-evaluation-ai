const { db } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const List = {
  create(userId, name, description = null) {
    const id = uuidv4();
    db.prepare('INSERT INTO lists (id, user_id, name, description) VALUES (?, ?, ?, ?)').run(id, userId, name, description);
    return this.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM lists WHERE id = ?').get(id);
  },

  findByUser(userId) {
    return db.prepare('SELECT * FROM lists WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  },

  update(id, fields) {
    const allowed = ['name', 'description'];
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

    db.prepare(`UPDATE lists SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  },

  delete(id) {
    return db.prepare('DELETE FROM lists WHERE id = ?').run(id);
  },

  isOwnedBy(id, userId) {
    const list = db.prepare('SELECT user_id FROM lists WHERE id = ?').get(id);
    return list && list.user_id === userId;
  },
};

module.exports = List;
