import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/ApiResponse.js';
import * as reviewService from '../services/review.service.js';

export const submitReview = asyncHandler(async (req, res) => {
  const review = await reviewService.submitReview(req.params.projectId, req.user.id, req.body);
  success(res, 201, 'Review recorded', review);
});

export const listProjectReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewService.listProjectReviews(req.params.projectId);
  success(res, 200, 'Reviews fetched', reviews);
});
