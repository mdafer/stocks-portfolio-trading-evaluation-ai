const { Router } = require('express');
const listsController = require('../controllers/lists');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { listValidators } = require('../utils/validators');

const router = Router();
router.use(authenticate);

router.get('/',                       listsController.index);
router.post('/',                      listValidators.create, validate, listsController.create);

// Combined multi-list view — must come before /:id
router.get('/compare',                listsController.compare);

// Price sub-routes must come before /:id to avoid ambiguity
router.get('/:id/prices',             listsController.getPrices);
router.post('/:id/prices/refresh',    listsController.refreshPrices);

router.get('/:id',                    listsController.show);
router.put('/:id',                    listValidators.update, validate, listsController.update);
router.delete('/:id',                 listsController.destroy);

module.exports = router;
