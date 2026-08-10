import prisma from '../config/db.js';

export const listTags = async () => prisma.tag.findMany({ orderBy: { name: 'asc' } });

export const createTag = async ({ name, category }) =>
  prisma.tag.upsert({
    where: { name },
    update: {},
    create: { name, category },
  });

/** Resolves an array of tag ids, filtering out any that don't exist, for use in project create/update. */
export const resolveTagIds = async (tagIds = []) => {
  if (!tagIds.length) return [];
  const tags = await prisma.tag.findMany({ where: { id: { in: tagIds } }, select: { id: true } });
  return tags.map((t) => t.id);
};
