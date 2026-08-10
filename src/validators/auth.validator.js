import { body } from 'express-validator';

export const registerValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['STUDENT', 'SUPERVISOR']).withMessage('Role must be STUDENT or SUPERVISOR'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('matricNumber')
    .if(body('role').equals('STUDENT'))
    .notEmpty()
    .withMessage('Matric number is required for students'),
  body('staffId')
    .if(body('role').equals('SUPERVISOR'))
    .notEmpty()
    .withMessage('Staff ID is required for supervisors'),
];

export const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const refreshValidator = [body('refreshToken').notEmpty().withMessage('Refresh token is required')];
