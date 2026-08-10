import { Router } from 'express';
import * as tagController from '../controllers/tag.controller.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createTagValidator } from '../validators/tag.validator.js';

const router = Router();

router.get('/', tagController.listTags);
router.post('/', authGuard, createTagValidator, validate, tagController.createTag);

export default router;
