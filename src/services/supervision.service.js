import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { createNotification } from './notification.service.js';

export const requestSupervision = async (projectId, studentId, supervisorId, message) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new ApiError(404, 'Project not found');
  if (project.submittedById !== studentId) throw new ApiError(403, 'Only the project owner can request a supervisor');

  const supervisor = await prisma.user.findUnique({ where: { id: supervisorId } });
  if (!supervisor || supervisor.role !== 'SUPERVISOR') throw new ApiError(400, 'Invalid supervisor');

  const existing = await prisma.supervisionRequest.findUnique({
    where: { projectId_supervisorId: { projectId, supervisorId } },
  });
  if (existing) throw new ApiError(409, 'A supervision request has already been sent to this supervisor');

  const request = await prisma.supervisionRequest.create({
    data: { projectId, requesterId: studentId, supervisorId, message },
  });

  await createNotification({
    userId: supervisorId,
    type: 'SUPERVISION_REQUEST',
    title: 'New supervision request',
    message: `A student has requested you supervise "${project.title}".`,
    relatedProjectId: projectId,
  });

  return request;
};

export const respondToSupervisionRequest = async (requestId, supervisorId, status) => {
  const request = await prisma.supervisionRequest.findUnique({ where: { id: requestId }, include: { project: true } });
  if (!request) throw new ApiError(404, 'Supervision request not found');
  if (request.supervisorId !== supervisorId) throw new ApiError(403, 'This request was not sent to you');
  if (request.status !== 'PENDING') throw new ApiError(400, 'This request has already been responded to');

  const updated = await prisma.$transaction(async (tx) => {
    const req = await tx.supervisionRequest.update({
      where: { id: requestId },
      data: { status, respondedAt: new Date() },
    });

    if (status === 'ACCEPTED') {
      await tx.project.update({ where: { id: request.projectId }, data: { supervisorId } });
    }

    return req;
  });

  await createNotification({
    userId: request.requesterId,
    type: 'SUPERVISION_RESPONSE',
    title: 'Supervision request update',
    message: `Your supervision request for "${request.project.title}" was ${status.toLowerCase()}.`,
    relatedProjectId: request.projectId,
  });

  return updated;
};

export const listMySupervisionRequests = async (userId, role) =>
  role === 'SUPERVISOR'
    ? prisma.supervisionRequest.findMany({
        where: { supervisorId: userId },
        include: { project: { select: { id: true, title: true, department: true, academicYear: true } } },
        orderBy: { createdAt: 'desc' },
      })
    : prisma.supervisionRequest.findMany({
        where: { requesterId: userId },
        include: { supervisor: { select: { id: true, profile: { select: { fullName: true } } } } },
        orderBy: { createdAt: 'desc' },
      });
