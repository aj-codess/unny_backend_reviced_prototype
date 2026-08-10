import { body } from 'express-validator';

export const presignProjectFileValidator = [
  body('projectId').isUUID().withMessage('Valid project id is required'),
  body('fileName').trim().notEmpty().withMessage('fileName is required'),
  body('contentType')
    .equals('application/pdf')
    .withMessage('Only application/pdf uploads are accepted for project reports'),
];

export const presignAvatarValidator = [
  body('fileName').trim().notEmpty().withMessage('fileName is required'),
  body('contentType')
    .matches(/^image\/(png|jpe?g|webp)$/)
    .withMessage('Only png, jpg or webp images are accepted for avatars'),
];
