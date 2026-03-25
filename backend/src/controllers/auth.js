const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const { success, created, error, unauthorized } = require('../utils/response');

function generateToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;

    const existing = User.findByEmail(email);
    if (existing) {
      return error(res, 'Email already registered', 409);
    }

    const user = User.create(email, password, name);
    const token = generateToken(user);

    return created(res, { user, token });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = User.findByEmail(email);
    if (!user || !User.verifyPassword(password, user.password)) {
      return unauthorized(res, 'Invalid email or password');
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return success(res, { user: userWithoutPassword, token });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = User.findById(req.user.id);
    if (!user) return unauthorized(res, 'User not found');
    return success(res, { user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
