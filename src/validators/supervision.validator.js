import { body, param } from 'express-validator';

export const requestSupervisionValidator = [
  param('projectId').isUUID(),
  body('supervisorId').isUUID().withMessage('Valid supervisor id is required'),
  body('message').optional().isString(),
];

export const respondSupervisionValidator = [
  param('requestId').isUUID(),
  body('status').isIn(['ACCEPTED', 'DECLINED']).withMessage('Status must be ACCEPTED or DECLINED'),
];
