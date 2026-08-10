import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, buildMeta } from '../utils/pagination.js';
import { resolveTagIds } from './tag.service.js';
import { removeObject } from './s3.service.js';

const projectListSelect = {
  id: true,
  title: true,
  abstract: true,
  academicYear: true,
  department: true,
  status: true,
  submittedAt: true,
  reviewedAt: true,
  submittedBy: { select: { id: true, profile: { select: { fullName: true, avatarUrl: true } } } },
  supervisor: { select: { id: true, profile: { select: { fullName: true } } } },
  tags: { select: { tag: true } },
};

const projectDetailInclude = {
  submittedBy: { select: { id: true, email: true, profile: true } },
  supervisor: { select: { id: true, email: true, profile: true } },
  tags: { include: { tag: true } },
  collaborators: {
    include: { user: { select: { id: true, profile: { select: { fullName: true, avatarUrl: true } } } } },
  },
  reviews: { include: { reviewer: { select: { id: true, profile: { select: { fullName: true } } } } }, orderBy: { createdAt: 'desc' } },
  comments: {
    include: { author: { select: { id: true, profile: { select: { fullName: true, avatarUrl: true } } } } },
    orderBy: { createdAt: 'asc' },
  },
};

/** True if the user owns the project, is an accepted collaborator, or is the assigned supervisor. */
const canManageProject = (project, userId) =>
  project.submittedById === userId ||
  project.supervisorId === userId ||
  project.collaborators?.some((c) => c.userId === userId && c.status === 'ACCEPTED');

export const createProject = async (userId, input) => {
  const tagIds = await resolveTagIds(input.tagIds);

  const project = await prisma.project.create({
    data: {
      title: input.title,
      abstract: input.abstract,
      academicYear: input.academicYear,
      department: input.department,
      repoUrl: input.repoUrl || null,
      demoUrl: input.demoUrl || null,
      submittedById: userId,
      status: 'DRAFT',
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
      collaborators: { create: { userId, role: 'OWNER', status: 'ACCEPTED', respondedAt: new Date() } },
    },
    include: projectDetailInclude,
  });

  return project;
};

export const getProjectById = async (projectId, requesterId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: projectDetailInclude });
  if (!project) throw new ApiError(404, 'Project not found');

  const isOwnerOrCollaborator = canManageProject(project, requesterId);
  if (project.status !== 'APPROVED' && !isOwnerOrCollaborator && project.supervisorId !== requesterId) {
    throw new ApiError(403, 'You do not have access to this project');
  }

  return project;
};

export const updateProject = async (projectId, userId, updates) => {
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { collaborators: true } });
  if (!project) throw new ApiError(404, 'Project not found');
  if (!canManageProject(project, userId)) throw new ApiError(403, 'Only the owner or collaborators can edit this project');
  if (project.status !== 'DRAFT' && project.status !== 'REJECTED') {
    throw new ApiError(400, 'Only draft or rejected projects can be edited');
  }

  const data = {
    title: updates.title,
    abstract: updates.abstract,
    repoUrl: updates.repoUrl,
    demoUrl: updates.demoUrl,
  };

  if (updates.tagIds) {
    const tagIds = await resolveTagIds(updates.tagIds);
    await prisma.projectTag.deleteMany({ where: { projectId } });
    data.tags = { create: tagIds.map((tagId) => ({ tagId })) };
  }

  return prisma.project.update({ where: { id: projectId }, data, include: projectDetailInclude });
};

export const attachProjectFile = async (projectId, userId, { fileKey, fileUrl }) => {
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { collaborators: true } });
  if (!project) throw new ApiError(404, 'Project not found');
  if (!canManageProject(project, userId)) throw new ApiError(403, 'Only the owner or collaborators can attach a file');

  if (project.fileKey) await removeObject(project.fileKey);

  return prisma.project.update({ where: { id: projectId }, data: { fileKey, fileUrl } });
};

