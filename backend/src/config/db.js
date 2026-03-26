const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const env = require('./env');

const dbPath = path.resolve(__dirname, '../../', env.db.path);
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initialize() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS stocks (
      id TEXT PRIMARY KEY,
      symbol TEXT NOT NULL,
      name TEXT NOT NULL,
      exchange TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(symbol)
    );

    CREATE TABLE IF NOT EXISTS list_stocks (
      id TEXT PRIMARY KEY,
      list_id TEXT NOT NULL,
      stock_id TEXT NOT NULL,
      allocation REAL,
      allocation_type TEXT DEFAULT 'value',
      added_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
      FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,
      UNIQUE(list_id, stock_id)
    );
  `);

  try { db.exec(`ALTER TABLE list_stocks ADD COLUMN allocation REAL;`); } catch(e){}
  try { db.exec(`ALTER TABLE list_stocks ADD COLUMN allocation_type TEXT DEFAULT 'value';`); } catch(e){}
  try { db.exec(`ALTER TABLE stocks ADD COLUMN currency TEXT;`); } catch(e){}

  db.exec(`
    CREATE TABLE IF NOT EXISTS cron_jobs (
      id TEXT PRIMARY KEY,
      list_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      schedule TEXT NOT NULL,
      user_message TEXT,
      is_active INTEGER DEFAULT 1,
      last_run_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS analyses (
      id TEXT PRIMARY KEY,
      cron_job_id TEXT,
      list_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      symbol TEXT,
      result TEXT NOT NULL,
      model_used TEXT,
      prompt_tokens INTEGER,
      completion_tokens INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (cron_job_id) REFERENCES cron_jobs(id) ON DELETE SET NULL,
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  try {
    db.exec(`ALTER TABLE analyses ADD COLUMN symbol TEXT;`);
  } catch (err) {
    // Column might already exist
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_lists_user_id ON lists(user_id);
    CREATE INDEX IF NOT EXISTS idx_list_stocks_list_id ON list_stocks(list_id);
    CREATE INDEX IF NOT EXISTS idx_list_stocks_stock_id ON list_stocks(stock_id);
    CREATE INDEX IF NOT EXISTS idx_cron_jobs_list_id ON cron_jobs(list_id);
    CREATE INDEX IF NOT EXISTS idx_cron_jobs_user_id ON cron_jobs(user_id);
    CREATE INDEX IF NOT EXISTS idx_analyses_list_id ON analyses(list_id);
    CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);

    CREATE TABLE IF NOT EXISTS stock_prices (
      id TEXT PRIMARY KEY,
      stock_id TEXT NOT NULL,
      period TEXT NOT NULL,
      current_price REAL,
      past_price REAL,
      change_percent REAL,
      current_date TEXT,
      past_date TEXT,
      fetched_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,
      UNIQUE(stock_id, period)
    );

    CREATE INDEX IF NOT EXISTS idx_stock_prices_stock_id ON stock_prices(stock_id);

    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      ai_provider TEXT DEFAULT 'openai',
      ai_base_url TEXT,
      ai_api_key TEXT,
      ai_model TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS analysis_news (
      id TEXT PRIMARY KEY,
      analysis_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      title TEXT NOT NULL,
      link TEXT,
      source TEXT,
      pub_date TEXT,
      FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
    );
  `);

  try { db.exec(`ALTER TABLE analysis_news ADD COLUMN link TEXT;`); } catch(e){}

  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_prompts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_ai_prompts_user_id ON ai_prompts(user_id);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_analysis_news_analysis_id ON analysis_news(analysis_id);
  `);
}

module.exports = { db, initialize };
