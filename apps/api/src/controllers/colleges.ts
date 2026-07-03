import { Request, Response } from 'express';
import { bunnyNetService } from '../services/bunnynet';
import { College } from '../models/College';
import { Student } from '../models/Student';
import { Job } from '../models/Job';
import { User } from '../models/User';
import Connection from '../models/Connection';
import { Recruiter } from '../models/Recruiter';
import { Placement } from '../models/Placement';
import { Event } from '../models/Event';
import { Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

export const getAllColleges = async (req: Request, res: Response) => {
    try {
        const colleges = await College.find({ isActive: true })
            .select('_id name shortName domainCode address placementContact')
            .lean();
        res.status(200).json(colleges);
    } catch (error) {
        console.error('Error fetching colleges:', error);
        res.status(500).json({ message: 'Server error fetching colleges' });
    }
};

// Endpoint to get students by collegeId

export const getStudentsByCollege = async (req: Request, res: Response) => {
    const { collegeId } = req.query;

    if (!collegeId || !Types.ObjectId.isValid(collegeId as string)) {
        return res.status(400).json({ message: 'Invalid or missing collegeId' });
    }

    try {
        const students = await Student.find({
            collegeId: new Types.ObjectId(collegeId as string),
            isActive: true
        }).lean();

        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching students by collegeId:', error);
        res.status(500).json({ message: 'Server error fetching students' });
    }
};

// Alias for route compatibility
export const getColleges = getAllColleges;

export const getCollegeById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid college ID' });
        }

        const college = await College.findById(id)
            .populate('userId', 'email phone whatsappNumber')
            .populate('students', 'firstName lastName email department year enrollmentNumber')
            .populate('approvedRecruiters', 'companyInfo.name companyInfo.industry')
            .lean();

        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

         // Migrate old facility IDs to new ones
        if (college.selectedFacilities && Array.isArray(college.selectedFacilities)) {
            college.selectedFacilities = college.selectedFacilities.map((facilityId: string) => {
                if (facilityId === 'sports-complex') {
                    return 'sports';
                }
                return facilityId;
            });
        }

        // Get additional statistics
        const totalStudents = await Student.countDocuments({ collegeId: college._id, isActive: true });
        const placedStudents = Math.floor(totalStudents * 0.7); // Mock placement rate
        const recruitingCompanies = college.approvedRecruiters?.length || 0;

        // Enhance college data with computed stats
        const enhancedCollege = {
            ...college,
            stats: {
                totalStudents,
                placedStudents,
                recruitingCompanies,
                totalPrograms: college.offeredPrograms?.length || 0,
                averagePackage: 6.5,
                highestPackage: 25,
                placementRate: totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 70,
                rating: 4.2
            },
            // Ensure basic fields are present with safe access
            name: college.name || 'College Name',
            type: 'Autonomous', // Default type since it's not in the model
            establishedYear: college.establishedYear || new Date().getFullYear() - 30,
            isVerified: college.approvalStatus === 'approved',
            description: 'A premier educational institution committed to excellence in higher education.',
            // Pass through NAAC and NIRF data
            naacRating: college.naacRating,
            nirfRanking: college.nirfRanking,
            // Add programs if not present
            programs: college.offeredPrograms?.map((program: string) => ({
                name: program,
                description: `Comprehensive ${program} program designed for industry readiness`,
                duration: program.includes('B.') ? '4 years' : program.includes('M.') ? '2 years' : '3 years',
                seats: 60
            })) || [
                {
                    name: 'Computer Science Engineering',
                    description: 'Comprehensive CSE program designed for industry readiness',
                    duration: '4 years',
                    seats: 60
                },
                {
                    name: 'Information Technology',
                    description: 'Comprehensive IT program designed for industry readiness',
                    duration: '4 years',
                    seats: 60
                }
            ]
        };

        res.status(200).json(enhancedCollege);
    } catch (error) {
        console.error('Error fetching college by ID:', error);
        res.status(500).json({ message: 'Server error fetching college' });
    }
};

// Alias for route compatibility
export const getCollegeByUserId = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        if (!Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId' });
        }
        
        // Find college and populate user email
        const college = await College.findOne({ userId: userId }).populate('userId', 'email').lean();
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        
        // Extract user email from populated user data
        const userEmail = (college.userId as any)?.email || college.primaryContact?.email;
        
        // Include approval status and user email in response
        res.status(200).json({
            ...college,
            userEmail: userEmail,
            canAccessDashboard: college.approvalStatus === 'approved'
        });
    } catch (error) {
        console.error('Error fetching college by userId:', error);
        res.status(500).json({ message: 'Server error fetching college' });
    }
};

export const createCollege = async (req: Request, res: Response) => {
    try {
        const {
            name,
            shortName,
            domainCode,
            website,
            establishedYear,
            affiliation,
            recognizedBy,
            collegeType,
            aboutCollege,
            departments,
            offeredPrograms,
            accreditation,
            address,
            primaryContact,
            placementContact
        } = req.body;

        // Validation
        if (!name || !domainCode || !establishedYear || !affiliation || !address || !primaryContact || !departments) {
            return res.status(400).json({ 
                message: 'Missing required fields: name, domainCode, establishedYear, affiliation, address, primaryContact, departments' 
            });
        }

        // Check if domainCode already exists
        const existingCollege = await College.findOne({ domainCode: domainCode.toUpperCase() });
        if (existingCollege) {
            return res.status(400).json({ 
                message: 'Domain code already exists. Please choose a different domain code.' 
            });
        }

        // Create new college
        const college = new College({
            name: name.trim(),
            shortName: shortName?.trim(),
            domainCode: domainCode.toUpperCase().trim(),
            website: website?.trim(),
            establishedYear: parseInt(establishedYear),
            affiliation: affiliation.trim(),
            recognizedBy: recognizedBy?.trim(),
            collegeType: collegeType?.trim(),
            aboutCollege: aboutCollege?.trim(),
            departments: Array.isArray(departments) ? departments : [departments],
            offeredPrograms: Array.isArray(offeredPrograms) ? offeredPrograms : (offeredPrograms ? [offeredPrograms] : []),
            accreditation: Array.isArray(accreditation) ? accreditation : (accreditation ? [accreditation] : []),
            
            // Address
            address: {
                street: address.street?.trim(),
                city: address.city?.trim(),
                state: address.state?.trim(),
                zipCode: address.zipCode?.trim(),
                country: address.country?.trim() || 'India'
            },
            
            // Primary Contact
            primaryContact: {
                name: primaryContact.name?.trim(),
                designation: primaryContact.designation?.trim(),
                email: primaryContact.email?.toLowerCase().trim(),
                phone: primaryContact.phone?.trim()
            },
            
            // Placement Contact (optional)
            ...(placementContact && {
                placementContact: {
                    name: placementContact.name?.trim(),
                    designation: placementContact.designation?.trim(),
                    email: placementContact.email?.toLowerCase().trim(),
                    phone: placementContact.phone?.trim()
                }
            }),
            
            // Default values
            approvalStatus: 'pending',
            isActive: false,
            isVerified: false,
            allowDirectApplications: false,
            students: [],
            approvedRecruiters: [],
            pendingRecruiters: [],
            placementStats: [],
            isPlacementActive: true
        });

        await college.save();

        res.status(201).json({
            success: true,
            message: 'College created successfully. Pending admin approval.',
            data: {
                _id: college._id,
                name: college.name,
                domainCode: college.domainCode,
                approvalStatus: college.approvalStatus
            }
        });
    } catch (error) {
        console.error('Error creating college:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to create college. Please try again.',
            error: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
        });
    }
};

