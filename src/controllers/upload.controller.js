import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import prisma from '../config/db.js';
import { buildAvatarKey, buildProjectFileKey } from '../services/s3.service.js';
import { presignUpload } from '../services/storage.service.js';
import { attachProjectFile } from '../services/project.service.js';

/**
 * Returns a presigned S3 PUT URL. The client uploads the binary directly to
 * S3, then calls the relevant "attach" endpoint (or PATCH profile for
 * avatars) with the returned key so the backend never proxies file bytes.
 */
export const presignProjectFile = asyncHandler(async (req, res) => {
  const { projectId, fileName, contentType } = req.body;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new ApiError(404, 'Project not found');
  if (project.submittedById !== req.user.id) {
    throw new ApiError(403, 'Only the project owner can upload the report');
  }

  const key = buildProjectFileKey(projectId, fileName);
  const uploadUrl = await presignUpload(key, contentType);

  // Immediately record the key against the project so it's tracked even
  // before the client finishes the direct-to-S3 upload.
  await attachProjectFile(projectId, req.user.id, { fileKey: key, fileUrl: null });

  success(res, 200, 'Presigned upload URL generated', { uploadUrl, key });
});

export const presignAvatar = asyncHandler(async (req, res) => {
  const { fileName, contentType } = req.body;
  const key = buildAvatarKey(req.user.id, fileName);
  const uploadUrl = await presignUpload(key, contentType);
  success(res, 200, 'Presigned upload URL generated', { uploadUrl, key });
});
