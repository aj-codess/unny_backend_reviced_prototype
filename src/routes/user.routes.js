import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { updateProfileValidator, userIdValidator, listSupervisorsValidator } from '../validators/user.validator.js';

const router = Router();

router.use(authGuard);

router.get('/me', userController.getMe);
router.patch('/me', updateProfileValidator, validate, userController.updateMe);
router.get('/supervisors', listSupervisorsValidator, validate, userController.listSupervisors);
router.get('/:id', userIdValidator, validate, userController.getUserById);

export default router;
