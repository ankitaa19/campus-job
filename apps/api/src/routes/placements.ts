import express from 'express';
import { Placement } from '../models/Placement';
import { College } from '../models/College';
import { Student } from '../models/Student';
import { Recruiter } from '../models/Recruiter';
import { Job } from '../models/Job';
import authMiddleware from '../middleware/auth';
import { Types } from 'mongoose';

const router = express.Router();

// Get all placements for authenticated college
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const college = await College.findOne({ userId });
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    const { 
      year, 
      department, 
      company, 
      status, 
      minPackage, 
      maxPackage,
      jobType,
      placementType,
      verified,
      page = 1, 
      limit = 10,
      sortBy = 'packageOffered',
      sortOrder = 'desc'
    } = req.query;

    // Build filter criteria
    const filterCriteria: any = { collegeId: college._id };

    if (year) filterCriteria.graduationYear = parseInt(year as string);
    if (department) filterCriteria.department = { $regex: department as string, $options: 'i' };
    if (company) filterCriteria.companyName = { $regex: company as string, $options: 'i' };
    if (status) filterCriteria.placementStatus = status;
    if (jobType) filterCriteria.jobType = jobType;
    if (placementType) filterCriteria.placementType = placementType;
    if (verified !== undefined) filterCriteria.isVerified = verified === 'true';
    
    if (minPackage || maxPackage) {
      filterCriteria.packageOffered = {};
      if (minPackage) filterCriteria.packageOffered.$gte = parseFloat(minPackage as string);
      if (maxPackage) filterCriteria.packageOffered.$lte = parseFloat(maxPackage as string);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const sortConfig: any = {};
    sortConfig[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const placements = await Placement.find(filterCriteria)
      .populate('studentId', 'firstName lastName email enrollmentNumber')
      .populate('recruiterId', 'companyInfo.name companyInfo.industry')
      .populate('jobId', 'title jobType')
      .populate('verifiedBy', 'firstName lastName email')
      .sort(sortConfig)
      .skip(skip)
      .limit(parseInt(limit as string))
      .lean();

    const totalCount = await Placement.countDocuments(filterCriteria);

    // Calculate statistics
    const stats = await Placement.aggregate([
      { $match: { collegeId: college._id } },
      {
        $group: {
          _id: null,
          totalPlacements: { $sum: 1 },
          verifiedPlacements: { $sum: { $cond: ['$isVerified', 1, 0] } },
          averagePackage: { $avg: '$packageOffered' },
          highestPackage: { $max: '$packageOffered' },
          lowestPackage: { $min: '$packageOffered' },
          totalStudentsPlaced: { $addToSet: '$studentId' }
        }
      },
      {
        $addFields: {
          totalStudentsPlaced: { $size: '$totalStudentsPlaced' }
        }
      }
    ]);

    const placementStats = stats[0] || {
      totalPlacements: 0,
      verifiedPlacements: 0,
      averagePackage: 0,
      highestPackage: 0,
      lowestPackage: 0,
      totalStudentsPlaced: 0
    };

    res.status(200).json({
      success: true,
      data: {
        placements,
        pagination: {
          currentPage: parseInt(page as string),
          totalPages: Math.ceil(totalCount / parseInt(limit as string)),
          totalCount,
          hasNextPage: skip + placements.length < totalCount,
          hasPrevPage: parseInt(page as string) > 1
        },
        statistics: {
          ...placementStats,
          averagePackage: Math.round(placementStats.averagePackage * 100) / 100,
          verificationRate: placementStats.totalPlacements > 0 ? 
                           Math.round((placementStats.verifiedPlacements / placementStats.totalPlacements) * 100) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching placements:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch placements',
      error: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
    });
  }
});

// Get single placement by ID
router.get('/:placementId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?._id;
    const { placementId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!Types.ObjectId.isValid(placementId)) {
      return res.status(400).json({ success: false, message: 'Invalid placement ID' });
    }

    const college = await College.findOne({ userId });
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    const placement = await Placement.findOne({ _id: placementId, collegeId: college._id })
      .populate('studentId', 'firstName lastName email enrollmentNumber department')
      .populate('recruiterId', 'companyInfo.name companyInfo.industry companyInfo.website')
      .populate('jobId', 'title jobType workMode location')
      .populate('verifiedBy', 'firstName lastName email');

    if (!placement) {
      return res.status(404).json({ success: false, message: 'Placement not found' });
    }

    res.status(200).json({
      success: true,
      data: placement
    });
  } catch (error) {
    console.error('Error fetching placement:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch placement',
      error: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
    });
  }
});

