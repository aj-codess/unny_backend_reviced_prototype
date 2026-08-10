import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/ApiResponse.js';
import * as userService from '../services/user.service.js';

export const getMe = asyncHandler(async (req, res) => {
  const profile = await userService.getMyProfile(req.user.id);
  success(res, 200, 'Profile fetched', profile);
});

export const updateMe = asyncHandler(async (req, res) => {
  const profile = await userService.updateMyProfile(req.user.id, req.body);
  success(res, 200, 'Profile updated', profile);
});

export const getUserById = asyncHandler(async (req, res) => {
  const profile = await userService.getPublicProfile(req.params.id);
  success(res, 200, 'User fetched', profile);
});

export const listSupervisors = asyncHandler(async (req, res) => {
  const { items, meta } = await userService.listSupervisors(req.query);
  success(res, 200, 'Supervisors fetched', items, meta);
});
