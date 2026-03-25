const app = require('./app');
const env = require('./config/env');
const { initialize } = require('./config/db');
const { initializeJobs } = require('./helpers/cronManager');

// Initialize database tables
initialize();
console.log('[DB] Database initialized');

// Load active cron jobs
initializeJobs();

app.listen(env.port, () => {
  console.log(`[Server] Running on port ${env.port} (${env.nodeEnv})`);
});
