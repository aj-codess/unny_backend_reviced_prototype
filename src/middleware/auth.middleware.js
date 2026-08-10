import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/jwt.js';
import prisma from '../config/db.js';

/**
 * Verifies the bearer access token and attaches a trimmed user record to
 * req.user. Role checks live separately in role.middleware.js so guards
 * compose cleanly on routes (authGuard, then restrictTo(...)).
 */
export const authGuard = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required');
  }
  const token = header.split(' ')[1];

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired access token');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw new ApiError(401, 'Account no longer accessible');
  }

  req.user = user;
  next();
});
