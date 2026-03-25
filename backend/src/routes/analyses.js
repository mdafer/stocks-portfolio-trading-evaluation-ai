const { Router } = require('express');
const analysesController = require('../controllers/analyses');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { analysisValidators } = require('../utils/validators');

const router = Router();

router.use(authenticate);

router.get('/', analysesController.index);
router.get('/list/:listId', analysesController.byList);
router.get('/:id/news', analysesController.news);
router.get('/:id', analysesController.show);
router.post('/trigger', analysisValidators.trigger, validate, analysesController.trigger);
router.delete('/:id', analysesController.destroy);

module.exports = router;
