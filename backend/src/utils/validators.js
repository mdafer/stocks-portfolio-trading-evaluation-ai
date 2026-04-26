const { body, param, query } = require('express-validator');

const authValidators = {
  register: [
    body('email').isEmail({ require_tld: false }).normalizeEmail({ gmail_remove_dots: false }).withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
  ],
  login: [
    body('email').isEmail({ require_tld: false }).normalizeEmail({ gmail_remove_dots: false }).withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
};

const listValidators = {
  create: [
    body('name').trim().notEmpty().withMessage('List name is required'),
    body('description').optional().trim(),
  ],
  update: [
    param('id').notEmpty().withMessage('List ID is required'),
    body('name').optional().trim().notEmpty().withMessage('List name cannot be empty'),
    body('description').optional().trim(),
  ],
};

const stockValidators = {
  search: [
    query('q').trim().notEmpty().withMessage('Search query is required'),
  ],
  addToList: [
    param('listId').notEmpty().withMessage('List ID is required'),
    body('symbol').trim().notEmpty().toUpperCase().withMessage('Stock symbol is required'),
    body('allocation').optional().isFloat().withMessage('Allocation must be a number'),
    body('allocation_type').optional().isIn(['value', 'percent']).withMessage('Allocation type must be value or percent'),
  ],
  updateInList: [
    param('listId').notEmpty().withMessage('List ID is required'),
    param('symbol').trim().notEmpty().toUpperCase().withMessage('Stock symbol is required'),
    body('allocation').notEmpty().isFloat().withMessage('Allocation is required and must be a number'),
    body('allocation_type').notEmpty().isIn(['value', 'percent']).withMessage('Allocation type must be value or percent'),
  ],
  priceChange: [
    param('symbol').trim().notEmpty().toUpperCase().withMessage('Stock symbol is required'),
    query('period').isIn(['1d', '1w', '1m', '1y', '5y', '10y']).withMessage('Period must be one of: 1d, 1w, 1m, 1y, 5y, 10y'),
  ],
};

const cronJobValidators = {
  create: [
    body('list_id').notEmpty().withMessage('List ID is required'),
    body('schedule').notEmpty().withMessage('Cron schedule is required'),
    body('user_message').optional().trim(),
  ],
  update: [
    param('id').notEmpty().withMessage('Cron job ID is required'),
    body('schedule').optional().notEmpty().withMessage('Cron schedule cannot be empty'),
    body('user_message').optional().trim(),
    body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
  ],
};

const analysisValidators = {
  trigger: [
    body('list_id').notEmpty().withMessage('List ID is required'),
    body('user_message').optional().trim(),
  ],
  quick: [
    body('symbols').isArray({ min: 1 }).withMessage('At least one symbol is required'),
    body('user_message').optional().trim(),
  ],
};

module.exports = { authValidators, listValidators, stockValidators, cronJobValidators, analysisValidators };
