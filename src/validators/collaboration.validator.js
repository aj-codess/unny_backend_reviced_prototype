import { body, param } from 'express-validator';

export const inviteCollaboratorValidator = [
  param('projectId').isUUID(),
  body('userId').isUUID().withMessage('Valid user id is required'),
];

export const respondCollaborationValidator = [
  param('collaborationId').isUUID(),
  body('status').isIn(['ACCEPTED', 'DECLINED']).withMessage('Status must be ACCEPTED or DECLINED'),
];
