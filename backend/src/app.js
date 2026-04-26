const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const listRoutes = require('./routes/lists');
const stockRoutes = require('./routes/stocks');
const cronJobRoutes = require('./routes/cronJobs');
const analysisRoutes  = require('./routes/analyses');
const settingsRoutes  = require('./routes/settings');
const dashboardRoutes = require('./routes/dashboard');
const dividendRoutes  = require('./routes/dividends');
const moversRoutes    = require('./routes/movers');
const earningsRoutes  = require('./routes/earnings');

const app = express();

// Trust the first proxy to avoid `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` with `express-rate-limit`
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/cron-jobs', cronJobRoutes);
app.use('/api/analyses', analysisRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/dividends', dividendRoutes);
app.use('/api/movers',   moversRoutes);
app.use('/api/earnings', earningsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
