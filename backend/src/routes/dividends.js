const express = require('express');
const { authenticate } = require('../middleware/auth');
const { index } = require('../controllers/dividends');

const router = express.Router();
router.use(authenticate);

router.get('/', index);

module.exports = router;
