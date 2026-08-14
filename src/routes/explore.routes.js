import { Router } from 'express';
import * as exploreController from '../controllers/explore.controller.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { exploreValidator } from '../validators/explore.validator.js';

const router = Router();

router.get('/', authGuard, exploreValidator, validate, exploreController.explore);

export default router;
