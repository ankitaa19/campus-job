import { Router, Request, Response } from 'express';
import authMiddleware from '../middleware/auth';
import { AdmissionEnquiry } from '../models/AdmissionEnquiry';
import { Course } from '../models/Course';
import { College } from '../models/College';
import mongoose from 'mongoose';

const router = Router();

// Get admission enquiries for a college
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Find college by userId
    const college = await College.findOne({ userId });
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    const { page = 1, limit = 20, status, courseId, search } = req.query;

    // Build query
    let query: any = { collegeId: college._id };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (courseId) {
      query.courseId = courseId;
    }
    
    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const enquiries = await AdmissionEnquiry.find(query)
      .populate('courseId', 'name code streamType')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await AdmissionEnquiry.countDocuments(query);

    // Get status statistics
    const statusStats = await AdmissionEnquiry.aggregate([
      { $match: { collegeId: college._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: enquiries,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      },
      statistics: statusStats.reduce((acc: any, stat: any) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    });

  } catch (error) {
    console.error('Error fetching admission enquiries:', error);
    res.status(500).json({ message: 'Error fetching admission enquiries' });
  }
});

// Create new admission enquiry
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Find college by userId
    const college = await College.findOne({ userId });
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    const { studentName, email, phone, courseId, source, notes } = req.body;

    // Validate required fields
    if (!studentName || !email || !phone || !courseId || !source) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate course belongs to college
    const course = await Course.findOne({ _id: courseId, collegeId: college._id });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check for duplicate enquiry
    const existingEnquiry = await AdmissionEnquiry.findOne({
      email,
      collegeId: college._id
    });

    if (existingEnquiry) {
      return res.status(400).json({ message: 'Enquiry with this email already exists' });
    }

    // Create new enquiry
    const enquiry = new AdmissionEnquiry({
      collegeId: college._id,
      courseId,
      studentName,
      email,
      phone,
      source,
      notes
    });

    await enquiry.save();

    // Populate course info
    await enquiry.populate('courseId', 'name code streamType');

    res.status(201).json({
      success: true,
      data: enquiry
    });

  } catch (error) {
    console.error('Error creating admission enquiry:', error);
    res.status(500).json({ message: 'Error creating admission enquiry' });
  }
});

// Update enquiry status
router.put('/:enquiryId/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { enquiryId } = req.params;
    const { status, notes } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Find college by userId
    const college = await College.findOne({ userId });
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    // Find and update enquiry
    const enquiry = await AdmissionEnquiry.findOne({
      _id: enquiryId,
      collegeId: college._id
    });

    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    const oldStatus = enquiry.status;
    enquiry.status = status;
    
    if (notes) {
      enquiry.notes = notes;
    }

    await enquiry.save();

    // If status changed to converted, update course enrollment count
    if (status === 'converted' && oldStatus !== 'converted') {
      await Course.findByIdAndUpdate(
        enquiry.courseId,
        { $inc: { enrolledStudents: 1 } }
      );
    }
    
    // If status changed from converted to something else, decrease enrollment count
    if (oldStatus === 'converted' && status !== 'converted') {
      await Course.findByIdAndUpdate(
        enquiry.courseId,
        { $inc: { enrolledStudents: -1 } }
      );
    }

    await enquiry.populate('courseId', 'name code streamType');

    res.json({
      success: true,
      data: enquiry
    });

  } catch (error) {
    console.error('Error updating enquiry status:', error);
    res.status(500).json({ message: 'Error updating enquiry status' });
  }
});

// Get enrollment statistics for a course
router.get('/course/:courseId/enrollment', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { courseId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Find college by userId
    const college = await College.findOne({ userId });
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    // Find course
    const course = await Course.findOne({ _id: courseId, collegeId: college._id });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get enquiry statistics for this course
    const enquiryStats = await AdmissionEnquiry.aggregate([
      { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const totalEnquiries = await AdmissionEnquiry.countDocuments({ courseId });
    const convertedCount = course.enrolledStudents || 0;
    const totalSeats = course.numberOfSeats || 0;
    const availableSeats = Math.max(0, totalSeats - convertedCount);
    const fillPercentage = totalSeats > 0 ? Math.round((convertedCount / totalSeats) * 100) : 0;

    res.json({
      success: true,
      data: {
        courseId,
        courseName: course.name,
        totalSeats: course.numberOfSeats || 0,
        enrolledStudents: convertedCount,
        availableSeats,
        fillPercentage,
        totalEnquiries,
        enquiryBreakdown: enquiryStats.reduce((acc: any, stat: any) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Error fetching enrollment statistics:', error);
    res.status(500).json({ message: 'Error fetching enrollment statistics' });
  }
});

// Get all courses with enrollment data for dashboard
router.get('/dashboard/enrollment', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Find college by userId
    const college = await College.findOne({ userId });
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    // Get all courses with enrollment data
    const courses = await Course.find({ collegeId: college._id, isActive: true });
    
    const coursesWithEnrollment = await Promise.all(
      courses.map(async (course) => {
        const totalEnquiries = await AdmissionEnquiry.countDocuments({ courseId: course._id });
        const convertedCount = course.enrolledStudents || 0;
        const totalSeats = course.numberOfSeats || 0;
        const fillPercentage = totalSeats > 0 ? Math.round((convertedCount / totalSeats) * 100) : 0;
        
        return {
          _id: course._id,
          name: course.name,
          code: course.code,
          totalSeats,
          enrolledStudents: convertedCount,
          availableSeats: Math.max(0, totalSeats - convertedCount),
          fillPercentage,
          totalEnquiries
        };
      })
    );

    res.json({
      success: true,
      data: coursesWithEnrollment
    });

  } catch (error) {
    console.error('Error fetching dashboard enrollment data:', error);
    res.status(500).json({ message: 'Error fetching dashboard enrollment data' });
  }
});

// Public route to create admission enquiry (no auth required)
router.post('/public', async (req: Request, res: Response) => {
  try {
    const { collegeId, courseId, studentName, email, phone, courseType } = req.body;

    // Validate required fields
    if (!collegeId || !studentName || !email || !phone) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify college exists
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    // Check for duplicate enquiry (same email for same college)
    const existingEnquiry = await AdmissionEnquiry.findOne({
      email,
      collegeId
    });

    if (existingEnquiry) {
      return res.status(400).json({ 
        success: false,
        message: 'You have already submitted an enquiry to this college' 
      });
    }

    // Create new enquiry
    const enquiry = new AdmissionEnquiry({
      collegeId,
      courseId: courseId || null,
      studentName,
      email,
      phone,
      source: 'website',
      notes: courseType ? `Interested in: ${courseType}` : undefined
    });

    await enquiry.save();

    // Populate course info if available
    if (courseId) {
      await enquiry.populate('courseId', 'name code streamType');
    }

    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully',
      data: enquiry
    });

  } catch (error) {
    console.error('Error creating public admission enquiry:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error submitting enquiry. Please try again.' 
    });
  }
});

export default router;
