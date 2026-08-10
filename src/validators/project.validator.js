import { body, param, query } from 'express-validator';

export const createProjectValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('abstract').trim().isLength({ min: 30 }).withMessage('Abstract must be at least 30 characters'),
  body('academicYear').isInt({ min: 2000, max: 2100 }).withMessage('Valid academic year is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('repoUrl').optional({ values: 'falsy' }).isURL().withMessage('Repo URL must be valid'),
  body('demoUrl').optional({ values: 'falsy' }).isURL().withMessage('Demo URL must be valid'),
  body('tagIds').optional().isArray().withMessage('tagIds must be an array'),
];

export const updateProjectValidator = [
  param('id').isUUID().withMessage('Invalid project id'),
  body('title').optional().trim().notEmpty(),
  body('abstract').optional().trim().isLength({ min: 30 }),
  body('repoUrl').optional({ values: 'falsy' }).isURL(),
  body('demoUrl').optional({ values: 'falsy' }).isURL(),
  body('tagIds').optional().isArray(),
];

export const projectIdValidator = [param('id').isUUID().withMessage('Invalid project id')];

export const exploreProjectsValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('academicYear').optional().isInt(),
  query('department').optional().isString(),
  query('tag').optional().isString(),
  query('q').optional().isString(),
];

export const addCommentValidator = [
  param('id').isUUID().withMessage('Invalid project id'),
  body('body').trim().notEmpty().withMessage('Comment body is required'),
];