export const updateCollege = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        if (!Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId' });
        }

        const updateData = req.body;
        
        // Debug logging
        console.log('=== UPDATE COLLEGE DEBUG ===');
        console.log('UserId:', userId);
        console.log('Update Data:', JSON.stringify(updateData, null, 2));
        console.log('NAAC Rating:', updateData.naacRating);
        console.log('NIRF Ranking:', updateData.nirfRanking);
        console.log('===========================');

        const updatedCollege = await College.findOneAndUpdate(
            { userId: userId },
            updateData,
            { new: true }
        ).lean();

        if (!updatedCollege) {
            return res.status(404).json({ message: 'College not found' });
        }

        console.log('=== AFTER UPDATE DEBUG ===');
        console.log('Updated NAAC Rating:', updatedCollege.naacRating);
        console.log('Updated NIRF Ranking:', updatedCollege.nirfRanking);
        console.log('==========================');

        res.status(200).json({ college: updatedCollege });
    } catch (error) {
        console.error('Error updating college:', error);
        res.status(500).json({ message: 'Server error updating college' });
    }
};

// Update college profile (authenticated route)
export const updateCollegeProfile = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const userId = user._id || user.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const updateData = req.body;

        const updatedCollege = await College.findOneAndUpdate(
            { userId: userId },
            { $set: updateData },
            { new: true }
        ).lean();

        if (!updatedCollege) {
            return res.status(404).json({ message: 'College profile not found' });
        }

        res.status(200).json(updatedCollege);
    } catch (error) {
        console.error('Error updating college profile:', error);
        res.status(500).json({ message: 'Server error updating college profile' });
    }
};

// Alias for route compatibility
export const updateCollegeByUserId = updateCollege;

export const deleteCollege = async (req: Request, res: Response) => {
    try {
        const collegeId = req.params.id;
        
        // Validate college ID
        if (!Types.ObjectId.isValid(collegeId)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid college ID' 
            });
        }

        // Find the college
        const college = await College.findById(collegeId);
        if (!college) {
            return res.status(404).json({ 
                success: false,
                message: 'College not found' 
            });
        }

        // Check if college has active students
        const activeStudentsCount = await Student.countDocuments({ 
            collegeId: college._id, 
            isActive: true 
        });

        // Check if college has active jobs
        const activeJobsCount = await Job.countDocuments({
            $or: [
                { collegeId: college._id },
                { targetColleges: college._id }
            ],
            status: 'active'
        });

        // Soft delete if there are dependencies, hard delete if no dependencies
        if (activeStudentsCount > 0 || activeJobsCount > 0) {
            // Soft delete - just deactivate
            college.isActive = false;
            college.approvalStatus = 'deactivated';
            await college.save();

            res.status(200).json({
                success: true,
                message: `College deactivated successfully. Cannot delete due to ${activeStudentsCount} active students and ${activeJobsCount} active jobs.`,
                data: {
                    action: 'deactivated',
                    activeStudents: activeStudentsCount,
                    activeJobs: activeJobsCount
                }
            });
        } else {
            // Hard delete - no dependencies
            
            // Also delete the associated user if it exists
            if (college.userId) {
                await User.findByIdAndDelete(college.userId);
            }
            
            // Delete the college
            await College.findByIdAndDelete(collegeId);

            res.status(200).json({
                success: true,
                message: 'College deleted successfully',
                data: {
                    action: 'deleted',
                    deletedCollegeId: collegeId
                }
            });
        }
    } catch (error) {
        console.error('Error deleting college:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to delete college. Please try again.',
            error: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
        });
    }
};

export const manageRecruiterApproval = async (req: Request, res: Response) => {
    try {
        const { collegeId, recruiterId } = req.params;
        const { action, reason } = req.body; // action: 'approve' | 'reject'

        // Validate IDs
        if (!Types.ObjectId.isValid(collegeId) || !Types.ObjectId.isValid(recruiterId)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid college ID or recruiter ID' 
            });
        }

        // Validate action
        if (!action || !['approve', 'reject'].includes(action)) {
            return res.status(400).json({ 
                success: false,
                message: 'Action must be either "approve" or "reject"' 
            });
        }

        // Find the college
        const college = await College.findById(collegeId);
        if (!college) {
            return res.status(404).json({ 
                success: false,
                message: 'College not found' 
            });
        }

        // Find the recruiter
        const recruiter = await Recruiter.findById(recruiterId);
        if (!recruiter) {
            return res.status(404).json({ 
                success: false,
                message: 'Recruiter not found' 
            });
        }

        // Check if recruiter is in pending list
        const recruiterObjectId = new Types.ObjectId(recruiterId);
        if (!college.pendingRecruiters.some(id => id.equals(recruiterObjectId))) {
            return res.status(400).json({ 
                success: false,
                message: 'Recruiter is not in pending approval list' 
            });
        }

        if (action === 'approve') {
            // Move from pending to approved
            college.pendingRecruiters = college.pendingRecruiters.filter(
                id => !id.equals(recruiterObjectId)
            );
            college.approvedRecruiters.push(recruiterObjectId);

            // Update recruiter status
            if (!(recruiter as any).approvedByColleges) {
                (recruiter as any).approvedByColleges = [];
            }
            if (!(recruiter as any).approvedByColleges.some((id: any) => id.equals(college._id))) {
                (recruiter as any).approvedByColleges.push(college._id);
            }

            await recruiter.save();
            await college.save();

            res.status(200).json({
                success: true,
                message: 'Recruiter approved successfully',
                data: {
                    action: 'approved',
                    recruiterId: recruiterId,
                    recruiterName: recruiter.companyInfo?.name || 'Unknown Company',
                    collegeName: college.name
                }
            });

        } else if (action === 'reject') {
            // Remove from pending list
            college.pendingRecruiters = college.pendingRecruiters.filter(
                id => !id.equals(recruiterObjectId)
            );

            // Add rejection info to recruiter if needed
            if (!(recruiter as any).rejectedByColleges) {
                (recruiter as any).rejectedByColleges = [];
            }
            
            const rejectionRecord = {
                collegeId: college._id,
                reason: reason || 'No reason provided',
                rejectedAt: new Date()
            };
            
            (recruiter as any).rejectedByColleges = (recruiter as any).rejectedByColleges.filter(
                (rejection: any) => !rejection.collegeId.equals(college._id)
            );
            (recruiter as any).rejectedByColleges.push(rejectionRecord);

            await recruiter.save();
            await college.save();

            res.status(200).json({
                success: true,
                message: 'Recruiter rejected successfully',
                data: {
                    action: 'rejected',
                    recruiterId: recruiterId,
                    recruiterName: recruiter.companyInfo?.name || 'Unknown Company',
                    collegeName: college.name,
                    reason: reason || 'No reason provided'
                }
            });
        }

    } catch (error) {
        console.error('Error managing recruiter approval:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to manage recruiter approval. Please try again.',
            error: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
        });
    }
};

export const getCollegeStats = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        let college;
        
        // Check if college ID is provided in params (for /:id/stats route)
        if (req.params.id) {
            const collegeId = req.params.id;
            if (!Types.ObjectId.isValid(collegeId)) {
                return res.status(400).json({ message: 'Invalid college ID' });
            }
            
            // Find college by ID and verify it belongs to the authenticated user
            college = await College.findOne({ 
                _id: collegeId,
                userId: userId  // Security: ensure the college belongs to the authenticated user
            }).lean();
        } else {
            // Find college by user ID (for /stats route)
            college = await College.findOne({ userId }).lean();
        }
        
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        // Get students count
        const totalStudents = await Student.countDocuments({ collegeId: college._id, isActive: true });
        const activeStudents = await Student.countDocuments({ 
            collegeId: college._id, 
            isActive: true,
            lastLoginDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Active in last 30 days
        });

        // Get jobs count
        const activeJobs = await Job.countDocuments({ 
            targetColleges: college._id,
            status: 'active'
        });

        // Mock data for now - you can implement real placement tracking later
        const stats = {
            totalStudents,
            activeStudents,
            totalPlacements: Math.floor(totalStudents * 0.7), // Mock 70% placement rate
            averagePackage: 6.5, // Mock average package
            topPackage: 25, // Mock top package
            placementPercentage: 70, // Mock placement percentage
            activeJobs,
            upcomingEvents: 0 // Will implement events later
        };

        res.status(200).json(stats);
    } catch (error) {
        console.error('Error fetching college stats:', error);
        res.status(500).json({ message: 'Server error fetching college stats' });
    }
};

