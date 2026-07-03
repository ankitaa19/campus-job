import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

const validateStudentRegistration = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('skills').isArray().withMessage('Skills must be an array'),
];

const validateJobApplication = [
    body('jobId').notEmpty().withMessage('Job ID is required'),
    body('studentId').notEmpty().withMessage('Student ID is required'),
];

const validateCollegeRegistration = [
    body('name').notEmpty().withMessage('College name is required'),
    body('location').notEmpty().withMessage('Location is required'),
];

const validateRecruiterRegistration = [
    body('companyName').notEmpty().withMessage('Company name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
];

// Login validation
const validateLogin = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

// Register validation
const validateRegister = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('role').isIn(['student', 'recruiter', 'college']).withMessage('Valid role is required'),
];

const validateRequest = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

export {
    validateStudentRegistration,
    validateJobApplication,
    validateCollegeRegistration,
    validateRecruiterRegistration,
    validateRequest,
    validateLogin,
    validateRegister,
};