import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { createNotification } from './notification.service.js';
import { generateApprovalCertificate } from './certificate.service.js';
import { logger } from '../utils/logger.js';

export const submitReview = async (projectId, reviewerId, { action, comment }) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { submittedBy: { include: { profile: true } }, supervisor: { include: { profile: true } } },
  });
  if (!project) throw new ApiError(404, 'Project not found');
  if (project.supervisorId !== reviewerId) {
    throw new ApiError(403, 'Only the assigned supervisor can review this project');
  }
  if (action !== 'COMMENTED' && project.status !== 'PENDING_REVIEW') {
    throw new ApiError(400, 'Only projects pending review can be approved or rejected');
  }

  const review = await prisma.review.create({
    data: { projectId, reviewerId, action, comment },
  });

  if (action === 'COMMENTED') {
    await createNotification({
      userId: project.submittedById,
      type: 'COMMENT',
      title: 'New supervisor comment',
      message: `Your supervisor left a comment on "${project.title}".`,
      relatedProjectId: projectId,
    });
    return review;
  }

  const newStatus = action === 'APPROVED' ? 'APPROVED' : 'REJECTED';

  let certificateKey = null;
  if (newStatus === 'APPROVED') {
    try {
      certificateKey = await generateApprovalCertificate({
        projectId: project.id,
        studentName: project.submittedBy.profile?.fullName || project.submittedBy.email,
        projectTitle: project.title,
        department: project.department,
        academicYear: project.academicYear,
        supervisorName: project.supervisor?.profile?.fullName,
      });
    } catch (err) {
      // Certificate generation is a nice-to-have; never block an approval on it.
      logger.error('Certificate generation failed', err.message);
    }
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { status: newStatus, reviewedAt: new Date(), ...(certificateKey ? { certificateKey } : {}) },
  });

  await createNotification({
    userId: project.submittedById,
    type: 'REVIEW_DECISION',
    title: `Project ${newStatus === 'APPROVED' ? 'approved' : 'rejected'}`,
    message:
      newStatus === 'APPROVED'
        ? `Congratulations! "${project.title}" has been approved.`
        : `"${project.title}" was rejected. ${comment ? `Reviewer note: ${comment}` : ''}`.trim(),
    relatedProjectId: projectId,
  });

  return review;
};

export const listProjectReviews = async (projectId) =>
  prisma.review.findMany({
    where: { projectId },
    include: { reviewer: { select: { id: true, profile: { select: { fullName: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
