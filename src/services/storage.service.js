import { config } from '../config/env.js';
import {
  presignUpload as s3PresignUpload,
  presignDownload as s3PresignDownload,
  removeObject as s3RemoveObject,
} from './s3.service.js';
import { putObjectBuffer as s3PutObjectBuffer } from '../config/s3.js';
import {
  presignLocalUpload,
  presignLocalDownload,
  deleteLocalFile,
  writeLocalBuffer,
} from './localStorage.service.js';
import { logger } from '../utils/logger.js';

/**
 * Single entry point every service/controller should import for file
 * storage (uploads, certificates, avatars). Whether the bytes actually end
 * up in S3 or on local disk is decided here, once, based on whether AWS
 * credentials are configured — nothing else in the codebase needs to know
 * or care which backend is active.
 */
export const isUsingS3 = () =>
  Boolean(config.aws.bucket && config.aws.accessKeyId && config.aws.secretAccessKey);

let announced = false;
const announceOnce = () => {
  if (announced) return;
  announced = true;
  logger.info(
    isUsingS3()
      ? `File storage backend: S3 (bucket: ${config.aws.bucket})`
      : `File storage backend: local disk (AWS not configured) — falling back to ${config.localStorage.dir}`,
  );
};

export const presignUpload = async (key, contentType) => {
  announceOnce();
  return isUsingS3() ? s3PresignUpload(key, contentType) : presignLocalUpload(key, contentType);
};

export const presignDownload = async (key) => {
  announceOnce();
  return isUsingS3() ? s3PresignDownload(key) : presignLocalDownload(key);
};

export const removeObject = async (key) => {
  if (!key) return;
  return isUsingS3() ? s3RemoveObject(key) : deleteLocalFile(key);
};

export const putObjectBuffer = async (key, buffer, contentType) => {
  announceOnce();
  return isUsingS3() ? s3PutObjectBuffer(key, buffer, contentType) : writeLocalBuffer(key, buffer, contentType);
};
