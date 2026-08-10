import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/ApiResponse.js';
import * as authService from '../services/auth.service.js';
import * as tokenService from '../services/token.service.js';

const meta = (req) => ({ userAgent: req.headers['user-agent'], ipAddress: req.ip });

export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body, meta(req));
  success(res, 201, 'Account created successfully', result);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password, meta(req));
  success(res, 200, 'Login successful', result);
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const tokens = await tokenService.rotateRefreshToken(refreshToken, meta(req));
  success(res, 200, 'Token refreshed', tokens);
});

export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await tokenService.revokeRefreshToken(refreshToken);
  success(res, 200, 'Logged out successfully');
});

export const me = asyncHandler(async (req, res) => {
  success(res, 200, 'Current user', req.user);
});
