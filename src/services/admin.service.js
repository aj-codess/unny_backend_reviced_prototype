import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, buildMeta } from '../utils/pagination.js';
import { createNotification } from './notification.service.js';

const adminUserSelect = {
  id: true,
  email: true,
  role: true,
  isVerified: true,
  isActive: true,
  createdAt: true,
  profile: true,
};

/** ?role=STUDENT|SUPERVISOR&verified=true|false — omit either to see everyone. */
export const listUsers = async (query) => {
  const { page, limit, skip } = getPagination(query);

  const where = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.verified !== undefined ? { isVerified: query.verified === 'true' } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, select: adminUserSelect, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.user.count({ where }),
  ]);

  return { items, meta: buildMeta(page, limit, total) };
};

export const verifyUser = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found');
  if (user.isVerified) throw new ApiError(400, 'User is already verified');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isVerified: true },
    select: adminUserSelect,
  });

  await createNotification({
    userId,
    type: 'ACCOUNT_VERIFIED',
    title: 'Account verified',
    message: 'Your account has been verified by an administrator. You now have full access to Unny.',
  });

  return updated;
};

/** Suspends an account (e.g. a fraudulent registration) without deleting its history. */
export const deactivateUser = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found');

  return prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
    select: adminUserSelect,
  });
};
