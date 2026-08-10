import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { rateLimiter } from '../middleware/rateLimiter.middleware.js';
import { registerValidator, loginValidator, refreshValidator } from '../validators/auth.validator.js';

const router = Router();

router.post('/register', rateLimiter({ max: 20 }), registerValidator, validate, authController.register);
router.post('/login', rateLimiter({ max: 30 }), loginValidator, validate, authController.login);
router.post('/refresh', refreshValidator, validate, authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authGuard, authController.me);

export default router;
