import { Router } from 'express';
import * as reviewController from '../controllers/review.controller.js';
import { restrictTo } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { submitReviewValidator } from '../validators/review.validator.js';

const router = Router({ mergeParams: true });

router.get('/', reviewController.listProjectReviews);
router.post('/', restrictTo('SUPERVISOR'), submitReviewValidator, validate, reviewController.submitReview);

export default router;