// Get college profile
export const getCollegeProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const college = await College.findOne({ userId })
            .populate('userId', 'email phone whatsappNumber')
            .populate('students', 'firstName lastName email department year enrollmentNumber')
            .populate('approvedRecruiters', 'companyInfo.name companyInfo.industry')
            .lean();
            
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        // Get additional statistics
        const totalStudents = await Student.countDocuments({ collegeId: college._id, isActive: true });
        const placedStudents = Math.floor(totalStudents * 0.7); // Mock placement rate
        const recruitingCompanies = college.approvedRecruiters?.length || 0;

        // Enhance college data with computed stats
        const enhancedCollege = {
            ...college,
            stats: {
                totalStudents,
                placedStudents,
                recruitingCompanies,
                averagePackage: 6.5,
                highestPackage: 25,
                placementRate: totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0,
                rating: 4.2
            },
            // Add programs if not present
            programs: college.offeredPrograms?.map((program: string) => ({
                name: program,
                description: `Comprehensive ${program} program designed for industry readiness`,
                duration: program.includes('B.') ? '4 years' : program.includes('M.') ? '2 years' : '3 years',
                seats: 60
            })) || [],
            // Ensure contact information is properly formatted
            placementContact: college.placementContact || {
                name: 'Not provided',
                email: 'Not provided',
                phone: 'Not provided'
            }
        };

        res.status(200).json(enhancedCollege);
    } catch (error) {
        console.error('Error fetching college profile:', error);
        res.status(500).json({ message: 'Server error fetching college profile' });
    }
};

// Get students for the college
export const getCollegeStudents = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Find college by user ID
        const college = await College.findOne({ userId }).lean();
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        // Get students for this college
        const students = await Student.find({ 
            collegeId: college._id,
            isActive: true 
        }).select('firstName lastName email department year enrollmentNumber skills cgpa resumeUrl isActive lastLoginDate createdAt').lean();

        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching college students:', error);
        res.status(500).json({ message: 'Server error fetching students' });
    }
};

// Get jobs targeting this college
export const getCollegeJobs = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Find college by user ID
        const college = await College.findOne({ userId }).lean();
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        // Get jobs targeting this college
        const jobs = await Job.find({ 
            targetColleges: college._id,
            status: { $in: ['active', 'draft'] }
        }).populate('recruiterId', 'companyInfo.name').lean();

        // Transform the response to include company name
        const transformedJobs = jobs.map((job: any) => ({
            _id: job._id,
            title: job.title,
            company: job.recruiterId?.companyInfo?.name || job.companyName || 'Unknown Company',
            location: job.locations?.[0]?.city || 'Remote',
            type: job.jobType,
            description: job.description,
            requirements: job.requirements || job.requiredSkills || [],
            salary: job.salaryRange?.max || job.salary || 'Not specified',
            isActive: job.status === 'active',
            applicationDeadline: job.applicationDeadline,
            createdAt: job.createdAt
        }));

        res.status(200).json(transformedJobs);
    } catch (error) {
        console.error('Error fetching college jobs:', error);
        res.status(500).json({ message: 'Server error fetching jobs' });
    }
};

// Get college placements (mock data for now)
export const getCollegePlacements = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Find the college
        const college = await College.findOne({ userId });
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        // Get query parameters for filtering
        const { 
            year, 
            department, 
            company, 
            status, 
            minPackage, 
            maxPackage,
            jobType,
            page = 1, 
            limit = 10,
            sortBy = 'packageOffered',
            sortOrder = 'desc'
        } = req.query;

        // Build filter criteria
        const filterCriteria: any = { 
            collegeId: college._id,
            isVerified: true // Only show verified placements
        };

        if (year) {
            filterCriteria.graduationYear = parseInt(year as string);
        }
        if (department) {
            filterCriteria.department = { $regex: department as string, $options: 'i' };
        }
        if (company) {
            filterCriteria.companyName = { $regex: company as string, $options: 'i' };
        }
        if (status) {
            filterCriteria.placementStatus = status;
        }
        if (jobType) {
            filterCriteria.jobType = jobType;
        }
        if (minPackage || maxPackage) {
            filterCriteria.packageOffered = {};
            if (minPackage) filterCriteria.packageOffered.$gte = parseFloat(minPackage as string);
            if (maxPackage) filterCriteria.packageOffered.$lte = parseFloat(maxPackage as string);
        }

        // Pagination
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        
        // Sort configuration
        const sortConfig: any = {};
        sortConfig[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

        // Fetch placements with pagination and sorting
        const placements = await Placement.find(filterCriteria)
            .populate('studentId', 'firstName lastName email enrollmentNumber')
            .populate('recruiterId', 'companyInfo.name companyInfo.industry')
            .sort(sortConfig)
            .skip(skip)
            .limit(parseInt(limit as string))
            .lean();

        // Get total count for pagination
        const totalCount = await Placement.countDocuments(filterCriteria);

        // Calculate statistics
        const stats = await Placement.aggregate([
            { $match: { collegeId: college._id, isVerified: true } },
            {
                $group: {
                    _id: null,
                    totalPlacements: { $sum: 1 },
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

        // Company-wise placement stats
        const companyStats = await Placement.aggregate([
            { $match: { collegeId: college._id, isVerified: true } },
            {
                $group: {
                    _id: '$companyName',
                    placements: { $sum: 1 },
                    averagePackage: { $avg: '$packageOffered' },
                    highestPackage: { $max: '$packageOffered' }
                }
            },
            { $sort: { placements: -1 } },
            { $limit: 10 }
        ]);

        const placementStats = stats[0] || {
            totalPlacements: 0,
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
                    placementRate: Math.round((placementStats.totalStudentsPlaced / Math.max(college.students.length, 1)) * 100)
                },
                topCompanies: companyStats
            }
        });
    } catch (error) {
        console.error('Error fetching college placements:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error fetching placements',
            error: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
        });
    }
};

