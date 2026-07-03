import { Request, Response, NextFunction } from 'express';
import { checkRecruiterAccess, checkCollegeAccess, checkEntityAccess } from './entityAccess';

/**
 * Role-based access control middleware
 * @param allowedRoles Array of roles that can access the route
 */
export const roleMiddleware = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userRole = req.user.role;
      
      // Check if user role is allowed
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
        });
      }

      // For recruiter role, check additional access requirements
      if (userRole === 'recruiter' && allowedRoles.includes('recruiter')) {
        return checkRecruiterAccess(req, res, next);
      }

      // For college/TPO role, check additional access requirements
      if ((userRole === 'college' || userRole === 'tpo' || userRole === 'college_admin') && 
          (allowedRoles.includes('college') || allowedRoles.includes('tpo') || allowedRoles.includes('college_admin'))) {
        return checkCollegeAccess(req, res, next);
      }

      // For admin role, allow immediate access
      if (userRole === 'admin' && allowedRoles.includes('admin')) {
        return next();
      }

      // For student role, allow immediate access if authorized
      if (userRole === 'student' && allowedRoles.includes('student')) {
        return next();
      }

      // If we reach here, the role is allowed but no specific checks needed
      next();

    } catch (error) {
      console.error('Role middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error in role authorization'
      });
    }
  };
};

/**
 * Convenience middleware for recruiter-only routes
 */
export const recruiterOnly = roleMiddleware(['recruiter']);

/**
 * Convenience middleware for TPO/college admin only routes
 */
export const tpoOnly = roleMiddleware(['tpo', 'college_admin', 'college']);

/**
 * Convenience middleware for student-only routes
 */
export const studentOnly = roleMiddleware(['student']);

/**
 * Convenience middleware for admin-only routes
 */
export const adminOnly = roleMiddleware(['admin']);

/**
 * Convenience middleware for recruiter and admin routes
 */
export const recruiterOrAdmin = roleMiddleware(['recruiter', 'admin']);

/**
 * Convenience middleware for TPO and admin routes
 */
export const tpoOrAdmin = roleMiddleware(['tpo', 'college_admin', 'college', 'admin']);
