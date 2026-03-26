const { db } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const AiPrompt = {
  create(userId, title, body) {
    const id = uuidv4();
    db.prepare('INSERT INTO ai_prompts (id, user_id, title, body) VALUES (?, ?, ?, ?)').run(id, userId, title, body);
    return this.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM ai_prompts WHERE id = ?').get(id);
  },

  findByUser(userId) {
    return db.prepare('SELECT * FROM ai_prompts WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  },

  update(id, fields) {
    const updates = [];
    const values = [];
    if (fields.title !== undefined) { updates.push('title = ?'); values.push(fields.title); }
    if (fields.body !== undefined) { updates.push('body = ?'); values.push(fields.body); }
    if (updates.length === 0) return this.findById(id);
    values.push(id);
    db.prepare(`UPDATE ai_prompts SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  },

  delete(id) {
    return db.prepare('DELETE FROM ai_prompts WHERE id = ?').run(id);
  },

  isOwnedBy(id, userId) {
    const p = db.prepare('SELECT user_id FROM ai_prompts WHERE id = ?').get(id);
    return p && p.user_id === userId;
  },
};

module.exports = AiPrompt;
