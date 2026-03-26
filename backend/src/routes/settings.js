const { Router } = require('express');
const settingsController = require('../controllers/settings');
const { authenticate } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

router.get('/',                   settingsController.getSettings);
router.put('/',                   settingsController.updateSettings);
router.get('/ai/free-models',     settingsController.freeModels);
router.post('/ai/test',           settingsController.testConnection);

router.get('/prompts',            settingsController.getPrompts);
router.post('/prompts',           settingsController.createPrompt);
router.put('/prompts/:id',        settingsController.updatePrompt);
router.delete('/prompts/:id',     settingsController.deletePrompt);

module.exports = router;
