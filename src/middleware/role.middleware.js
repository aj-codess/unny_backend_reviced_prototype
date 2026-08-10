import { ApiError } from '../utils/ApiError.js';

/** Usage: router.post('/x', authGuard, restrictTo('SUPERVISOR'), handler) */
export const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action'));
  }
  next();
};
