import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/ApiResponse.js';
import * as adminService from '../services/admin.service.js';

export const listUsers = asyncHandler(async (req, res) => {
  const { items, meta } = await adminService.listUsers(req.query);
  success(res, 200, 'Users fetched', items, meta);
});

export const verifyUser = asyncHandler(async (req, res) => {
  const user = await adminService.verifyUser(req.params.id);
  success(res, 200, 'User verified', user);
});

export const deactivateUser = asyncHandler(async (req, res) => {
  const user = await adminService.deactivateUser(req.params.id);
  success(res, 200, 'User deactivated', user);
});