export const getCollegeEvents = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Find the college
        const college = await College.findOne({ userId });
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        // Get query parameters for filtering
        const { 
            eventType, 
            category, 
            status = 'published',
            upcoming = true,
            startDate,
            endDate,
            page = 1, 
            limit = 10,
            sortBy = 'startDateTime',
            sortOrder = 'asc'
        } = req.query;

        // Build filter criteria
        const filterCriteria: any = { 
            collegeId: college._id
        };

        if (eventType) {
            filterCriteria.eventType = eventType;
        }
        if (category) {
            filterCriteria.category = category;
        }
        if (status) {
            filterCriteria.status = status;
        }
        
        // Date filtering
        if (upcoming === 'true') {
            filterCriteria.startDateTime = { $gte: new Date() };
        }
        
        if (startDate || endDate) {
            filterCriteria.startDateTime = {};
            if (startDate) filterCriteria.startDateTime.$gte = new Date(startDate as string);
            if (endDate) filterCriteria.startDateTime.$lte = new Date(endDate as string);
        }

        // Pagination
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        
        // Sort configuration
        const sortConfig: any = {};
        sortConfig[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

        // Fetch events with pagination and sorting
        const events = await Event.find(filterCriteria)
            .populate('recruiterId', 'companyInfo.name companyInfo.industry')
            .populate('organizerId', 'firstName lastName email')
            .sort(sortConfig)
            .skip(skip)
            .limit(parseInt(limit as string))
            .lean();

        // Get total count for pagination
        const totalCount = await Event.countDocuments(filterCriteria);

        // Calculate additional statistics
        const eventStats = await Event.aggregate([
            { $match: { collegeId: college._id } },
            {
                $group: {
                    _id: null,
                    totalEvents: { $sum: 1 },
                    upcomingEvents: { 
                        $sum: { 
                            $cond: [
                                { $gte: ['$startDateTime', new Date()] }, 
                                1, 
                                0
                            ] 
                        } 
                    },
                    totalRegistrations: { $sum: { $size: '$registeredStudents' } },
                    totalAttendees: { $sum: { $size: '$attendedStudents' } }
                }
            }
        ]);

        // Event type statistics
        const typeStats = await Event.aggregate([
            { $match: { collegeId: college._id } },
            {
                $group: {
                    _id: '$eventType',
                    count: { $sum: 1 },
                    totalRegistrations: { $sum: { $size: '$registeredStudents' } }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Enhance events with computed fields
        const enhancedEvents = events.map((event: any) => ({
            ...event,
            registeredCount: event.registeredStudents?.length || 0,
            attendedCount: event.attendedStudents?.length || 0,
            isLive: event.startDateTime <= new Date() && event.endDateTime >= new Date() && event.status === 'ongoing',
            isRegistrationOpen: event.registrationRequired && 
                               event.status === 'published' && 
                               (!event.registrationDeadline || event.registrationDeadline >= new Date()) &&
                               event.startDateTime > new Date(),
            canRegister: event.maxParticipants ? 
                        (event.registeredStudents?.length || 0) < event.maxParticipants : 
                        true
        }));

        const stats = eventStats[0] || {
            totalEvents: 0,
            upcomingEvents: 0,
            totalRegistrations: 0,
            totalAttendees: 0
        };

        res.status(200).json({
            success: true,
            data: {
                events: enhancedEvents,
                pagination: {
                    currentPage: parseInt(page as string),
                    totalPages: Math.ceil(totalCount / parseInt(limit as string)),
                    totalCount,
                    hasNextPage: skip + events.length < totalCount,
                    hasPrevPage: parseInt(page as string) > 1
                },
                statistics: {
                    ...stats,
                    attendanceRate: stats.totalRegistrations > 0 ? 
                                   Math.round((stats.totalAttendees / stats.totalRegistrations) * 100) : 0
                },
                eventTypes: typeStats
            }
        });
    } catch (error) {
        console.error('Error fetching college events:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error fetching events',
            error: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
        });
    }
};

export const searchColleges = async (req: Request, res: Response) => {
    try {
        const { query, limit = 10 } = req.query;
        
        // Validate input
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Search query is required' 
            });
        }

        const searchTerm = query.trim();
        const limitNum = Math.min(Number(limit) || 10, 50); // Cap at 50 results

        // Create search regex for case-insensitive partial matching
        const searchRegex = new RegExp(searchTerm, 'i');

        // Search approved and active colleges across multiple fields
        const colleges = await College.find({
            $and: [
                {
                    $or: [
                        { name: searchRegex },
                        { shortName: searchRegex },
                        { affiliation: searchRegex },
                        { 'address.city': searchRegex },
                        { 'address.state': searchRegex },
                        { 'primaryContact.name': searchRegex },
                        { offeredPrograms: { $in: [searchRegex] } },
                        { departments: { $in: [searchRegex] } }
                    ]
                },
                { isActive: true },
                { approvalStatus: 'approved' }
            ]
        })
        .select({
            '_id': 1,
            'name': 1,
            'shortName': 1,
            'logo': 1,
            'address': 1,
            'establishedYear': 1,
            'affiliation': 1,
            'offeredPrograms': 1,
            'departments': 1,
            'isVerified': 1,
            'primaryContact.name': 1,
            'primaryContact.designation': 1
        })
        .limit(limitNum)
        .sort({ name: 1 })
        .lean();

        // Format results for frontend
        const formattedResults = colleges.map(college => ({
            id: college._id,
            type: 'college',
            name: college.name,
            shortName: college.shortName,
            logo: college.logo,
            location: `${college.address.city}, ${college.address.state}`,
            establishedYear: college.establishedYear,
            affiliation: college.affiliation,
            programs: college.offeredPrograms,
            departments: college.departments,
            primaryContact: college.primaryContact,
            isVerified: college.isVerified
        }));

        res.status(200).json({
            success: true,
            data: formattedResults,
            count: formattedResults.length,
            query: searchTerm
        });

    } catch (error) {
        console.error('Error searching colleges:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while searching colleges'
        });
    }
};

// Resubmit college application
export const resubmitCollege = async (req: Request, res: Response) => {
    try {
        const { notes } = req.body; // Changed from resubmissionNotes to notes
        const userId = req.user?._id;
        const files = req.files as Express.Multer.File[];

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const college = await College.findOne({ userId });
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        // Handle file uploads to BunnyCDN
        const supportingDocuments: string[] = [];
        if (files && files.length > 0) {
            for (const file of files) {
                try {
                    const uploadResult = await bunnyNetService.uploadFile(
                        file.buffer,
                        `college-resubmission-${college._id}-${Date.now()}-${file.originalname}`,
                        {
                            folder: 'college-resubmissions',
                            allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                            maxSize: 10 * 1024 * 1024 // 10MB
                        }
                    );

                    if (uploadResult.success && uploadResult.cdnUrl) {
                        supportingDocuments.push(uploadResult.cdnUrl);
                    } else {
                        console.error(`Failed to upload file ${file.originalname}:`, uploadResult.error);
                    }
                } catch (uploadError) {
                    console.error(`Error uploading file ${file.originalname}:`, uploadError);
                }
            }
        }

        // Reset approval status to pending and add resubmission data
        college.approvalStatus = 'pending';
        college.resubmissionNotes = notes;
        college.rejectionReason = undefined; // Clear previous rejection reason
        
        // Add supporting documents if any were uploaded
        if (supportingDocuments.length > 0) {
            // Store in submittedDocuments field as defined in the College model
            college.submittedDocuments = supportingDocuments;
        }
        
        await college.save();

        res.status(200).json({ 
            message: 'Application resubmitted successfully',
            college: college,
            uploadedDocuments: supportingDocuments.length
        });
    } catch (error) {
        console.error('Error resubmitting college application:', error);
        res.status(500).json({ message: 'Server error resubmitting application' });
    }
};

// Get college connections and partnerships
export const getCollegeConnections = async (req: Request, res: Response) => {
    try {
        const { collegeId } = req.params;
        
        if (!Types.ObjectId.isValid(collegeId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid college ID' 
            });
        }

        // Find all accepted connections where this college is involved
        const connections = await Connection.find({
            $or: [
                { requester: new Types.ObjectId(collegeId) },
                { target: new Types.ObjectId(collegeId) }
            ],
            status: 'accepted'
        }).lean();

        // Transform the data to include company information
        const formattedConnections = await Promise.all(
            connections.map(async (connection) => {
                try {
                    let companyInfo = null;
                    
                    // Determine which ID is the recruiter/company
                    const otherPartyId = connection.requester.toString() === collegeId 
                        ? connection.target 
                        : connection.requester;

                    // Try to find recruiter by user ID or model ID
                    let recruiter = await Recruiter.findOne({
                        $or: [
                            { _id: otherPartyId },
                            { userId: otherPartyId }
                        ]
                    }).populate('userId', 'email').lean();
                    
                    if (recruiter) {
                        companyInfo = {
                            companyName: (recruiter as any).companyInfo?.name || (recruiter as any).companyName || 'Unknown Company',
                            industry: (recruiter as any).companyInfo?.industry || (recruiter as any).industry || 'Industry not specified',
                            website: (recruiter as any).companyInfo?.website || (recruiter as any).website,
                            email: (recruiter.userId as any)?.email
                        };
                    }

                    // Count active jobs from this company if we have company info
                    const activeJobs = companyInfo ? await Job.countDocuments({
                        $or: [
                            { 'company.name': companyInfo.companyName },
                            { 'companyName': companyInfo.companyName }
                        ],
                        status: 'active'
                    }) : 0;

                    return {
                        connectionId: connection._id,
                        companyName: companyInfo?.companyName || 'Unknown Company',
                        industry: companyInfo?.industry || 'Industry not specified',
                        website: companyInfo?.website,
                        establishedDate: connection.acceptedAt || connection.createdAt,
                        activeJobs,
                        connectionType: 'partnership'
                    };
                } catch (error) {
                    console.error('Error processing connection:', error);
                    return null;
                }
            })
        );

        // Filter out null values
        let validConnections = formattedConnections.filter(conn => conn !== null);

        // If no real connections, add some mock data for demonstration
        if (validConnections.length === 0) {
            validConnections = [
                {
                    connectionId: new Types.ObjectId(),
                    companyName: 'TechCorp Solutions',
                    industry: 'Information Technology',
                    website: 'https://techcorp.com',
                    establishedDate: new Date('2024-01-15'),
                    activeJobs: 3,
                    connectionType: 'partnership'
                },
                {
                    connectionId: new Types.ObjectId(),
                    companyName: 'InnovateX',
                    industry: 'Software Development',
                    website: 'https://innovatex.com',
                    establishedDate: new Date('2024-02-20'),
                    activeJobs: 2,
                    connectionType: 'partnership'
                },
                {
                    connectionId: new Types.ObjectId(),
                    companyName: 'DataSoft Inc',
                    industry: 'Data Analytics',
                    website: 'https://datasoft.com',
                    establishedDate: new Date('2024-03-10'),
                    activeJobs: 1,
                    connectionType: 'partnership'
                }
            ];
        }

        // Limit results
        validConnections = validConnections.slice(0, 20);

        res.status(200).json({
            success: true,
            data: validConnections,
            totalConnections: validConnections.length
        });

    } catch (error) {
        console.error('Error fetching college connections:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching college connections'
        });
    }
};

