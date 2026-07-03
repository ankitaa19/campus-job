import express from 'express';
import multer from 'multer';
import { 
    getAllStudents, 
    getStudentById, 
    getStudentByUserId,
    createStudent, 
    updateStudent, 
    updateStudentByUserId,
    deleteStudent,
    getStudentsByCollege,
    searchStudents
} from '../controllers/students';
import {
    updateStudentProfile,
    getStudentJobMatches,
    triggerStudentJobAlerts,
    analyzeStudentProfile
} from '../controllers/student-career';
import {
    getResumeAnalysis,
    getStudentApplications
} from '../controllers/job-applications';
import {
    getEnhancedStudentApplications,
    updateApplicationStatus
} from '../controllers/student-applications-enhanced';
import authMiddleware from '../middleware/auth';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  },
});

const router = express.Router();

// Search students with filters
router.get('/search', searchStudents);

// Resume upload endpoint for registration
router.post('/upload-resume', upload.single('resume'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No resume file provided'
      });
    }

    // Here you would typically:
    // 1. Upload file to cloud storage (Azure Blob, AWS S3, etc.)
    // 2. Extract text using OCR/parsing service
    // 3. Analyze resume using AI service
    // 4. Store analysis results
    
    // For now, return a mock response
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Simulate processing
    setTimeout(() => {
      console.log(`Resume analysis completed for ${req.file.originalname} with ID: ${analysisId}`);
    }, 1000);

    res.json({
      success: true,
      message: 'Resume uploaded and analysis started',
      analysisId,
      filename: req.file.originalname,
      size: req.file.size
    });
    
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload resume'
    });
  }
});

// Route to get students by college
router.get('/college/:collegeId', getStudentsByCollege);

// Route to get applications for a student - MOVED UP BEFORE /:id
router.get('/applications', authMiddleware, getStudentApplications);

// Enhanced applications endpoint with real-time features
router.get('/applications/enhanced', authMiddleware, getEnhancedStudentApplications);

// Update application status (for real-time testing)
router.patch('/applications/:applicationId/status', authMiddleware, updateApplicationStatus);

// Route to get all students
router.get('/', getAllStudents);

// Route to get a student by user ID
router.get('/user/:userId', getStudentByUserId);

