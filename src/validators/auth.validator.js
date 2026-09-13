import { body } from 'express-validator';

// Confirmed against GCTU's own site: students authenticate on the Student
// Information Portal with indexNumber@live.gctu.edu.gh; staff/lecturer
// mailboxes are provisioned on the bare @gctu.edu.gh domain (no "live."
// subdomain), so the two patterns are mutually exclusive by construction.
const STUDENT_EMAIL_REGEX = /^[a-zA-Z0-9._-]+@live\.gctu\.edu\.gh$/i;
const SUPERVISOR_EMAIL_REGEX = /^[a-zA-Z0-9._-]+@gctu\.edu\.gh$/i;

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
  body('email')
    .if(body('role').equals('STUDENT'))
    .matches(STUDENT_EMAIL_REGEX)
    .withMessage('Students must register with their GCTU student email (format: indexNumber@live.gctu.edu.gh)'),
  body('email')
    .if(body('role').equals('SUPERVISOR'))
    .matches(SUPERVISOR_EMAIL_REGEX)
    .withMessage('Lecturers/Supervisors must register with their GCTU staff email (format: name@gctu.edu.gh)'),
];

export const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const refreshValidator = [body('refreshToken').notEmpty().withMessage('Refresh token is required')];
