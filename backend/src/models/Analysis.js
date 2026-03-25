const { db } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const Analysis = {
  create(data) {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO analyses (id, cron_job_id, list_id, user_id, symbol, result, model_used, prompt_tokens, completion_tokens)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.cronJobId || null,
      data.listId,
      data.userId,
      data.symbol || null,
      data.result,
      data.modelUsed || null,
      data.promptTokens || null,
      data.completionTokens || null
    );
    return this.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM analyses WHERE id = ?').get(id);
  },

  findByList(listId, limit = 20) {
    return db.prepare('SELECT * FROM analyses WHERE list_id = ? ORDER BY created_at DESC LIMIT ?').all(listId, limit);
  },

  findByUser(userId, limit = 50) {
    return db.prepare(`
      SELECT a.*, l.name as list_name
      FROM analyses a
      JOIN lists l ON a.list_id = l.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
      LIMIT ?
    `).all(userId, limit);
  },

  delete(id) {
    return db.prepare('DELETE FROM analyses WHERE id = ?').run(id);
  },
};

module.exports = Analysis;
