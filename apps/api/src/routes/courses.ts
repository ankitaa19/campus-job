import express from 'express';
import { Course } from '../models/Course';
import { College } from '../models/College';
import authMiddleware from '../middleware/auth';
import mongoose from 'mongoose';

const router = express.Router();

// Get courses for current user's college (MUST be before /:courseId)
router.get('/my-college', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Find the college for this user
    const college = await College.findOne({ userId });
    
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    const courses = await Course.find({ collegeId: college._id, isActive: true })
      .sort({ createdAt: -1 });
    
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Error fetching courses' });
  }
});

// Get all courses for a college (MUST be before /:courseId) - Public route
router.get('/college/:collegeId', async (req, res) => {
  try {
    const { collegeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(collegeId)) {
      return res.status(400).json({ message: 'Invalid college ID' });
    }

    const courses = await Course.find({ collegeId, isActive: true })
      .sort({ createdAt: -1 });
    
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Error fetching courses' });
  }
});

// Get single course by ID (public route) - MUST be last among GETs
router.get('/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }

    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ message: 'Error fetching course' });
  }
});

// Create a new course
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Find the college for this user
    const college = await College.findOne({ userId });
    
    if (!college) {
      return res.status(404).json({ message: 'College not found for this user' });
    }

    console.log('📋 College found:', { 
      id: college._id, 
      name: college.name,
      domainCode: college.domainCode 
    });

    const {
      name,
      code,
      description,
      duration,
      type,
      category,
      studyMode,
      accreditation,
      department,
      streamType,
      eligibilityCriteria,
      totalFee,
      semesterFee,
      numberOfSeats,
      fees,
      specialOffers,
      admissionDates
    } = req.body;

    console.log('📥 Request body:', req.body);

    // Validate required fields
    if (!name || !duration || !type || !department) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, duration, type, department' 
      });
    }

    // Check if domainCode exists
    if (!college.domainCode) {
      console.error('❌ College missing domainCode:', college._id);
      return res.status(400).json({ 
        message: 'College domain code not set. Please update your college profile first.' 
      });
    }

    // Create course with proper course code including college code
    let courseCode = code ? `${college.domainCode}-${code}` : `${college.domainCode}-${name.replace(/\s+/g, '').substring(0, 5).toUpperCase()}`;
    
    console.log('🔑 Initial course code:', courseCode);
    
    // Check if course code already exists and generate unique one if needed
    let codeExists = await Course.findOne({ code: courseCode });
    let attempt = 1;
    
    while (codeExists && attempt <= 10) {
      // If code exists, append a number
      const baseCode = code || name.replace(/\s+/g, '').substring(0, 5).toUpperCase();
      courseCode = `${college.domainCode}-${baseCode}${attempt}`;
      console.log(`🔄 Trying alternative code (attempt ${attempt}):`, courseCode);
      codeExists = await Course.findOne({ code: courseCode });
      attempt++;
    }
    
    if (codeExists) {
      return res.status(400).json({ 
        message: 'Unable to generate unique course code. Please provide a custom course code.' 
      });
    }
    
    console.log('✅ Final course code:', courseCode);

    const course = new Course({
      name,
      code: courseCode,
      description,
      duration,
      type: type.toLowerCase(),
      category: category?.toLowerCase() || type.toLowerCase(),
      studyMode: studyMode?.toLowerCase().replace(' ', '-') || 'full-time',
      accreditation: accreditation?.toLowerCase().replace(' ', '-'),
      department: department || 'General',
      streamType: streamType || undefined,
      eligibilityCriteria,
      totalFee: totalFee || 0,
      semesterFee: semesterFee || 0,
      numberOfSeats: numberOfSeats || 0,
      fees: fees || { 
        tuition: totalFee || 0, 
        other: 0, 
        currency: 'INR' 
      },
      specialOffers: specialOffers ? {
        spotAdmission: {
          enabled: !!specialOffers?.spotAdmission?.enabled,
          fee: Number(specialOffers?.spotAdmission?.fee || 0),
          seats: Number(specialOffers?.spotAdmission?.seats || 0)
        },
        earlyBird: {
          enabled: !!specialOffers?.earlyBird?.enabled,
          discount: Number(specialOffers?.earlyBird?.discount || 0),
          validUntil: specialOffers?.earlyBird?.validUntil ? new Date(specialOffers.earlyBird.validUntil) : undefined
        },
        meritScholarship: {
          enabled: !!specialOffers?.meritScholarship?.enabled,
          percent: Number(specialOffers?.meritScholarship?.percent || 0),
          criteria: specialOffers?.meritScholarship?.criteria
        }
      } : undefined,
      admissionDates: admissionDates ? {
        startDate: admissionDates?.startDate ? new Date(admissionDates.startDate) : undefined,
        deadline: admissionDates?.deadline ? new Date(admissionDates.deadline) : undefined
      } : undefined,
      collegeId: college._id
    });

    await course.save();

    // Add course reference to college (skip validation to avoid issues with incomplete college profiles)
    college.courses.push(course._id);
    await college.save({ validateBeforeSave: false });

    console.log('✅ Course created successfully:', { 
      id: course._id, 
      name: course.name,
      code: course.code 
    });

    res.status(201).json(course);
  } catch (error: any) {
    console.error('❌ Error creating course:', error);
    console.error('📊 Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    if (error.code === 11000) {
      res.status(400).json({ 
        message: 'Course code already exists. Please use a different course code.' 
      });
    } else if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((e: any) => e.message);
      res.status(400).json({ 
        message: 'Validation error', 
        errors: validationErrors 
      });
    } else {
      res.status(500).json({ 
        message: 'Error creating course',
        error: error.message 
      });
    }
  }
});

