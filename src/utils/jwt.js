import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/env.js';

export const signAccessToken = (payload) =>
  jwt.sign(payload, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiresIn });

export const signRefreshToken = (payload) =>
  jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });

export const verifyAccessToken = (token) => jwt.verify(token, config.jwt.accessSecret);

export const verifyRefreshToken = (token) => jwt.verify(token, config.jwt.refreshSecret);

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/** Parses a duration string like '30d' / '15m' into a future Date. */
export const refreshExpiryDate = () => {
  const match = /^(\d+)([smhd])$/.exec(config.jwt.refreshExpiresIn);
  const now = new Date();
  if (!match) {
    now.setDate(now.getDate() + 30);
    return now;
  }
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return new Date(now.getTime() + value * multipliers[unit]);
};
