import { config } from '../config/env.js';

// In-memory sliding-window limiter, keyed by IP + route prefix.
// NOTE: this is single-instance only. Behind a load balancer with multiple
// API replicas, swap the `buckets` Map for a Redis-backed counter
// (e.g. rate-limit-redis) so limits are enforced consistently cluster-wide.
const buckets = new Map();

export const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || config.rateLimit.windowMs;
  const max = options.max || config.rateLimit.max;

  return (req, res, next) => {
    const key = `${req.ip}:${req.baseUrl}`;
    const now = Date.now();
    const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(max - bucket.count, 0));

    if (bucket.count > max) {
      return res.status(429).json({ success: false, message: 'Too many requests, please try again later' });
    }
    next();
  };
};
