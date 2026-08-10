import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, buildMeta } from '../utils/pagination.js';

const publicUserSelect = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
  profile: true,
};

export const getMyProfile = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

export const getPublicProfile = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

export const updateMyProfile = async (userId, updates) => {
  const profile = await prisma.profile.update({
    where: { userId },
    data: {
      fullName: updates.fullName,
      bio: updates.bio,
      department: updates.department,
      faculty: updates.faculty,
      phone: updates.phone,
      level: updates.level,
      specialization: updates.specialization,
      avatarUrl: updates.avatarUrl,
    },
  });
  return profile;
};

export const listSupervisors = async (query) => {
  const { page, limit, skip } = getPagination(query);

  const where = {
    role: 'SUPERVISOR',
    isActive: true,
    ...(query.department ? { profile: { department: { equals: query.department, mode: 'insensitive' } } } : {}),
    ...(query.q
      ? {
          profile: {
            OR: [
              { fullName: { contains: query.q, mode: 'insensitive' } },
              { specialization: { contains: query.q, mode: 'insensitive' } },
            ],
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: publicUserSelect,
      skip,
      take: limit,
      orderBy: { profile: { fullName: 'asc' } },
    }),
    prisma.user.count({ where }),
  ]);

  return { items, meta: buildMeta(page, limit, total) };
};
