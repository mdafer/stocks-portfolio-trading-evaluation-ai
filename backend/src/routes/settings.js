const { Router } = require('express');
const settingsController = require('../controllers/settings');
const { authenticate } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

router.get('/',                   settingsController.getSettings);
router.put('/',                   settingsController.updateSettings);
router.get('/ai/free-models',     settingsController.freeModels);
router.post('/ai/test',           settingsController.testConnection);

module.exports = router;
