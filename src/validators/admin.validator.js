import { param, query } from 'express-validator';

export const userIdValidator = [param('id').isUUID().withMessage('Invalid user id')];

export const listUsersValidator = [
  query('role').optional().isIn(['STUDENT', 'SUPERVISOR', 'ADMIN']),
  query('verified').optional().isIn(['true', 'false']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];
