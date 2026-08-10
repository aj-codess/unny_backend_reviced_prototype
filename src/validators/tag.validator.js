import { body } from 'express-validator';

export const createTagValidator = [
  body('name').trim().notEmpty().withMessage('Tag name is required'),
  body('category')
    .isIn(['LANGUAGE', 'FRAMEWORK', 'DOMAIN', 'TOOL', 'METHODOLOGY'])
    .withMessage('Invalid tag category'),
];
