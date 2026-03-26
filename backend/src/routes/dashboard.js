const { Router } = require('express');
const dashboardController = require('../controllers/dashboard');
const { authenticate } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

router.get('/summary', dashboardController.getSummary);
router.get('/movers', dashboardController.getMovers);
router.get('/market-movers', dashboardController.getMarketMoversEndpoint);
router.get('/news-feed', dashboardController.getNewsFeed);

module.exports = router;
