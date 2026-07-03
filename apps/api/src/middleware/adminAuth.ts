import { Request, Response, NextFunction } from 'express';
import { Admin } from '../models/Admin';
import { getAdminConfig } from '../config/admin.config';

export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Check if user is admin (either from config or database)
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        // Handle configuration-based admin (hardcoded credentials)
        if (req.user.userId === 'admin') {
            const adminConfig = getAdminConfig();
            req.admin = {
                _id: 'admin',
                userId: 'admin',
                email: adminConfig.email,
                name: adminConfig.name,
                role: 'admin',
                permissions: adminConfig.permissions,
                isActive: true
            };
            return next();
        }

        // Handle database-based admin (if we ever add more admins)
        const admin = await Admin.findOne({ userId: req.user._id });
        if (!admin || !admin.isActive) {
            return res.status(403).json({ message: 'Admin account not found or inactive' });
        }

        // Add admin to request for use in controllers
        req.admin = admin;
        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({ message: 'Server error in admin middleware' });
    }
};

export const checkPermission = (permission: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const admin = req.admin;
        
        if (!admin) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        // Check specific permission
        switch (permission) {
            case 'approve_colleges':
                if (!admin.permissions.canApproveColleges) {
                    return res.status(403).json({ message: 'Permission denied: Cannot approve colleges' });
                }
                break;
            case 'approve_recruiters':
                if (!admin.permissions.canApproveRecruiters) {
                    return res.status(403).json({ message: 'Permission denied: Cannot approve recruiters' });
                }
                break;
            case 'manage_users':
                if (!admin.permissions.canManageUsers) {
                    return res.status(403).json({ message: 'Permission denied: Cannot manage users' });
                }
                break;
            case 'view_analytics':
                if (!admin.permissions.canViewAnalytics) {
                    return res.status(403).json({ message: 'Permission denied: Cannot view analytics' });
                }
                break;
            case 'send_messages':
                if (!admin.permissions.canSendMessages) {
                    return res.status(403).json({ message: 'Permission denied: Cannot send messages' });
                }
                break;
            case 'send_broadcasts':
                if (!admin.permissions.canSendBroadcasts) {
                    return res.status(403).json({ message: 'Permission denied: Cannot send broadcasts' });
                }
                break;
            default:
                return res.status(403).json({ message: 'Invalid permission' });
        }

        next();
    };
};

// Extend Express Request interface to include admin property
declare global {
    namespace Express {
        interface Request {
            admin?: any;
        }
    }
}
