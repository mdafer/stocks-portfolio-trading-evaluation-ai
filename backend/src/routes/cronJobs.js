const { Router } = require('express');
const cronJobsController = require('../controllers/cronJobs');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { cronJobValidators } = require('../utils/validators');

const router = Router();

router.use(authenticate);

router.get('/', cronJobsController.index);
router.get('/:id', cronJobsController.show);
router.post('/', cronJobValidators.create, validate, cronJobsController.create);
router.put('/:id', cronJobValidators.update, validate, cronJobsController.update);
router.delete('/:id', cronJobsController.destroy);

module.exports = router;
