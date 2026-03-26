const { Router } = require('express');
const moversController = require('../controllers/movers');
const { authenticate } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

router.get('/', moversController.getMovers);

module.exports = router;
