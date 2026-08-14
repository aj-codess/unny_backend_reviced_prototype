import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/ApiResponse.js';
import * as exploreService from '../services/explore.service.js';

export const explore = asyncHandler(async (req, res) => {
  const result = await exploreService.exploreAll(req.user?.id, req.query);
  success(res, 200, 'Explore results fetched', result);
});
