// Top-level router for a supervisor to act on / list supervision requests
// that aren't naturally scoped under a single project path.
import { Router } from 'express';
import * as supervisionController from '../controllers/supervision.controller.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { respondSupervisionValidator } from '../validators/supervision.validator.js';

const router = Router();

router.use(authGuard);
router.get('/mine', supervisionController.listMySupervisionRequests);
router.patch(
  '/:requestId',
  restrictTo('SUPERVISOR'),
  respondSupervisionValidator,
  validate,
  supervisionController.respondToSupervisionRequest,
);

export default router;
