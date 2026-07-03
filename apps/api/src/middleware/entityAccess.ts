import { Request, Response, NextFunction } from 'express';
import { College } from '../models/College';
import { Recruiter } from '../models/Recruiter';

// Middleware to check if college is approved and active
export const checkCollegeAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (req.user.role !== 'college') {
            return next(); // Not a college user, skip this check
        }

        const college = await College.findOne({ userId: req.user._id });
        if (!college) {
            return res.status(404).json({ message: 'College profile not found' });
        }

        if (college.approvalStatus !== 'approved') {
            return res.status(403).json({ 
                message: 'College approval pending',
                status: college.approvalStatus,
                canResubmit: college.approvalStatus === 'rejected'
            });
        }

        if (!college.isActive) {
            return res.status(403).json({ 
                message: 'College account is deactivated. Please contact admin.',
                status: 'deactivated'
            });
        }

        // Add college to request for use in controllers
        req.college = college;
        next();
    } catch (error) {
        console.error('College access check error:', error);
        res.status(500).json({ message: 'Server error checking college access' });
    }
};

// Middleware to check if recruiter is approved and active
export const checkRecruiterAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (req.user.role !== 'recruiter') {
            return next(); // Not a recruiter user, skip this check
        }

        const recruiter = await Recruiter.findOne({ userId: req.user._id });
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter profile not found' });
        }

        // TODO: Re-enable this check in production
        // if (recruiter.approvalStatus !== 'approved') {
        //     return res.status(403).json({ 
        //         message: 'Recruiter approval pending',
        //         status: recruiter.approvalStatus,
        //         canResubmit: recruiter.approvalStatus === 'rejected'
        //     });
        // }

        if (!recruiter.isActive) {
            return res.status(403).json({ 
                message: 'Recruiter account is deactivated. Please contact admin.',
                status: 'deactivated'
            });
        }

        // Add recruiter to request for use in controllers
        req.recruiter = recruiter;
        next();
    } catch (error) {
        console.error('Recruiter access check error:', error);
        res.status(500).json({ message: 'Server error checking recruiter access' });
    }
};

// Combined middleware to check access for both colleges and recruiters
export const checkEntityAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (req.user.role === 'college') {
            return checkCollegeAccess(req, res, next);
        } else if (req.user.role === 'recruiter') {
            return checkRecruiterAccess(req, res, next);
        } else {
            return next(); // Not a college or recruiter, skip checks
        }
    } catch (error) {
        console.error('Entity access check error:', error);
        res.status(500).json({ message: 'Server error checking entity access' });
    }
};

// Extend Express Request interface
declare global {
    namespace Express {
        interface Request {
            college?: any;
            recruiter?: any;
        }
    }
}
