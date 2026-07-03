import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

// Extend Express Request interface to include user property
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Log masked JWT_SECRET for debugging
        const maskedSecret = process.env.JWT_SECRET ? process.env.JWT_SECRET.replace(/.(?=.{4})/g, '*') : 'undefined';
        console.log('Auth middleware: Using JWT_SECRET:', maskedSecret);

        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            console.log('Auth middleware: No token provided');
            return res.status(401).json({ message: 'No token provided' });
        }

        console.log('Auth middleware: Token received:', token.substring(0, 20) + '...');

        // Remove fallback secret to avoid invalid signature issues
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
        console.log('Auth middleware: Decoded token:', decoded);
        
        // Handle admin token (userId: 'admin')
        if (decoded.userId === 'admin' && decoded.role === 'admin') {
            req.user = {
                _id: 'admin',
                userId: 'admin',
                email: decoded.email,
                role: 'admin',
                name: decoded.name
            };
            return next();
        }

        // Handle regular user tokens
        console.log('Auth middleware: Looking up user with ID:', decoded.userId);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            console.log('Auth middleware: User not found for ID:', decoded.userId);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('Auth middleware: User found:', { id: user._id, email: user.email, role: user.role });
        // Ensure downstream routes can reliably read req.user.userId
        const plainUser: any = typeof (user as any).toObject === 'function' ? (user as any).toObject() : user;
        req.user = {
            ...plainUser,
            userId: (user as any)._id?.toString?.() || decoded.userId,
        };
        next();
    } catch (error: any) {
        console.error('Auth middleware error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(401).json({ message: 'Authentication failed' });
    }
};

export default authMiddleware;