// Create new placement record
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const college = await College.findOne({ userId });
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    const {
      studentId,
      recruiterId,
      jobId,
      studentName,
      studentEmail,
      enrollmentNumber,
      department,
      graduationYear,
      cgpa,
      companyName,
      jobTitle,
      jobType,
      packageOffered,
      packageType = 'fixed',
      jobLocation,
      workType = 'on-site',
      placementStatus = 'offered',
      offerDate,
      joiningDate,
      placementType = 'campus',
      skills = [],
      notes
    } = req.body;

    // Validation
    if (!studentName || !studentEmail || !department || !graduationYear || !companyName || !jobTitle || !jobType || !packageOffered || !jobLocation) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields' 
      });
    }

    // Validate student exists if studentId provided
    if (studentId) {
      if (!Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ success: false, message: 'Invalid student ID' });
      }
      
      const student = await Student.findOne({ _id: studentId, collegeId: college._id });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found in this college' });
      }
    }

    // Validate recruiter exists if recruiterId provided
    if (recruiterId) {
      if (!Types.ObjectId.isValid(recruiterId)) {
        return res.status(400).json({ success: false, message: 'Invalid recruiter ID' });
      }
      
      const recruiter = await Recruiter.findById(recruiterId);
      if (!recruiter) {
        return res.status(404).json({ success: false, message: 'Recruiter not found' });
      }
    }

    // Validate job exists if jobId provided
    if (jobId) {
      if (!Types.ObjectId.isValid(jobId)) {
        return res.status(400).json({ success: false, message: 'Invalid job ID' });
      }
      
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }
    }

    // Create placement record
    const placement = new Placement({
      studentId: studentId ? new Types.ObjectId(studentId) : undefined,
      collegeId: college._id,
      recruiterId: recruiterId ? new Types.ObjectId(recruiterId) : undefined,
      jobId: jobId ? new Types.ObjectId(jobId) : undefined,
      
      // Student details
      studentName: studentName.trim(),
      studentEmail: studentEmail.toLowerCase().trim(),
      enrollmentNumber: enrollmentNumber?.trim(),
      department: department.trim(),
      graduationYear: parseInt(graduationYear),
      cgpa: cgpa ? parseFloat(cgpa) : undefined,
      
      // Company details
      companyName: companyName.trim(),
      jobTitle: jobTitle.trim(),
      jobType,
      
      // Package details
      packageOffered: parseFloat(packageOffered),
      packageType,
      
      // Location details
      jobLocation: jobLocation.trim(),
      workType,
      
      // Status
      placementStatus,
      offerDate: offerDate ? new Date(offerDate) : undefined,
      joiningDate: joiningDate ? new Date(joiningDate) : undefined,
      
      // Additional details
      placementType,
      skills: Array.isArray(skills) ? skills : [],
      notes: notes?.trim(),
      
      // Verification
      isVerified: false
    });

    await placement.save();

    // Populate the created placement for response
    const populatedPlacement = await Placement.findById(placement._id)
      .populate('studentId', 'firstName lastName email enrollmentNumber')
      .populate('recruiterId', 'companyInfo.name companyInfo.industry')
      .populate('jobId', 'title jobType');

    res.status(201).json({
      success: true,
      message: 'Placement record created successfully',
      data: populatedPlacement
    });
  } catch (error) {
    console.error('Error creating placement:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create placement record',
      error: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
    });
  }
});

// Update placement record
router.put('/:placementId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?._id;
    const { placementId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!Types.ObjectId.isValid(placementId)) {
      return res.status(400).json({ success: false, message: 'Invalid placement ID' });
    }

    const college = await College.findOne({ userId });
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    const placement = await Placement.findOne({ _id: placementId, collegeId: college._id });
    if (!placement) {
      return res.status(404).json({ success: false, message: 'Placement not found' });
    }

    const {
      studentName,
      studentEmail,
      enrollmentNumber,
      department,
      graduationYear,
      cgpa,
      companyName,
      jobTitle,
      jobType,
      packageOffered,
      packageType,
      jobLocation,
      workType,
      placementStatus,
      offerDate,
      joiningDate,
      placementType,
      skills,
      notes
    } = req.body;

    // Update fields
    if (studentName) placement.studentName = studentName.trim();
    if (studentEmail) placement.studentEmail = studentEmail.toLowerCase().trim();
    if (enrollmentNumber !== undefined) placement.enrollmentNumber = enrollmentNumber?.trim();
    if (department) placement.department = department.trim();
    if (graduationYear) placement.graduationYear = parseInt(graduationYear);
    if (cgpa !== undefined) placement.cgpa = cgpa ? parseFloat(cgpa) : undefined;
    if (companyName) placement.companyName = companyName.trim();
    if (jobTitle) placement.jobTitle = jobTitle.trim();
    if (jobType) placement.jobType = jobType;
    if (packageOffered) placement.packageOffered = parseFloat(packageOffered);
    if (packageType) placement.packageType = packageType;
    if (jobLocation) placement.jobLocation = jobLocation.trim();
    if (workType) placement.workType = workType;
    if (placementStatus) placement.placementStatus = placementStatus;
    if (offerDate !== undefined) placement.offerDate = offerDate ? new Date(offerDate) : undefined;
    if (joiningDate !== undefined) placement.joiningDate = joiningDate ? new Date(joiningDate) : undefined;
    if (placementType) placement.placementType = placementType;
    if (skills) placement.skills = Array.isArray(skills) ? skills : [];
    if (notes !== undefined) placement.notes = notes?.trim();

    await placement.save();

    // Populate the updated placement for response
    const populatedPlacement = await Placement.findById(placement._id)
      .populate('studentId', 'firstName lastName email enrollmentNumber')
      .populate('recruiterId', 'companyInfo.name companyInfo.industry')
      .populate('jobId', 'title jobType')
      .populate('verifiedBy', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Placement record updated successfully',
      data: populatedPlacement
    });
  } catch (error) {
    console.error('Error updating placement:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update placement record',
      error: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
    });
  }
});

