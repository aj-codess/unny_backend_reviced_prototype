// Seeds a baseline tag taxonomy so the Explore/Search screens have facets
// to filter on from day one. Run with: node prisma/seed.js
import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

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
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
