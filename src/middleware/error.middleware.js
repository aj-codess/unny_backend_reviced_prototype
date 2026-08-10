import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message;
  const details = err.details;

  if (!(err instanceof ApiError)) {
    statusCode = 500;
    message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
    logger.error(err.stack || err.message);
  } else if (statusCode >= 500) {
    logger.error(err.stack || err.message);
  }

  res.status(statusCode).json({
    success: false,
    message: message || 'Something went wrong',
    ...(details ? { details } : {}),
  });
};
