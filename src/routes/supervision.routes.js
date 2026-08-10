import { Router } from 'express';
import * as supervisionController from '../controllers/supervision.controller.js';
import { restrictTo } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { requestSupervisionValidator } from '../validators/supervision.validator.js';

const router = Router({ mergeParams: true });

router.post(
  '/',
  restrictTo('STUDENT'),
  requestSupervisionValidator,
  validate,
  supervisionController.requestSupervision,
);

export default router;
