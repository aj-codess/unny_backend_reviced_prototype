import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from './env.js';

export const s3Client = new S3Client({
  region: config.aws.region,
  credentials: config.aws.accessKeyId
    ? {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      }
    : undefined,
});

/**
 * Generates a time-limited URL the client can PUT a file directly to.
 * Keeps the API server off the request path for large binary uploads and
 * ensures clients never receive long-lived bucket credentials.
 */
export const getPresignedPutUrl = async (key, contentType) => {
  const command = new PutObjectCommand({
    Bucket: config.aws.bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3Client, command, { expiresIn: config.aws.presignExpiresSeconds });
};

export const getPresignedGetUrl = async (key) => {
  const command = new GetObjectCommand({ Bucket: config.aws.bucket, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn: config.aws.presignExpiresSeconds });
};

export const deleteObject = async (key) => {
  const command = new DeleteObjectCommand({ Bucket: config.aws.bucket, Key: key });
  return s3Client.send(command);
};

export const putObjectBuffer = async (key, buffer, contentType) => {
  const command = new PutObjectCommand({
    Bucket: config.aws.bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  return s3Client.send(command);
};