// Route to get current student's own profile - MOVED UP BEFORE /:id
router.get('/profile', authMiddleware, async (req: any, res: any) => {
  try {
    const user = req.user;
    
    const { Student } = require('../models/Student');
    const student = await Student.findOne({ userId: user._id })
      .populate('collegeId', 'name address')
      .populate('userId', 'email')
      .select('-password');
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student profile not found' 
      });
    }
    
    // Transform experience data to match frontend expectations
    const transformedStudent = student.toObject();
    if (transformedStudent.experience && Array.isArray(transformedStudent.experience)) {
      transformedStudent.experience = transformedStudent.experience.map((exp: any) => ({
        title: exp.title || exp.position || '', // Map position to title
        company: exp.company || '',
        location: exp.location || '',
        startDate: exp.startDate,
        endDate: exp.endDate,
        description: exp.description || '',
        isCurrentJob: exp.isCurrentJob || false
      }));
    }
    
    res.json({ 
      success: true, 
      data: transformedStudent 
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Route to update current student's own profile
router.put('/profile', authMiddleware, async (req: any, res: any) => {
  try {
    const user = req.user;
    const updateData = req.body;
    
    console.log('Updating profile for user:', user._id);
    console.log('Update data received:', JSON.stringify(updateData, null, 2));
    
    // Clean up empty string fields that should be undefined/null for validation
    if (updateData.gender === '') {
      delete updateData.gender;
    }
    if (updateData.dateOfBirth === '') {
      delete updateData.dateOfBirth;
    }
    if (updateData.phoneNumber === '') {
      delete updateData.phoneNumber;
    }
    
    // Transform skills array to match schema
    if (updateData.skills && Array.isArray(updateData.skills)) {
      console.log('Original skills:', JSON.stringify(updateData.skills, null, 2));
      
      updateData.skills = updateData.skills.map((skill: any) => {
        console.log('Processing skill:', JSON.stringify(skill, null, 2));
        
        // Check if skill has proper name, level, and category (not just any name)
        if (typeof skill === 'object' && skill !== null && 
            skill.name && skill.level && skill.category &&
            typeof skill.name === 'string' && skill.name.length > 2) {
          console.log('Skill already formatted correctly');
          return skill;
        }
        
        // If skill is an object with numbered properties, convert to string
        if (typeof skill === 'object' && skill !== null && !Array.isArray(skill)) {
          // Check if it has numbered properties (0, 1, 2, etc.)
          const hasNumberedProps = Object.keys(skill).some(key => /^\d+$/.test(key));
          
          if (hasNumberedProps) {
            // Extract only the numbered properties and join them
            const numberedValues = Object.keys(skill)
              .filter(key => /^\d+$/.test(key))
              .sort((a, b) => parseInt(a) - parseInt(b))
              .map(key => skill[key]);
            
            const skillName = numberedValues.join('');
            console.log('Converting numbered object to skill name:', skillName);
            return {
              name: skillName,
              level: 'intermediate' as const,
              category: 'technical' as const
            };
          }
        }
        
        // If skill is a string, convert to proper format
        const skillName = typeof skill === 'string' ? skill : String(skill);
        console.log('Converting string to skill object:', skillName);
        return {
          name: skillName,
          level: 'intermediate' as const,
          category: 'technical' as const
        };
      });
      
      console.log('Transformed skills:', JSON.stringify(updateData.skills, null, 2));
    }
    
    // Transform education array to match schema
    if (updateData.education && Array.isArray(updateData.education)) {
      updateData.education = updateData.education.map((edu: any) => {
        const transformedEdu = { ...edu };
        
        // Map fieldOfStudy to field (schema uses 'field')
        if (edu.fieldOfStudy) {
          transformedEdu.field = edu.fieldOfStudy;
          delete transformedEdu.fieldOfStudy;
        }
        
        // Handle date conversion for startYear/endYear to startDate/endDate
        if (edu.startYear) {
          transformedEdu.startDate = new Date(edu.startYear, 0, 1); // January 1st of the year
        }
        if (edu.endYear) {
          transformedEdu.endDate = new Date(edu.endYear, 0, 1);
        }
        
        // Validate GPA range
        if (transformedEdu.gpa && transformedEdu.gpa > 10) {
          transformedEdu.gpa = Math.min(transformedEdu.gpa, 10);
        }
        
        return transformedEdu;
      });
    }
    
    // Handle jobPreferences - for now just ensure it exists
    if (!updateData.jobPreferences) {
      updateData.jobPreferences = {
        jobTypes: [],
        preferredLocations: [],
        expectedSalary: {
          min: 0,
          max: 0,
          currency: 'INR'
        },
        workMode: 'any'
      };
    }
    
    // Ensure studentId is provided if missing or empty
    if (!updateData.studentId || updateData.studentId === '') {
      updateData.studentId = `STU${Date.now()}`;
      console.log('Generated studentId:', updateData.studentId);
    }
    
    // Clean up validation issues
    if (updateData.gender === '') {
      delete updateData.gender;
    }
    
    // Fix education array validation issues
    if (updateData.education && Array.isArray(updateData.education)) {
      updateData.education = updateData.education.map((edu: any) => {
        const cleanEdu: any = { ...edu };
        
        // Map fieldOfStudy to field if needed
        if (edu.fieldOfStudy && !edu.field) {
          cleanEdu.field = edu.fieldOfStudy;
          delete cleanEdu.fieldOfStudy;
        }
        
        // Handle dates
        if (edu.startYear && !edu.startDate) {
          cleanEdu.startDate = new Date(edu.startYear, 0, 1);
        }
        if (edu.endYear && !edu.endDate) {
          cleanEdu.endDate = new Date(edu.endYear, 0, 1);
        }
        
        // Fix GPA validation (max 10)
        if (edu.gpa && edu.gpa > 10) {
          cleanEdu.gpa = 10;
        }
        
        return cleanEdu;
      });
    }
    
    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.__v;
    delete updateData.userId;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    
    const { Student } = require('../models/Student');
    const updatedStudent = await Student.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          ...updateData,
          lastModified: new Date()
        }
      },
      { new: true, runValidators: true }
    ).populate('collegeId', 'name address')
     .populate('userId', 'email');
    
    if (!updatedStudent) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student profile not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: updatedStudent 
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      console.error('Validation errors:', validationErrors);
      
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    // Handle cast errors
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid ${error.path}: ${error.value}` 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update profile',
      details: error.message 
    });
  }
});

// Route to get a student by ID
router.get('/:id', getStudentById);

// Route to get student profile for recruiters (detailed view)
router.get('/:id/profile', authMiddleware, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // Only allow recruiters to view student profiles
    if (user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { Student } = require('../models/Student');
    const student = await Student.findById(id)
      .populate('collegeId', 'name address')
      .populate('userId', 'email')
      .select('-password');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to get job matches for a student
router.get('/:id/matches', getStudentJobMatches);

// Route to analyze student profile with AI
router.get('/:id/analyze', analyzeStudentProfile);

// Route to get resume analyses for a student (AI matching results)
router.get('/:id/resume-analyses', authMiddleware, getResumeAnalysis);

// Route to create a new student
router.post('/', createStudent);

// Route to trigger job alerts for a student
router.post('/:id/alerts', triggerStudentJobAlerts);

// Route to update a student profile (with job matching)
router.put('/:id/profile', updateStudentProfile);

// Route to update a student by user ID
router.put('/user/:userId', updateStudentByUserId);

// Route to update a student by ID
router.put('/:id', updateStudent);

// Route to delete a student by ID
router.delete('/:id', deleteStudent);

// ==== NEW ENDPOINTS FOR UI SCREENS ====

// Get student's college connections
router.get('/college-connections', authMiddleware, async (req: any, res: any) => {
  try {
    const user = req.user;
    
    const { Student } = require('../models/Student');
    const { Connection } = require('../models/Connection');
    
    const student = await Student.findOne({ userId: user._id }).populate('collegeId');
    
    if (!student || !student.collegeId) {
      return res.status(404).json({ message: 'Student college not found' });
    }

    const connections = await Connection.find({
      collegeId: student.collegeId._id,
      status: 'approved'
    }).populate('recruiterId', 'name email companyName');

    res.json({
      success: true,
      data: connections
    });
  } catch (error) {
    console.error('Error fetching college connections:', error);
    res.status(500).json({ message: 'Failed to fetch college connections' });
  }
});

// Get personalized job recommendations
router.get('/recommendations', authMiddleware, async (req: any, res: any) => {
  try {
    const user = req.user;
    const limit = parseInt(req.query.limit as string) || 8;
    
    const { Student } = require('../models/Student');
    const { Job } = require('../models/Job');
    
    const student = await Student.findOne({ userId: user._id });
    
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Build match criteria based on student profile
    const matchCriteria: any = {
      status: 'active',
      $or: []
    };

    // Match by skills
    if (student.skills && student.skills.length > 0) {
      matchCriteria.$or.push({
        requiredSkills: { $in: student.skills }
      });
    }

    // Match by location preference
    if (student.locationPreferences && student.locationPreferences.length > 0) {
      matchCriteria.$or.push({
        location: { $in: student.locationPreferences }
      });
    }

    // Match by job type
    if (student.jobPreferences && student.jobPreferences.jobType) {
      matchCriteria.$or.push({
        jobType: student.jobPreferences.jobType
      });
    }

    // If no specific criteria, get general active jobs
    if (matchCriteria.$or.length === 0) {
      delete matchCriteria.$or;
    }

    const recommendations = await Job.find(matchCriteria)
      .populate('recruiterId', 'name companyName')
      .populate('collegeId', 'name')
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    });
  } catch (error) {
    console.error('Error fetching job recommendations:', error);
    res.status(500).json({ message: 'Failed to fetch job recommendations' });
  }
});

// Get student dashboard stats
router.get('/dashboard/stats', authMiddleware, async (req: any, res: any) => {
  try {
    const user = req.user;
    
    const { Student } = require('../models/Student');
    const { Application } = require('../models/Application');
    const { Interview } = require('../models/Interview');
    const { Notification } = require('../models/Notification');
    
    const student = await Student.findOne({ userId: user._id });
    
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Get application stats
    const totalApplications = await Application.countDocuments({ studentId: student._id });
    const pendingApplications = await Application.countDocuments({ 
      studentId: student._id, 
      status: { $in: ['applied', 'under_review'] }
    });
    const acceptedApplications = await Application.countDocuments({ 
      studentId: student._id, 
      status: 'selected' 
    });

    // Get interview stats
    const upcomingInterviews = await Interview.countDocuments({
      studentId: student._id,
      status: { $in: ['scheduled', 'confirmed'] },
      interviewDate: { $gte: new Date() }
    });

    // Get notification stats
    const unreadNotifications = await Notification.countDocuments({
      userId: user._id,
      isRead: false
    });

    const stats = {
      applications: {
        total: totalApplications,
        pending: pendingApplications,
        accepted: acceptedApplications,
        rejected: totalApplications - pendingApplications - acceptedApplications
      },
      interviews: {
        upcoming: upcomingInterviews
      },
      notifications: {
        unread: unreadNotifications
      },
      profile: {
        completeness: calculateProfileCompleteness(student)
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
});

// Helper function to calculate profile completeness
function calculateProfileCompleteness(student: any): number {
  const fields = [
    'firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 
    'course', 'graduationYear', 'skills', 'locationPreferences'
  ];
  
  let completedFields = 0;
  fields.forEach(field => {
    if (student[field] && (Array.isArray(student[field]) ? student[field].length > 0 : true)) {
      completedFields++;
    }
  });
  
  return Math.round((completedFields / fields.length) * 100);
}

export default router;