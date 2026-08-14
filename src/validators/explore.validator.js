import { query } from 'express-validator';

export const exploreValidator = [
  query('scope').optional().isIn(['all', 'users', 'projects']).withMessage('scope must be all, users, or projects'),
  query('role').optional().isIn(['STUDENT', 'SUPERVISOR']).withMessage('role must be STUDENT or SUPERVISOR'),
  query('q').optional().isString(),
  query('department').optional().isString(),
  query('tag').optional().isString(),
  query('academicYear').optional().isInt(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];
