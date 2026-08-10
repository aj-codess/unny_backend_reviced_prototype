import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/ApiResponse.js';
import * as tagService from '../services/tag.service.js';

export const listTags = asyncHandler(async (req, res) => {
  const tags = await tagService.listTags();
  success(res, 200, 'Tags fetched', tags);
});

export const createTag = asyncHandler(async (req, res) => {
  const tag = await tagService.createTag(req.body);
  success(res, 201, 'Tag created', tag);
});
