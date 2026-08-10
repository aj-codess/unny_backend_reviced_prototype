import { Router } from 'express';
import * as uploadController from '../controllers/upload.controller.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { presignAvatarValidator, presignProjectFileValidator } from '../validators/upload.validator.js';

const router = Router();

router.use(authGuard);

router.post(
  '/project-file',
  restrictTo('STUDENT'),
  presignProjectFileValidator,
  validate,
  uploadController.presignProjectFile,
);
router.post('/avatar', presignAvatarValidator, validate, uploadController.presignAvatar);

export default router;
