const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { unauthorized } = require('../utils/response');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return unauthorized(res, 'Access token is required');
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'Token has expired');
    }
    return unauthorized(res, 'Invalid token');
  }
}

module.exports = { authenticate };
