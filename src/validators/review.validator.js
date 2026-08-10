import { body, param } from 'express-validator';

export const submitReviewValidator = [
  param('projectId').isUUID().withMessage('Invalid project id'),
  body('action').isIn(['APPROVED', 'REJECTED', 'COMMENTED']).withMessage('Invalid review action'),
  body('comment')
    .if(body('action').equals('REJECTED'))
    .notEmpty()
    .withMessage('A comment is required when rejecting a project'),
];
