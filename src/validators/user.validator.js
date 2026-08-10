import { body, param, query } from 'express-validator';

export const updateProfileValidator = [
  body('fullName').optional().trim().notEmpty(),
  body('bio').optional().isString(),
  body('department').optional().trim().notEmpty(),
  body('faculty').optional().isString(),
  body('phone').optional().isString(),
  body('level').optional().isString(),
  body('specialization').optional().isString(),
  body('avatarUrl').optional().isURL(),
];

export const userIdValidator = [param('id').isUUID().withMessage('Invalid user id')];

export const listSupervisorsValidator = [
  query('department').optional().isString(),
  query('q').optional().isString(),
];
