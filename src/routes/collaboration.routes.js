import { Router } from 'express';
import * as collaborationController from '../controllers/collaboration.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { inviteCollaboratorValidator, respondCollaborationValidator } from '../validators/collaboration.validator.js';

const router = Router({ mergeParams: true });

router.get('/', collaborationController.listCollaborators);
router.post('/', inviteCollaboratorValidator, validate, collaborationController.inviteCollaborator);
router.delete('/:userId', collaborationController.removeCollaborator);

export default router;
