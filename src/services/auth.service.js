import bcrypt from 'bcrypt';
import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { issueTokenPair } from './token.service.js';

const SALT_ROUNDS = 12;

const omitPassword = (user) => {
  const { passwordHash, ...safe } = user;
  return safe;
};

export const registerUser = async (input, meta) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  if (input.role === 'STUDENT' && input.matricNumber) {
    const taken = await prisma.profile.findUnique({ where: { matricNumber: input.matricNumber } });
    if (taken) throw new ApiError(409, 'Matric number already registered');
  }

  if (input.role === 'SUPERVISOR' && input.staffId) {
    const taken = await prisma.profile.findUnique({ where: { staffId: input.staffId } });
    if (taken) throw new ApiError(409, 'Staff ID already registered');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: input.role,
      profile: {
        create: {
          fullName: input.fullName,
          department: input.department,
          faculty: input.faculty,
          matricNumber: input.role === 'STUDENT' ? input.matricNumber : null,
          level: input.role === 'STUDENT' ? input.level : null,
          staffId: input.role === 'SUPERVISOR' ? input.staffId : null,
          specialization: input.role === 'SUPERVISOR' ? input.specialization : null,
        },
      },
    },
    include: { profile: true },
  });

  const tokens = await issueTokenPair(user, meta);
  return { user: omitPassword(user), ...tokens };
};

export const loginUser = async (email, password, meta) => {
  const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
  if (!user || !user.isActive) throw new ApiError(401, 'Invalid credentials');

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new ApiError(401, 'Invalid credentials');

  const tokens = await issueTokenPair(user, meta);
  return { user: omitPassword(user), ...tokens };
};
