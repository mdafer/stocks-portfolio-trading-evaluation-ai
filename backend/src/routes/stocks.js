const { Router } = require('express');
const stocksController = require('../controllers/stocks');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { stockValidators } = require('../utils/validators');

const router = Router();

router.use(authenticate);

router.get('/search', stockValidators.search, validate, stocksController.search);
router.get('/:symbol/quote', stocksController.quote);
router.get('/:symbol/price-change', stockValidators.priceChange, validate, stocksController.priceChange);
router.get('/:symbol/news', stocksController.news);
router.post('/lists/:listId', stockValidators.addToList, validate, stocksController.addToList);
router.put('/lists/:listId/:symbol', stockValidators.updateInList, validate, stocksController.updateInList);
router.delete('/lists/:listId/:symbol', stocksController.removeFromList);

module.exports = router;
