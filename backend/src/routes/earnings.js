const express = require('express');
const { authenticate } = require('../middleware/auth');
const { index, history } = require('../controllers/earnings');

const router = express.Router();
router.use(authenticate);

router.get('/', index);
router.get('/:symbol/history', history);

module.exports = router;