// Update a course
router.put('/:courseId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { courseId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }

    // Find the college for this user
    const college = await College.findOne({ userId });
    
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    // Find and update the course
    const course = await Course.findOne({ 
      _id: courseId, 
      collegeId: college._id 
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const {
      name,
      description,
      duration,
      type,
      category,
      studyMode,
      accreditation,
      department,
      streamType,
      eligibilityCriteria,
      totalFee,
      semesterFee,
      numberOfSeats,
      fees,
      specialOffers,
      admissionDates
    } = req.body;

    // Update course fields
    if (name) course.name = name;
    if (description !== undefined) course.description = description;
    if (duration) course.duration = duration;
    if (type) course.type = type.toLowerCase();
    if (category) course.category = category.toLowerCase();
    if (studyMode) course.studyMode = studyMode.toLowerCase().replace(' ', '-');
    if (accreditation) course.accreditation = accreditation.toLowerCase().replace(' ', '-');
    if (department) course.department = department;
    if (streamType !== undefined) course.streamType = streamType;
    if (eligibilityCriteria !== undefined) course.eligibilityCriteria = eligibilityCriteria;
    if (totalFee !== undefined) course.totalFee = totalFee;
    if (semesterFee !== undefined) course.semesterFee = semesterFee;
    if (numberOfSeats !== undefined) course.numberOfSeats = numberOfSeats;
    if (fees) course.fees = fees;
    if (specialOffers) {
      course.specialOffers = {
        spotAdmission: {
          enabled: !!specialOffers?.spotAdmission?.enabled,
          fee: Number(specialOffers?.spotAdmission?.fee || 0),
          seats: Number(specialOffers?.spotAdmission?.seats || 0)
        },
        earlyBird: {
          enabled: !!specialOffers?.earlyBird?.enabled,
          discount: Number(specialOffers?.earlyBird?.discount || 0),
          validUntil: specialOffers?.earlyBird?.validUntil ? new Date(specialOffers.earlyBird.validUntil) : undefined
        },
        meritScholarship: {
          enabled: !!specialOffers?.meritScholarship?.enabled,
          percent: Number(specialOffers?.meritScholarship?.percent || 0),
          criteria: specialOffers?.meritScholarship?.criteria
        }
      } as any;
    }
    if (admissionDates) {
      course.admissionDates = {
        startDate: admissionDates?.startDate ? new Date(admissionDates.startDate) : undefined,
        deadline: admissionDates?.deadline ? new Date(admissionDates.deadline) : undefined
      } as any;
    }

    await course.save();

    res.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Error updating course' });
  }
});

// Delete a course
router.delete('/:courseId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { courseId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }

    // Find the college for this user
    const college = await College.findOne({ userId });
    
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    // Find and soft delete the course
    const course = await Course.findOne({ 
      _id: courseId, 
      collegeId: college._id 
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Soft delete by setting isActive to false
    course.isActive = false;
    await course.save();

    // Remove course reference from college (skip validation)
    college.courses = college.courses.filter(id => id.toString() !== courseId);
    await college.save({ validateBeforeSave: false });

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Error deleting course' });
  }
});

export default router;
