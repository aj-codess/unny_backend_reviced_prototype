import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { createNotification } from './notification.service.js';

export const inviteCollaborator = async (projectId, ownerId, invitedUserId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new ApiError(404, 'Project not found');
  if (project.submittedById !== ownerId) throw new ApiError(403, 'Only the project owner can invite collaborators');
  if (invitedUserId === ownerId) throw new ApiError(400, 'You are already the owner of this project');

  const invitee = await prisma.user.findUnique({ where: { id: invitedUserId } });
  if (!invitee || invitee.role !== 'STUDENT') throw new ApiError(400, 'Collaborators must be registered students');

  const existing = await prisma.projectCollaborator.findUnique({
    where: { projectId_userId: { projectId, userId: invitedUserId } },
  });
  if (existing) throw new ApiError(409, 'This user has already been invited to this project');

  const collaboration = await prisma.projectCollaborator.create({
    data: { projectId, userId: invitedUserId, role: 'COLLABORATOR', status: 'INVITED' },
  });

  await createNotification({
    userId: invitedUserId,
    type: 'COLLABORATION_INVITE',
    title: 'New collaboration invite',
    message: `You've been invited to collaborate on "${project.title}".`,
    relatedProjectId: projectId,
  });

  return collaboration;
};

export const respondToInvite = async (collaborationId, userId, status) => {
  const collaboration = await prisma.projectCollaborator.findUnique({
    where: { id: collaborationId },
    include: { project: true },
  });
  if (!collaboration) throw new ApiError(404, 'Invitation not found');
  if (collaboration.userId !== userId) throw new ApiError(403, 'This invitation does not belong to you');
  if (collaboration.status !== 'INVITED') throw new ApiError(400, 'This invitation has already been responded to');

  const updated = await prisma.projectCollaborator.update({
    where: { id: collaborationId },
    data: { status, respondedAt: new Date() },
  });

  await createNotification({
    userId: collaboration.project.submittedById,
    type: 'COLLABORATION_RESPONSE',
    title: 'Collaboration response',
    message: `Your collaboration invite for "${collaboration.project.title}" was ${status.toLowerCase()}.`,
    relatedProjectId: collaboration.projectId,
  });

  return updated;
};

export const listCollaborators = async (projectId) =>
  prisma.projectCollaborator.findMany({
    where: { projectId },
    include: { user: { select: { id: true, profile: { select: { fullName: true, avatarUrl: true } } } } },
  });

export const removeCollaborator = async (projectId, ownerId, collaboratorUserId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new ApiError(404, 'Project not found');
  if (project.submittedById !== ownerId) throw new ApiError(403, 'Only the project owner can remove collaborators');

  await prisma.projectCollaborator.deleteMany({
    where: { projectId, userId: collaboratorUserId, role: { not: 'OWNER' } },
  });
};
