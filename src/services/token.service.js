import prisma from '../config/db.js';
import {
  hashToken,
  refreshExpiryDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';

export const issueTokenPair = async (user, meta = {}) => {
  const payload = { sub: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt: refreshExpiryDate(),
    },
  });

  return { accessToken, refreshToken };
};

/** Rotates a refresh token: verifies, revokes the old one, issues a fresh pair. */
export const rotateRefreshToken = async (oldRefreshToken, meta = {}) => {
  let payload;
  try {
    payload = verifyRefreshToken(oldRefreshToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const tokenHash = hashToken(oldRefreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
    throw new ApiError(401, 'Refresh token is no longer valid');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Account no longer accessible');
  }

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { isRevoked: true } });

  return issueTokenPair(user, meta);
};

export const revokeRefreshToken = async (refreshToken) => {
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({ where: { tokenHash }, data: { isRevoked: true } });
};
