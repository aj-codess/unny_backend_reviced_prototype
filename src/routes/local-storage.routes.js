import express, { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/env.js';
import {
  verifySignedRequest,
  writeLocalBuffer,
  readLocalMeta,
  localFileExists,
  getLocalFilePath,
} from '../services/localStorage.service.js';

const router = Router();

// Matches any nested key after the mount point, e.g.
// /local-storage/projects/<id>/report-....pdf
// A RegExp path is used (rather than an Express string pattern) so that
// keys containing multiple "/" segments are captured as a single param,
// consistently across Express versions.
const KEY_PATTERN = /^\/(.+)$/;

/**
 * Upload — the client PUTs the raw file body here, exactly as it would to
 * an S3 presigned PUT URL. express.raw() is scoped to just this route so
 * the global express.json()/urlencoded() parsers upstream are untouched.
 */
router.put(
  KEY_PATTERN,
  express.raw({ type: '*/*', limit: `${config.localStorage.maxUploadMb}mb` }),
  asyncHandler(async (req, res) => {
    const key = decodeURIComponent(req.params[0]);
    const { expires, sig, contentType } = req.query;

    const valid = verifySignedRequest({ key, purpose: 'PUT', contentType, expires, sig });
    if (!valid) throw new ApiError(403, 'This upload URL is invalid or has expired');

    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      throw new ApiError(400, 'Request body was empty — send the raw file bytes as the PUT body');
    }

    await writeLocalBuffer(key, req.body, contentType);
    res.status(200).json({ success: true, message: 'File stored' });
  }),
);

/** Download — mirrors an S3 presigned GET URL. */
router.get(
  KEY_PATTERN,
  asyncHandler(async (req, res) => {
    const key = decodeURIComponent(req.params[0]);
    const { expires, sig } = req.query;

    const valid = verifySignedRequest({ key, purpose: 'GET', contentType: undefined, expires, sig });
    if (!valid) throw new ApiError(403, 'This download URL is invalid or has expired');

    if (!localFileExists(key)) throw new ApiError(404, 'File not found');

    const meta = await readLocalMeta(key);
    res.setHeader('Content-Type', meta.contentType || 'application/octet-stream');
    res.sendFile(getLocalFilePath(key));
  }),
);

export default router;