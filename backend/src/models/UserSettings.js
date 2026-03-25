const { db } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const PROVIDER_DEFAULTS = {
  openai:      { ai_base_url: 'https://api.openai.com/v1',      ai_model: 'gpt-4o-mini' },
  openrouter:  { ai_base_url: 'https://openrouter.ai/api/v1',   ai_model: 'meta-llama/llama-3.1-8b-instruct:free' },
  custom:      { ai_base_url: '',                                ai_model: '' },
};

function maskKey(key) {
  if (!key) return null;
  if (key.length <= 8) return '••••••••';
  return key.slice(0, 4) + '••••' + key.slice(-4);
}

function isMasked(key) {
  return key && key.includes('••••');
}

const UserSettings = {
  findOrCreate(userId) {
    let row = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
    if (!row) {
      const id = uuidv4();
      db.prepare('INSERT INTO user_settings (id, user_id) VALUES (?, ?)').run(id, userId);
      row = db.prepare('SELECT * FROM user_settings WHERE id = ?').get(id);
    }
    return row;
  },

  // Returns settings safe to send to the client (key masked)
  forClient(userId) {
    const s = this.findOrCreate(userId);
    return {
      ai_provider: s.ai_provider || 'openai',
      ai_base_url: s.ai_base_url || PROVIDER_DEFAULTS[s.ai_provider || 'openai']?.ai_base_url || '',
      ai_api_key:  maskKey(s.ai_api_key),
      ai_api_key_set: !!s.ai_api_key,
      ai_model:    s.ai_model || PROVIDER_DEFAULTS[s.ai_provider || 'openai']?.ai_model || '',
    };
  },

  // Returns settings with the real key for internal AI use
  forAI(userId) {
    const s = this.findOrCreate(userId);
    const provider = s.ai_provider || 'openai';
    const defaults = PROVIDER_DEFAULTS[provider] || {};
    return {
      ai_provider: provider,
      ai_base_url: s.ai_base_url || defaults.ai_base_url || null,
      ai_api_key:  s.ai_api_key  || null,
      ai_model:    s.ai_model    || defaults.ai_model    || null,
    };
  },

  update(userId, fields) {
    const allowed = ['ai_provider', 'ai_base_url', 'ai_model'];
    const updates = [];
    const values  = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }

    // Only update the key if the client sent a real value (not the masked placeholder)
    if (fields.ai_api_key !== undefined && !isMasked(fields.ai_api_key)) {
      updates.push('ai_api_key = ?');
      values.push(fields.ai_api_key || null);
    }

    if (updates.length === 0) return this.forClient(userId);

    updates.push("updated_at = datetime('now')");
    values.push(userId);
    db.prepare(`UPDATE user_settings SET ${updates.join(', ')} WHERE user_id = ?`).run(...values);

    return this.forClient(userId);
  },

  PROVIDER_DEFAULTS,
};

module.exports = UserSettings;
