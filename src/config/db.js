import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/index.js';
import { config } from './env.js';

const adapter = new PrismaPg({ connectionString: config.db.url });

const prisma = new PrismaClient({
  adapter,
  log: config.env === 'development' ? ['warn', 'error'] : ['error'],
});

export default prisma;