import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { listUsersValidator, userIdValidator } from '../validators/admin.validator.js';

const router = Router();

router.use(authGuard, restrictTo('ADMIN'));

router.get('/users', listUsersValidator, validate, adminController.listUsers);
router.patch('/users/:id/verify', userIdValidator, validate, adminController.verifyUser);
router.patch('/users/:id/deactivate', userIdValidator, validate, adminController.deactivateUser);

export default router;
