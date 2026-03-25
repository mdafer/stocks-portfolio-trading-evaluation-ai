const { db } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const CronJob = {
  create(listId, userId, schedule, userMessage = null) {
    const id = uuidv4();
    db.prepare(
      'INSERT INTO cron_jobs (id, list_id, user_id, schedule, user_message) VALUES (?, ?, ?, ?, ?)'
    ).run(id, listId, userId, schedule, userMessage);
    return this.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM cron_jobs WHERE id = ?').get(id);
  },

  findByUser(userId) {
    return db.prepare(`
      SELECT cj.*, l.name as list_name
      FROM cron_jobs cj
      JOIN lists l ON cj.list_id = l.id
      WHERE cj.user_id = ?
      ORDER BY cj.created_at DESC
    `).all(userId);
  },

  findByList(listId) {
    return db.prepare('SELECT * FROM cron_jobs WHERE list_id = ?').all(listId);
  },

  findAllActive() {
    return db.prepare(`
      SELECT cj.*, l.name as list_name
      FROM cron_jobs cj
      JOIN lists l ON cj.list_id = l.id
      WHERE cj.is_active = 1
    `).all();
  },

  update(id, fields) {
    const allowed = ['schedule', 'user_message', 'is_active'];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(fields)) {
      if (allowed.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(key === 'is_active' ? (value ? 1 : 0) : value);
      }
    }

    if (updates.length === 0) return this.findById(id);

    updates.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE cron_jobs SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  },

  updateLastRun(id) {
    db.prepare("UPDATE cron_jobs SET last_run_at = datetime('now') WHERE id = ?").run(id);
  },

  delete(id) {
    return db.prepare('DELETE FROM cron_jobs WHERE id = ?').run(id);
  },

  isOwnedBy(id, userId) {
    const job = db.prepare('SELECT user_id FROM cron_jobs WHERE id = ?').get(id);
    return job && job.user_id === userId;
  },
};

module.exports = CronJob;
