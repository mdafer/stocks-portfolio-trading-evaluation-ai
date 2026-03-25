const env = require('../config/env');

const SQLITE_CODES = {
  SQLITE_CONSTRAINT_UNIQUE: { status: 409, message: 'Resource already exists' },
  SQLITE_CONSTRAINT_FOREIGNKEY: { status: 422, message: 'Referenced resource does not exist' },
  SQLITE_CONSTRAINT_NOTNULL: { status: 422, message: 'Required field is missing' },
  SQLITE_BUSY: { status: 503, message: 'Database busy, please retry' },
};

function errorHandler(err, req, res, _next) {
  // SQLite errors
  if (err.code && SQLITE_CODES[err.code]) {
    const mapped = SQLITE_CODES[err.code];
    return res.status(mapped.status).json({ success: false, message: mapped.message });
  }

  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
  }

  // Upstream fetch failures (e.g. stock API unreachable)
  if (err.cause?.code === 'ECONNREFUSED' || err.name === 'TypeError' && err.message.includes('fetch')) {
    return res.status(502).json({ success: false, message: 'External service unavailable' });
  }

  // JWT errors (should be caught in middleware but guard here too)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token has expired' });
  }

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} — ${err.message}`, env.isDev ? err.stack : '');

  return res.status(500).json({
    success: false,
    message: env.isDev ? err.message : 'Internal server error',
  });
}

module.exports = { errorHandler };