// Upload college logo
export const uploadCollegeLogo = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const userId = user._id || user.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Validate file type - only images allowed
        if (!file.mimetype.startsWith('image/')) {
            return res.status(400).json({ message: 'Only image files are allowed' });
        }

        const college = await College.findOne({ userId });
        if (!college) {
            return res.status(404).json({ message: 'College profile not found' });
        }

        // Use BunnyNet service for upload
        const { bunnyNetService } = await import('../services/bunnynet');
        const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
        const fileName = `${college._id}-logo-${Date.now()}.${fileExtension}`;
        
        const uploadResult = await bunnyNetService.uploadFile(file.buffer, fileName, {
            folder: 'college-logos',
            allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            maxSize: 5 * 1024 * 1024, // 5MB
        });

        if (!uploadResult.success) {
            return res.status(500).json({ 
                message: 'Failed to upload logo', 
                error: uploadResult.error 
            });
        }

        // Update college with new logo URL
        const updatedCollege = await College.findOneAndUpdate(
            { userId: userId },
            { $set: { logo: uploadResult.cdnUrl } },
            { new: true }
        );

        if (!updatedCollege) {
            return res.status(404).json({ message: 'College profile not found' });
        }

        res.status(200).json({
            success: true,
            logoUrl: uploadResult.cdnUrl,
            message: 'Logo uploaded successfully'
        });

    } catch (error) {
        console.error('Error uploading logo:', error);
        res.status(500).json({ message: 'Server error uploading logo' });
    }
};

// Upload college banner
export const uploadCollegeBanner = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const userId = user._id || user.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Validate file type - only images allowed
        if (!file.mimetype.startsWith('image/')) {
            return res.status(400).json({ message: 'Only image files are allowed' });
        }

        const college = await College.findOne({ userId });
        if (!college) {
            return res.status(404).json({ message: 'College profile not found' });
        }

        // Use BunnyNet service for upload
        const { bunnyNetService } = await import('../services/bunnynet');
        const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
        const fileName = `${college._id}-banner-${Date.now()}.${fileExtension}`;
        
        const uploadResult = await bunnyNetService.uploadFile(file.buffer, fileName, {
            folder: 'college-banners',
            allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            maxSize: 10 * 1024 * 1024, // 10MB
        });

        if (!uploadResult.success) {
            return res.status(500).json({ 
                message: 'Failed to upload banner', 
                error: uploadResult.error 
            });
        }

        // Update college with new banner URL
        const updatedCollege = await College.findOneAndUpdate(
            { userId: userId },
            { $set: { banner: uploadResult.cdnUrl } },
            { new: true }
        );

        if (!updatedCollege) {
            return res.status(404).json({ message: 'College profile not found' });
        }

        res.status(200).json({
            success: true,
            bannerUrl: uploadResult.cdnUrl,
            message: 'Banner uploaded successfully'
        });

    } catch (error) {
        console.error('Error uploading banner:', error);
        res.status(500).json({ message: 'Server error uploading banner' });
    }
};

// Upload college gallery image
export const uploadCollegeGalleryImage = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const userId = user._id || user.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Validate file type - only images allowed
        if (!file.mimetype.startsWith('image/')) {
            return res.status(400).json({ message: 'Only image files are allowed' });
        }

        const college = await College.findOne({ userId });
        if (!college) {
            return res.status(404).json({ message: 'College profile not found' });
        }

        // Use BunnyNet service for upload
        const { bunnyNetService } = await import('../services/bunnynet');
        const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
        const fileName = `${college._id}-gallery-${Date.now()}.${fileExtension}`;
        
        const uploadResult = await bunnyNetService.uploadFile(file.buffer, fileName, {
            folder: 'college-gallery',
            allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            maxSize: 5 * 1024 * 1024, // 5MB
        });

        if (!uploadResult.success) {
            return res.status(500).json({ 
                message: 'Failed to upload gallery image', 
                error: uploadResult.error 
            });
        }

        // Add image to gallery array
        if (!college.gallery) {
            college.gallery = [];
        }
        if (uploadResult.cdnUrl) {
            college.gallery.push(uploadResult.cdnUrl);
        }
        
        await college.save();

        res.status(200).json({
            success: true,
            imageUrl: uploadResult.cdnUrl,
            message: 'Gallery image uploaded successfully'
        });

    } catch (error) {
        console.error('Error uploading gallery image:', error);
        res.status(500).json({ message: 'Server error uploading gallery image' });
    }
};

// Get college gallery images
export const getCollegeGallery = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const userId = user._id || user.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const college = await College.findOne({ userId }).select('gallery');
        if (!college) {
            return res.status(404).json({ message: 'College profile not found' });
        }

        res.status(200).json({
            success: true,
            gallery: college.gallery || [],
            count: college.gallery?.length || 0
        });

    } catch (error) {
        console.error('Error fetching gallery:', error);
        res.status(500).json({ message: 'Server error fetching gallery' });
    }
};

// Delete college gallery image
export const deleteCollegeGalleryImage = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const userId = user._id || user.userId;
        const { imageUrl } = req.body;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        if (!imageUrl) {
            return res.status(400).json({ message: 'Image URL is required' });
        }

        const college = await College.findOne({ userId });
        if (!college) {
            return res.status(404).json({ message: 'College profile not found' });
        }

        // Remove image from gallery array
        if (college.gallery) {
            college.gallery = college.gallery.filter(url => url !== imageUrl);
            await college.save({ validateBeforeSave: false });
        }

        res.status(200).json({
            success: true,
            message: 'Gallery image deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting gallery image:', error);
        res.status(500).json({ message: 'Server error deleting gallery image' });
    }
};

// Get college facilities
export const getCollegeFacilities = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const userId = user._id || user.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const college = await College.findOne({ userId }).select('facilities selectedFacilities campusDescription');
        
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        // Migrate old facility IDs to new ones
        let selectedFacilities = college.selectedFacilities || [];
        let needsUpdate = false;
        
        const migratedFacilities = selectedFacilities.map((facilityId: string) => {
            if (facilityId === 'sports-complex') {
                needsUpdate = true;
                return 'sports';
            }
            return facilityId;
        });

        // Update database if migration happened
        if (needsUpdate) {
            await College.findOneAndUpdate(
                { userId },
                { $set: { selectedFacilities: migratedFacilities } }
            );
        }

        res.status(200).json({
            facilities: college.facilities || [],
            selectedFacilities: migratedFacilities,
            campusDescription: college.campusDescription || ''
        });

    } catch (error) {
        console.error('Error fetching facilities:', error);
        res.status(500).json({ message: 'Server error fetching facilities' });
    }
};

