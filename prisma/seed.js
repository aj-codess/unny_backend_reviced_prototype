// Seeds a baseline tag taxonomy so the Explore/Search screens have facets
// to filter on from day one. Run with: node prisma/seed.js
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TAGS = [
  { name: 'JavaScript', category: 'LANGUAGE' },
  { name: 'TypeScript', category: 'LANGUAGE' },
  { name: 'Python', category: 'LANGUAGE' },
  { name: 'Java', category: 'LANGUAGE' },
  { name: 'React Native', category: 'FRAMEWORK' },
  { name: 'React', category: 'FRAMEWORK' },
  { name: 'Express', category: 'FRAMEWORK' },
  { name: 'Django', category: 'FRAMEWORK' },
  { name: 'Machine Learning', category: 'DOMAIN' },
  { name: 'Mobile Computing', category: 'DOMAIN' },
  { name: 'Cybersecurity', category: 'DOMAIN' },
  { name: 'Health Informatics', category: 'DOMAIN' },
  { name: 'Fintech', category: 'DOMAIN' },
  { name: 'PostgreSQL', category: 'TOOL' },
  { name: 'Docker', category: 'TOOL' },
  { name: 'Agile', category: 'METHODOLOGY' },
];

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  // Deliberately silent no-op if unset — ADMIN accounts are never created
  // through the public /auth/register endpoint (see auth.validator.js),
  // so this is the only way to get a first admin into the system. Safe to
  // leave blank in .env for environments that don't need one yet.
  if (!email || !password) {
    console.log('ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin bootstrap.');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin account already exists (${email}) — skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'ADMIN',
      isVerified: true,
      isEmailVerified: true,
      profile: {
        create: {
          fullName: process.env.ADMIN_FULL_NAME || 'System Administrator',
          department: process.env.ADMIN_DEPARTMENT || 'Administration',
        },
      },
    },
  });

  console.log(`Admin account created: ${email}`);
}

async function main() {
  for (const tag of TAGS) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    });
  }
  // eslint-disable-next-line no-console
  console.log(`Seeded ${TAGS.length} tags.`);

  await seedAdmin();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
