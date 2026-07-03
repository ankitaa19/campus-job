import { body, validationResult } from 'express-validator';

// Validator for student registration
export const validateStudentRegistration = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('skills').isArray().withMessage('Skills must be an array'),
    body('collegeId').notEmpty().withMessage('College ID is required'),
];

// Validator for job application
export const validateJobApplication = [
    body('studentId').notEmpty().withMessage('Student ID is required'),
    body('jobId').notEmpty().withMessage('Job ID is required'),
    body('resume').notEmpty().withMessage('Resume is required'),
];

// Function to handle validation results
import { Request, Response, NextFunction } from 'express';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};