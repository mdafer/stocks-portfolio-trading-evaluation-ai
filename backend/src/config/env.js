const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  db: {
    path: process.env.DB_PATH || './data/stock_eval.db',
  },

  stockApi: {
    key: process.env.STOCK_API_KEY,
    baseUrl: process.env.STOCK_API_BASE_URL || 'https://www.alphavantage.co/query',
    retryLimit: parseInt(process.env.STOCK_API_RETRY_LIMIT, 10) || 3,
    requestDelay: parseInt(process.env.STOCK_API_DELAY_MS, 10) || 500,
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },
};

// Validate required env vars
const required = ['JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = env;