// Verify placement record
router.post('/:placementId/verify', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?._id;
    const { placementId } = req.params;
    const { notes } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!Types.ObjectId.isValid(placementId)) {
      return res.status(400).json({ success: false, message: 'Invalid placement ID' });
    }

    const college = await College.findOne({ userId });
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    const placement = await Placement.findOne({ _id: placementId, collegeId: college._id });
    if (!placement) {
      return res.status(404).json({ success: false, message: 'Placement not found' });
    }

    if (placement.isVerified) {
      return res.status(400).json({ success: false, message: 'Placement is already verified' });
    }

    // Verify placement
    placement.isVerified = true;
    placement.verifiedBy = userId;
    placement.verifiedAt = new Date();
    if (notes) {
      placement.notes = placement.notes ? `${placement.notes}\n\nVerification Notes: ${notes}` : `Verification Notes: ${notes}`;
    }

    await placement.save();

    res.status(200).json({
      success: true,
      message: 'Placement record verified successfully',
      data: {
        placementId: placement._id,
        isVerified: placement.isVerified,
        verifiedAt: placement.verifiedAt
      }
    });
  } catch (error) {
    console.error('Error verifying placement:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to verify placement record',
      error: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
    });
  }
});

// Delete placement record
router.delete('/:placementId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?._id;
    const { placementId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!Types.ObjectId.isValid(placementId)) {
      return res.status(400).json({ success: false, message: 'Invalid placement ID' });
    }

    const college = await College.findOne({ userId });
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    const placement = await Placement.findOne({ _id: placementId, collegeId: college._id });
    if (!placement) {
      return res.status(404).json({ success: false, message: 'Placement not found' });
    }

    // Check if placement is verified
    if (placement.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete verified placement record. Please contact administrator.' 
      });
    }

    await Placement.findByIdAndDelete(placementId);

    res.status(200).json({
      success: true,
      message: 'Placement record deleted successfully',
      data: { deletedPlacementId: placementId }
    });
  } catch (error) {
    console.error('Error deleting placement:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete placement record',
      error: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
    });
  }
});

// Get placement analytics
router.get('/analytics/summary', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const college = await College.findOne({ userId });
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    const { year } = req.query;
    const matchCriteria: any = { collegeId: college._id };
    if (year) {
      matchCriteria.graduationYear = parseInt(year as string);
    }

    // Overall statistics
    const overallStats = await Placement.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: null,
          totalPlacements: { $sum: 1 },
          averagePackage: { $avg: '$packageOffered' },
          highestPackage: { $max: '$packageOffered' },
          lowestPackage: { $min: '$packageOffered' },
          verifiedPlacements: { $sum: { $cond: ['$isVerified', 1, 0] } }
        }
      }
    ]);

    // Department-wise breakdown
    const departmentStats = await Placement.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          averagePackage: { $avg: '$packageOffered' },
          highestPackage: { $max: '$packageOffered' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Company-wise breakdown
    const companyStats = await Placement.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$companyName',
          count: { $sum: 1 },
          averagePackage: { $avg: '$packageOffered' },
          highestPackage: { $max: '$packageOffered' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Monthly trend (last 12 months)
    const monthlyTrend = await Placement.aggregate([
      { 
        $match: { 
          ...matchCriteria,
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          averagePackage: { $avg: '$packageOffered' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overall: overallStats[0] || { totalPlacements: 0, averagePackage: 0, highestPackage: 0, lowestPackage: 0, verifiedPlacements: 0 },
        departments: departmentStats,
        companies: companyStats,
        monthlyTrend
      }
    });
  } catch (error) {
    console.error('Error fetching placement analytics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch placement analytics',
      error: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
    });
  }
});

export default router;