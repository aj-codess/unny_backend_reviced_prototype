// Separate top-level router for responding to a collaboration invite by its
// own id, since that action isn't scoped under a specific project route.
import { Router } from 'express';
import * as collaborationController from '../controllers/collaboration.controller.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { respondCollaborationValidator } from '../validators/collaboration.validator.js';

const router = Router();

router.use(authGuard);
router.patch('/:collaborationId', respondCollaborationValidator, validate, collaborationController.respondToInvite);

export default router;