// Add a new facility
export const addCollegeFacility = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const userId = user._id || user.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const { name, icon, description } = req.body;

        if (!name || !icon) {
            return res.status(400).json({ message: 'Name and icon are required' });
        }

        const college = await College.findOne({ userId });
        
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        const newFacility = {
            name: name.trim(),
            icon: icon.trim(),
            description: description?.trim() || '',
            isActive: true
        };

        if (!college.facilities) {
            college.facilities = [];
        }

        college.facilities.push(newFacility);
        await college.save();

        res.status(201).json({
            success: true,
            facility: college.facilities[college.facilities.length - 1],
            message: 'Facility added successfully'
        });

    } catch (error) {
        console.error('Error adding facility:', error);
        res.status(500).json({ message: 'Server error adding facility' });
    }
};

// Update a facility
export const updateCollegeFacility = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const userId = user._id || user.userId;
        const facilityId = req.params.facilityId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const { name, icon, description } = req.body;

        const college = await College.findOne({ userId });
        
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        const facilityIndex = college.facilities?.findIndex(f => f._id?.toString() === facilityId);
        
        if (facilityIndex === -1 || facilityIndex === undefined) {
            return res.status(404).json({ message: 'Facility not found' });
        }

        const facility = college.facilities?.[facilityIndex];
        
        if (!facility) {
            return res.status(404).json({ message: 'Facility not found' });
        }

        if (name) facility.name = name.trim();
        if (icon) facility.icon = icon.trim();
        if (description !== undefined) facility.description = description.trim();

        college.facilities![facilityIndex] = facility;
        await college.save();

        res.status(200).json({
            success: true,
            facility: facility,
            message: 'Facility updated successfully'
        });

    } catch (error) {
        console.error('Error updating facility:', error);
        res.status(500).json({ message: 'Server error updating facility' });
    }
};

// Delete a facility
export const deleteCollegeFacility = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const userId = user._id || user.userId;
        const facilityId = req.params.facilityId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const college = await College.findOne({ userId });
        
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        const facilityIndex = college.facilities?.findIndex(f => f._id?.toString() === facilityId);
        
        if (facilityIndex === -1 || facilityIndex === undefined) {
            return res.status(404).json({ message: 'Facility not found' });
        }

        college.facilities?.splice(facilityIndex, 1);
        await college.save();

        res.status(200).json({
            success: true,
            message: 'Facility deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting facility:', error);
        res.status(500).json({ message: 'Server error deleting facility' });
    }
};

// Update campus description
export const updateCampusDescription = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const userId = user._id || user.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const { campusDescription } = req.body;

        const college = await College.findOneAndUpdate(
            { userId },
            { $set: { campusDescription: campusDescription?.trim() || '' } },
            { new: true }
        ).select('campusDescription');

        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        res.status(200).json({
            success: true,
            campusDescription: college.campusDescription,
            message: 'Campus description updated successfully'
        });

    } catch (error) {
        console.error('Error updating campus description:', error);
        res.status(500).json({ message: 'Server error updating campus description' });
    }
};

// Update selected facilities list
export const updateCollegeFacilities = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const userId = user._id || user.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const { facilities } = req.body;

        if (!Array.isArray(facilities)) {
            return res.status(400).json({ message: 'Facilities must be an array' });
        }

        // Migrate old facility IDs to new ones before saving
        const migratedFacilities = facilities.map((facilityId: string) => {
            if (facilityId === 'sports-complex') {
                return 'sports';
            }
            return facilityId;
        });

        const college = await College.findOneAndUpdate(
            { userId },
            { $set: { selectedFacilities: migratedFacilities } },
            { new: true }
        ).select('selectedFacilities');

        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        res.status(200).json({
            success: true,
            selectedFacilities: college.selectedFacilities || [],
            message: 'Facilities updated successfully'
        });

    } catch (error) {
        console.error('Error updating selected facilities:', error);
        res.status(500).json({ message: 'Server error updating selected facilities' });
    }
};

// Achievement Management Functions
export const getCollegeAchievements = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const userId = user._id || user.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const college = await College.findOne({ userId }).select('achievements');
        
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        res.status(200).json({
            success: true,
            achievements: college.achievements || []
        });

    } catch (error) {
        console.error('Error fetching achievements:', error);
        res.status(500).json({ message: 'Server error fetching achievements' });
    }
};

export const addCollegeAchievement = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const userId = user._id || user.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const { title, year, description, photo } = req.body;

        if (!title || !year) {
            return res.status(400).json({ message: 'Title and year are required' });
        }

        const college = await College.findOne({ userId });
        
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        const newAchievement = {
            title: title.trim(),
            year: parseInt(year),
            description: description?.trim() || '',
            photo: photo?.trim() || ''
        };

        if (!college.achievements) {
            college.achievements = [];
        }

        college.achievements.push(newAchievement);
        
        // Use updateOne to avoid full document validation
        await College.updateOne(
            { userId },
            { $push: { achievements: newAchievement } }
        );

        res.status(201).json({
            success: true,
            achievement: newAchievement,
            message: 'Achievement added successfully'
        });

    } catch (error) {
        console.error('Error adding achievement:', error);
        res.status(500).json({ message: 'Server error adding achievement' });
    }
};

export const updateCollegeAchievement = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const userId = user._id || user.userId;
        const achievementId = req.params.achievementId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const { title, year, description, photo } = req.body;

        const college = await College.findOne({ userId });
        
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        const achievementIndex = college.achievements?.findIndex(a => a._id?.toString() === achievementId);
        
        if (achievementIndex === -1 || achievementIndex === undefined) {
            return res.status(404).json({ message: 'Achievement not found' });
        }

        const achievement = college.achievements?.[achievementIndex];
        
        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }

        if (title) achievement.title = title.trim();
        if (year) achievement.year = parseInt(year);
        if (description !== undefined) achievement.description = description.trim();
        if (photo !== undefined) achievement.photo = photo.trim();

        // Use updateOne to avoid full document validation
        await College.updateOne(
            { 
                userId,
                'achievements._id': achievementId 
            },
            {
                $set: {
                    'achievements.$.title': achievement.title,
                    'achievements.$.year': achievement.year,
                    'achievements.$.description': achievement.description,
                    'achievements.$.photo': achievement.photo
                }
            }
        );

        res.status(200).json({
            success: true,
            achievement: achievement,
            message: 'Achievement updated successfully'
        });

    } catch (error) {
        console.error('Error updating achievement:', error);
        res.status(500).json({ message: 'Server error updating achievement' });
    }
};

export const deleteCollegeAchievement = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const userId = user._id || user.userId;
        const achievementId = req.params.achievementId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const college = await College.findOne({ userId });
        
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        if (!college.achievements || college.achievements.length === 0) {
            return res.status(404).json({ message: 'No achievements found' });
        }

        const achievementIndex = college.achievements.findIndex(a => a._id?.toString() === achievementId);
        
        if (achievementIndex === -1) {
            return res.status(404).json({ message: 'Achievement not found' });
        }

        college.achievements.splice(achievementIndex, 1);
        await college.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: 'Achievement deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting achievement:', error);
        res.status(500).json({ message: 'Server error deleting achievement' });
    }
};