export const submitProject = async (projectId, userId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { collaborators: true } });
  if (!project) throw new ApiError(404, 'Project not found');
  if (project.submittedById !== userId) throw new ApiError(403, 'Only the project owner can submit for review');
  if (!project.fileKey) throw new ApiError(400, 'Attach a project report before submitting');
  if (!['DRAFT', 'REJECTED'].includes(project.status)) {
    throw new ApiError(400, 'Project has already been submitted');
  }
  if (!project.supervisorId) {
    throw new ApiError(400, 'A supervisor must accept your supervision request before you can submit');
  }

  return prisma.project.update({
    where: { id: projectId },
    data: { status: 'PENDING_REVIEW', submittedAt: new Date(), reviewedAt: null },
    include: projectDetailInclude,
  });
};

export const deleteProject = async (projectId, userId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new ApiError(404, 'Project not found');
  if (project.submittedById !== userId) throw new ApiError(403, 'Only the project owner can delete this project');
  if (project.status !== 'DRAFT') throw new ApiError(400, 'Only draft projects can be deleted');

  if (project.fileKey) await removeObject(project.fileKey);
  await prisma.project.delete({ where: { id: projectId } });
};

export const myProjects = async (userId, query) => {
  const { page, limit, skip } = getPagination(query);
  const where = {
    OR: [{ submittedById: userId }, { collaborators: { some: { userId, status: 'ACCEPTED' } } }],
  };

  const [items, total] = await Promise.all([
    prisma.project.findMany({ where, select: projectListSelect, skip, take: limit, orderBy: { updatedAt: 'desc' } }),
    prisma.project.count({ where }),
  ]);

  return { items, meta: buildMeta(page, limit, total) };
};

export const myReviewQueue = async (supervisorId, query) => {
  const { page, limit, skip } = getPagination(query);
  const where = { supervisorId, status: 'PENDING_REVIEW' };

  const [items, total] = await Promise.all([
    prisma.project.findMany({ where, select: projectListSelect, skip, take: limit, orderBy: { submittedAt: 'asc' } }),
    prisma.project.count({ where }),
  ]);

  return { items, meta: buildMeta(page, limit, total) };
};

/**
 * Explore / search across the approved public archive.
 * Uses case-insensitive `contains` matching on title/abstract for portability.
 * For larger catalogs, replace with a Postgres tsvector + GIN index and
 * `to_tsvector(...) @@ plainto_tsquery(...)` for proper ranked full-text search.
 */
export const exploreProjects = async (query) => {
  const { page, limit, skip } = getPagination(query);

  const where = {
    status: 'APPROVED',
    ...(query.academicYear ? { academicYear: Number(query.academicYear) } : {}),
    ...(query.department ? { department: { equals: query.department, mode: 'insensitive' } } : {}),
    ...(query.tag ? { tags: { some: { tag: { name: { equals: query.tag, mode: 'insensitive' } } } } } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: 'insensitive' } },
            { abstract: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.project.findMany({ where, select: projectListSelect, skip, take: limit, orderBy: { reviewedAt: 'desc' } }),
    prisma.project.count({ where }),
  ]);

  return { items, meta: buildMeta(page, limit, total) };
};

export const addComment = async (projectId, authorId, body) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new ApiError(404, 'Project not found');

  return prisma.comment.create({
    data: { projectId, authorId, body },
    include: { author: { select: { id: true, profile: { select: { fullName: true, avatarUrl: true } } } } },
  });
};

export const toggleBookmark = async (projectId, userId) => {
  const existing = await prisma.bookmark.findUnique({ where: { userId_projectId: { userId, projectId } } });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return { bookmarked: false };
  }
  await prisma.bookmark.create({ data: { userId, projectId } });
  return { bookmarked: true };
};

export const myBookmarks = async (userId, query) => {
  const { page, limit, skip } = getPagination(query);
  const where = { userId };

  const [items, total] = await Promise.all([
    prisma.bookmark.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { project: { select: projectListSelect } },
    }),
    prisma.bookmark.count({ where }),
  ]);

  return { items: items.map((b) => b.project), meta: buildMeta(page, limit, total) };
};

export { canManageProject };
