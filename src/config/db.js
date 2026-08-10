import { PrismaClient } from '../generated/prisma/index.js';
import { config } from './env.js';

const prisma = new PrismaClient({
  log: config.env === 'development' ? ['warn', 'error'] : ['error'],
});

export default prisma;