// Upload achievement photo
export const uploadAchievementPhoto = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const userId = user._id || user.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Check file type
        if (!file.mimetype.startsWith('image/')) {
            return res.status(400).json({ message: 'Only image files are allowed' });
        }

        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            return res.status(400).json({ message: 'File size should not exceed 5MB' });
        }

        const college = await College.findOne({ userId });
        if (!college) {
            return res.status(404).json({ message: 'College profile not found' });
        }

        // Use BunnyNet service for upload
        const { bunnyNetService } = await import('../services/bunnynet');
        const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
        const achievementId = req.body.achievementId || 'temp-' + Date.now();
        const fileName = `${college._id}-achievement-${achievementId}-${Date.now()}.${fileExtension}`;
        
        const uploadResult = await bunnyNetService.uploadFile(file.buffer, fileName, {
            folder: 'achievement-photos',
            allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            maxSize: 5 * 1024 * 1024, // 5MB
        });

        if (!uploadResult.success) {
            return res.status(500).json({ 
                message: 'Failed to upload achievement photo', 
                error: uploadResult.error 
            });
        }

        res.status(200).json({
            success: true,
            url: uploadResult.cdnUrl,
            message: 'Photo uploaded successfully'
        });

    } catch (error) {
        console.error('Error uploading achievement photo:', error);
        res.status(500).json({ message: 'Server error uploading photo' });
    }
};

// Alumni Management Functions
export const getCollegeAlumni = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const userId = user._id || user.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const college = await College.findOne({ userId }).select('alumni');
        
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        res.status(200).json({
            success: true,
            alumni: college.alumni || []
        });

    } catch (error) {
        console.error('Error fetching alumni:', error);
        res.status(500).json({ message: 'Server error fetching alumni' });
    }
};

export const addCollegeAlumni = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const userId = user._id || user.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const { name, email, company, qualification, graduationYear, image, about } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        const college = await College.findOne({ userId });
        
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        const newAlumni = {
            name: name.trim(),
            email: email?.trim() || '',
            company: company?.trim() || '',
            qualification: qualification?.trim() || '',
            graduationYear: graduationYear ? parseInt(graduationYear) : undefined,
            image: image?.trim() || '',
            about: about?.trim() || ''
        };

        if (!college.alumni) {
            college.alumni = [];
        }

        college.alumni.push(newAlumni);
        
        // Use updateOne to avoid full document validation
        await College.updateOne(
            { userId },
            { $push: { alumni: newAlumni } }
        );

        res.status(201).json({
            success: true,
            alumni: newAlumni,
            message: 'Alumni added successfully'
        });

    } catch (error) {
        console.error('Error adding alumni:', error);
        res.status(500).json({ message: 'Server error adding alumni' });
    }
};

export const updateCollegeAlumni = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const userId = user._id || user.userId;
        const alumniId = req.params.alumniId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const { name, email, company, qualification, graduationYear, image, about } = req.body;

        const college = await College.findOne({ userId });
        
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        const alumniIndex = college.alumni?.findIndex(a => a._id?.toString() === alumniId);
        
        if (alumniIndex === -1 || alumniIndex === undefined) {
            return res.status(404).json({ message: 'Alumni not found' });
        }

        const alumni = college.alumni?.[alumniIndex];
        
        if (!alumni) {
            return res.status(404).json({ message: 'Alumni not found' });
        }

        if (name) alumni.name = name.trim();
        if (email !== undefined) alumni.email = email.trim();
        if (company !== undefined) alumni.company = company.trim();
        if (qualification !== undefined) alumni.qualification = qualification.trim();
        if (graduationYear !== undefined) alumni.graduationYear = parseInt(graduationYear);
        if (image !== undefined) alumni.image = image.trim();
        if (about !== undefined) alumni.about = about.trim();

        // Use updateOne to avoid full document validation
        await College.updateOne(
            { 
                userId,
                'alumni._id': alumniId 
            },
            {
                $set: {
                    'alumni.$.name': alumni.name,
                    'alumni.$.email': alumni.email,
                    'alumni.$.company': alumni.company,
                    'alumni.$.qualification': alumni.qualification,
                    'alumni.$.graduationYear': alumni.graduationYear,
                    'alumni.$.image': alumni.image,
                    'alumni.$.about': alumni.about
                }
            }
        );

        res.status(200).json({
            success: true,
            alumni: alumni,
            message: 'Alumni updated successfully'
        });

    } catch (error) {
        console.error('Error updating alumni:', error);
        res.status(500).json({ message: 'Server error updating alumni' });
    }
};

export const deleteCollegeAlumni = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const userId = user._id || user.userId;
        const alumniId = req.params.alumniId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const college = await College.findOne({ userId });
        
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        if (!college.alumni || college.alumni.length === 0) {
            return res.status(404).json({ message: 'No alumni found' });
        }

        const alumniIndex = college.alumni.findIndex(a => a._id?.toString() === alumniId);
        
        if (alumniIndex === -1) {
            return res.status(404).json({ message: 'Alumni not found' });
        }

        college.alumni.splice(alumniIndex, 1);
        await college.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: 'Alumni deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting alumni:', error);
        res.status(500).json({ message: 'Server error deleting alumni' });
    }
};

// Upload alumni image
export const uploadAlumniImage = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const userId = user._id || user.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Check file type
        if (!file.mimetype.startsWith('image/')) {
            return res.status(400).json({ message: 'Only image files are allowed' });
        }

        // Check file size (3MB limit)
        if (file.size > 3 * 1024 * 1024) {
            return res.status(400).json({ message: 'File size should be less than 3MB' });
        }

        const college = await College.findOne({ userId });
        if (!college) {
            return res.status(404).json({ message: 'College profile not found' });
        }

        // Use BunnyNet service for upload
        const { bunnyNetService } = await import('../services/bunnynet');
        const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
        const alumniId = req.body.alumniId || 'temp-' + Date.now();
        const fileName = `${college._id}-alumni-${alumniId}-${Date.now()}.${fileExtension}`;
        
        const uploadResult = await bunnyNetService.uploadFile(file.buffer, fileName, {
            folder: 'alumni-images',
            allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            maxSize: 3 * 1024 * 1024, // 3MB
        });

        if (!uploadResult.success) {
            return res.status(500).json({ 
                message: 'Failed to upload alumni image', 
                error: uploadResult.error 
            });
        }

        res.status(200).json({
            success: true,
            imageUrl: uploadResult.cdnUrl,
            message: 'Alumni image uploaded successfully'
        });

    } catch (error) {
        console.error('Error uploading alumni image:', error);
        res.status(500).json({ message: 'Server error uploading image' });
    }
};

// ============= VIRTUAL TOUR ENDPOINTS =============

