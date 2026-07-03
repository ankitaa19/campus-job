import { Request, Response } from 'express';
import { User } from '../models/User';
import { Student } from '../models/Student';

export const debugGetUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}, 'email phone whatsappNumber').lean();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users for debug:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

export const debugCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user._id || user.userId; // Handle both formats
    console.log('Debug: Current user ID from req.user:', userId);
    console.log('Debug: Current user object from middleware:', user);
    
    // If we already have the user from middleware, use it
    if (user._id) {
      console.log('Debug: Using user from middleware directly');
      
      // Find student profile
      console.log('Debug: Searching for student profile with userId:', userId);
      const student = await Student.findOne({ userId });
      console.log('Debug: Student query result:', student);
      
      return res.status(200).json({
        debug: 'User from middleware, student lookup successful',
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          phone: user.phone
        },
        student: student ? {
          id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phoneNumber: student.phoneNumber
        } : null
      });
    }
    
    // Fallback: search for user (shouldn't be needed)
    console.log('Debug: Searching for user with ID:', userId);
    const userDoc = await User.findById(userId);
    console.log('Debug: User query result:', userDoc);
    
    if (!userDoc) {
      console.log('Debug: User not found in database');
      return res.status(404).json({ 
        message: 'User not found',
        userId: userId,
        debug: 'User exists in token but not found in database query'
      });
    }
    
    // Find student profile
    console.log('Debug: Searching for student profile with userId:', userId);
    const student = await Student.findOne({ userId });
    console.log('Debug: Student query result:', student);
    
    res.status(200).json({
      debug: 'User and student lookup successful',
      user: {
        id: userDoc._id,
        email: userDoc.email,
        role: userDoc.role,
        phone: userDoc.phone
      },
      student: student ? {
        id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phoneNumber: student.phoneNumber
      } : null
    });
  } catch (error) {
    console.error('Error debugging current user:', error);
    res.status(500).json({ 
      message: 'Server error debugging user',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
