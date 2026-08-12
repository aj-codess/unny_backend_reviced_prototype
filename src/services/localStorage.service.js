import fs from 'fs/promises';
import fssync from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config/env.js';

// All local files live under this root, resolved relative to the project's
// working directory. Object keys (e.g. "projects/<id>/report-....pdf")
// become the relative path inside this folder.
const ROOT = path.resolve(process.cwd(), config.localStorage.dir);

const resolvePath = (key) => {
  const safeKey = key.replace(/^\/+/, '');
  const full = path.resolve(ROOT, safeKey);
  if (!full.startsWith(ROOT)) {
    // Blocks "../../etc/passwd"-style key traversal.
    throw new Error('Invalid storage key');
  }
  return full;
};

const metaPath = (key) => `${resolvePath(key)}.meta.json`;

const sign = (payload) =>
  crypto.createHmac('sha256', config.localStorage.uploadSecret).update(payload).digest('hex');

const encodeKeyForUrl = (key) => key.split('/').map(encodeURIComponent).join('/');

/**
 * Builds a time-limited signed URL, mirroring what an S3 presigned URL gives
 * the client: a self-contained link that authorizes exactly one operation
 * (PUT or GET) on exactly one key until it expires. No Authorization header
 * needed to use it — the signature in the query string *is* the credential.
 */
const buildSignedUrl = (key, purpose, contentType) => {
  const expires = Date.now() + config.localStorage.presignExpiresSeconds * 1000;
  const payload = `${purpose}:${key}:${contentType || ''}:${expires}`;
  const sig = sign(payload);
  const query = new URLSearchParams({ expires: String(expires), sig });
  if (contentType) query.set('contentType', contentType);
  return `${config.localStorage.baseUrl}/local-storage/${encodeKeyForUrl(key)}?${query.toString()}`;
};

export const presignLocalUpload = async (key, contentType) => buildSignedUrl(key, 'PUT', contentType);

export const presignLocalDownload = async (key) => buildSignedUrl(key, 'GET');

/** Recomputes the expected signature and does a constant-time comparison against what the client sent. */
export const verifySignedRequest = ({ key, purpose, contentType, expires, sig }) => {
  if (!expires || !sig) return false;
  if (Date.now() > Number(expires)) return false;

  const payload = `${purpose}:${key}:${contentType || ''}:${expires}`;
  const expected = sign(payload);

  const a = Buffer.from(String(sig));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

export const writeLocalBuffer = async (key, buffer, contentType) => {
  const filePath = resolvePath(key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  await fs.writeFile(metaPath(key), JSON.stringify({ contentType: contentType || 'application/octet-stream' }));
};

export const readLocalMeta = async (key) => {
  try {
    const raw = await fs.readFile(metaPath(key), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { contentType: 'application/octet-stream' };
  }
};

export const localFileExists = (key) => {
  try {
    return fssync.existsSync(resolvePath(key));
  } catch {
    return false;
  }
};

export const getLocalFilePath = (key) => resolvePath(key);

export const deleteLocalFile = async (key) => {
  const filePath = resolvePath(key);
  await fs.rm(filePath, { force: true });
  await fs.rm(metaPath(key), { force: true });
};

export const baseDir = () => ROOT;