export const getCollegeVirtualTours = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const college = await College.findById(id).select('virtualTours');
        
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        res.status(200).json({
            success: true,
            virtualTours: college.virtualTours || []
        });
    } catch (error) {
        console.error('Error fetching virtual tours:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const addCollegeVirtualTour = async (req: Request, res: Response) => {
    try {
        const { userId } = req.user as any;
        const { title, description, videoUrl, videoFile, locationName, thumbnailUrl, duration } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const college = await College.findOne({ userId });
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        const newVirtualTour = {
            title,
            description,
            videoUrl,
            videoFile,
            locationName,
            thumbnailUrl,
            duration
        };

        college.virtualTours = college.virtualTours || [];
        college.virtualTours.push(newVirtualTour);
        // Validate only modified paths to avoid legacy required-field issues
        await college.save({ validateModifiedOnly: true });

        res.status(201).json({
            success: true,
            message: 'Virtual tour added successfully',
            virtualTour: newVirtualTour
        });
    } catch (error) {
        console.error('Error adding virtual tour:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateCollegeVirtualTour = async (req: Request, res: Response) => {
    try {
        const { userId } = req.user as any;
        const { tourId } = req.params;
        const { title, description, videoUrl, videoFile, locationName, thumbnailUrl, duration } = req.body;

        const college = await College.findOne({ userId });
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        const virtualTourIndex = college.virtualTours?.findIndex(tour => tour._id?.toString() === tourId);
        if (virtualTourIndex === -1 || virtualTourIndex === undefined) {
            return res.status(404).json({ message: 'Virtual tour not found' });
        }

        // Update the virtual tour
        if (college.virtualTours && college.virtualTours[virtualTourIndex]) {
            college.virtualTours[virtualTourIndex] = {
                ...college.virtualTours[virtualTourIndex],
                title,
                description,
                videoUrl,
                videoFile,
                locationName,
                thumbnailUrl,
                duration,
                updatedAt: new Date()
            };
        }

        // Validate only modified fields to prevent unrelated validation errors
        await college.save({ validateModifiedOnly: true });

        res.status(200).json({
            success: true,
            message: 'Virtual tour updated successfully',
            virtualTour: college.virtualTours?.[virtualTourIndex]
        });
    } catch (error) {
        console.error('Error updating virtual tour:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteCollegeVirtualTour = async (req: Request, res: Response) => {
    try {
        const { userId } = req.user as any;
        const { tourId } = req.params;

        const college = await College.findOne({ userId });
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        if (!college.virtualTours) {
            return res.status(404).json({ message: 'Virtual tour not found' });
        }

        const initialLength = college.virtualTours.length;
        college.virtualTours = college.virtualTours.filter(tour => tour._id?.toString() !== tourId);

        if (college.virtualTours.length === initialLength) {
            return res.status(404).json({ message: 'Virtual tour not found' });
        }

        // If the deleted tour was the preview video, clear the previewVideoId
        if (college.previewVideoId?.toString() === tourId) {
            college.previewVideoId = undefined;
        }

        // Validate only modified fields to prevent unrelated validation errors
        await college.save({ validateModifiedOnly: true });

        res.status(200).json({
            success: true,
            message: 'Virtual tour deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting virtual tour:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const togglePreviewVideo = async (req: Request, res: Response) => {
    try {
        const { userId } = req.user as any;
        const { tourId } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const college = await College.findOne({ userId });
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        if (!college.virtualTours || college.virtualTours.length === 0) {
            return res.status(404).json({ message: 'Virtual tours not found' });
        }

        // Find the tour
        const tour = college.virtualTours.find(t => t._id?.toString() === tourId);
        if (!tour) {
            return res.status(404).json({ message: 'Virtual tour not found' });
        }

        // Toggle the preview status
        const isCurrentlyPreview = college.previewVideoId?.toString() === tourId;
        
        if (isCurrentlyPreview) {
            // Remove preview
            college.previewVideoId = undefined;
            // Update all tours to set isPreview to false
            college.virtualTours.forEach(t => {
                if (t._id) {
                    t.isPreview = false;
                }
            });
        } else {
            // Set as preview
            college.previewVideoId = tour._id;
            // Update all tours - set only this one as preview
            college.virtualTours.forEach(t => {
                if (t._id) {
                    t.isPreview = t._id.toString() === tourId;
                }
            });
        }

        college.markModified('virtualTours');
        await college.save({ validateModifiedOnly: true });

        res.status(200).json({
            success: true,
            isPreview: !isCurrentlyPreview,
            previewVideoId: !isCurrentlyPreview ? tourId : null,
            message: !isCurrentlyPreview ? 'Video set as banner preview' : 'Preview video removed'
        });
    } catch (error) {
        console.error('Error toggling preview video:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const uploadVirtualTourVideo = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No video file provided' });
        }

        const file = req.file;

        // Validate file type
        if (!file.mimetype.startsWith('video/')) {
            return res.status(400).json({ message: 'Only video files are allowed' });
        }

        // Validate file size (100MB limit)
        if (file.size > 100 * 1024 * 1024) {
            return res.status(400).json({ message: 'Video file too large. Maximum size is 100MB' });
        }

        // Get user ID from token
        const { userId } = req.user as any;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Find college for this user
        const college = await College.findOne({ userId });
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        // Use BunnyNet service for upload
        const { bunnyNetService } = await import('../services/bunnynet');
        
        // Generate unique tour ID for filename
        const tourId = Date.now().toString();
        
        const uploadResult = await bunnyNetService.uploadVirtualTourVideo(
            file.buffer, 
            college._id.toString(), 
            tourId, 
            file.originalname
        );

        if (uploadResult.success) {
            res.status(200).json({
                success: true,
                url: uploadResult.cdnUrl,
                cdnUrl: uploadResult.cdnUrl,
                fileName: uploadResult.fileName,
                message: 'Virtual tour video uploaded successfully to BunnyCDN'
            });
        } else {
            res.status(500).json({ 
                success: false,
                message: uploadResult.error || 'Failed to upload video to BunnyCDN' 
            });
        }

    } catch (error) {
        console.error('Error uploading virtual tour video:', error);
        res.status(500).json({ message: 'Server error uploading video' });
    }
};

// Clean up virtual tours with invalid URLs
export const cleanupVirtualTours = async (req: Request, res: Response) => {
    try {
        const { userId } = req.user as any;
        
        const college = await College.findOne({ userId });
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        if (!college.virtualTours || college.virtualTours.length === 0) {
            return res.status(200).json({ 
                success: true, 
                message: 'No virtual tours to clean up',
                removed: 0
            });
        }

        // Find tours with invalid URLs
        const invalidDomains = ['coundownbreaker', 'example.com', 'test.com', 'localhost'];
        const validTours = college.virtualTours.filter(tour => {
            if (!tour.videoUrl && !tour.videoFile) return false; // Remove tours with no video
            
            if (tour.videoUrl) {
                const hasInvalidDomain = invalidDomains.some(domain => 
                    tour.videoUrl?.includes(domain)
                );
                if (hasInvalidDomain) return false;
            }
            
            return true;
        });

        const removedCount = college.virtualTours.length - validTours.length;
        college.virtualTours = validTours;
        await college.save();

        res.status(200).json({
            success: true,
            message: `Cleaned up ${removedCount} invalid virtual tours`,
            removed: removedCount,
            remaining: validTours.length
        });
    } catch (error) {
        console.error('Error cleaning up virtual tours:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Upload college brochure to BunnyCDN
export const uploadCollegeBrochure = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No brochure file provided' });
        }

        const file = req.file;

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.mimetype)) {
            return res.status(400).json({ message: 'Only PDF, DOC, and DOCX files are allowed' });
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            return res.status(400).json({ message: 'Brochure file too large. Maximum size is 10MB' });
        }

        // Get user ID from token
        const { userId } = req.user as any;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Find college for this user
        const college = await College.findOne({ userId });
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        // Use BunnyNet service for upload
        const { bunnyNetService } = await import('../services/bunnynet');
        
        const uploadResult = await bunnyNetService.uploadFile(file.buffer, file.originalname, {
            folder: 'college-brochures',
            fileName: `${college._id}-brochure-${Date.now()}-${file.originalname}`,
            allowedTypes: ['pdf', 'doc', 'docx'],
            maxSize: 10 * 1024 * 1024
        });

        if (uploadResult.success) {
            res.status(200).json({
                success: true,
                url: uploadResult.cdnUrl,
                cdnUrl: uploadResult.cdnUrl,
                fileName: uploadResult.fileName,
                message: 'College brochure uploaded successfully to BunnyCDN'
            });
        } else {
            res.status(500).json({ 
                success: false,
                message: uploadResult.error || 'Failed to upload brochure to BunnyCDN' 
            });
        }

    } catch (error) {
        console.error('Error uploading college brochure:', error);
        res.status(500).json({ message: 'Server error uploading brochure' });
    }
};

// Delete college brochure from BunnyCDN
export const deleteCollegeBrochure = async (req: Request, res: Response) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ message: 'Brochure URL is required' });
        }

        // Get user ID from token
        const { userId } = req.user as any;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Find college for this user
        const college = await College.findOne({ userId });
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        // Use BunnyNet service for deletion
        const { bunnyNetService } = await import('../services/bunnynet');
        
        // Extract file path from CDN URL
        const cdnUrl = bunnyNetService.getCdnUrl('');
        const filePath = url.replace(cdnUrl, '');
        
        const deleted = await bunnyNetService.deleteFile(filePath);

        if (deleted) {
            res.status(200).json({
                success: true,
                message: 'College brochure deleted successfully from BunnyCDN'
            });
        } else {
            res.status(500).json({ 
                success: false,
                message: 'Failed to delete brochure from BunnyCDN' 
            });
        }

    } catch (error) {
        console.error('Error deleting college brochure:', error);
        res.status(500).json({ message: 'Server error deleting brochure' });
    }
};
