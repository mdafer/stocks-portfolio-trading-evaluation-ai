const { Router } = require('express');
const authController = require('../controllers/auth');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authValidators } = require('../utils/validators');

const router = Router();

router.post('/register', authValidators.register, validate, authController.register);
router.post('/login', authValidators.login, validate, authController.login);
router.get('/me', authenticate, authController.me);

module.exports = router;
