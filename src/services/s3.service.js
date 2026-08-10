import { randomUUID } from 'crypto';
import { getPresignedGetUrl, getPresignedPutUrl, deleteObject } from '../config/s3.js';

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-');

export const buildProjectFileKey = (projectId, fileName) =>
  `projects/${projectId}/report-${randomUUID()}-${slugify(fileName)}`;

export const buildAvatarKey = (userId, fileName) => `avatars/${userId}-${randomUUID()}-${slugify(fileName)}`;

export const presignUpload = async (key, contentType) => getPresignedPutUrl(key, contentType);

export const presignDownload = async (key) => getPresignedGetUrl(key);

export const removeObject = async (key) => {
  if (!key) return;
  await deleteObject(key);
};
