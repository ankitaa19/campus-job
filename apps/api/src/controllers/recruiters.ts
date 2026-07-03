import { Request, Response } from 'express';
import { bunnyNetService } from '../services/bunnynet';
import { Recruiter } from '../models/Recruiter';
import { Job } from '../models/Job';
import { Application } from '../models/Application';
import { Types } from 'mongoose';

// Get recruiter profile (authenticated)
export const getRecruiterProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const recruiter = await Recruiter.findOne({ userId })
            .populate('userId', 'email phone whatsappNumber')
            .lean();
        
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter profile not found' });
        }

        // Flatten user data into the response for easier frontend access
        const response = {
            ...recruiter,
            email: (recruiter.userId as any)?.email || recruiter.userId,
            recruiterEmail: (recruiter.userId as any)?.email,
            phone: (recruiter.userId as any)?.phone,
            whatsappNumber: (recruiter.userId as any)?.whatsappNumber || recruiter.whatsappNumber
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error fetching recruiter profile:', error);
        res.status(500).json({ message: 'Server error fetching recruiter profile' });
    }
};

// Get recruiter stats (authenticated)
export const getRecruiterStats = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Find recruiter by user ID
        const recruiter = await Recruiter.findOne({ userId }).lean();
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }

        // Get jobs count
        const totalJobs = await Job.countDocuments({ recruiterId: recruiter._id });
        const activeJobs = await Job.countDocuments({ recruiterId: recruiter._id, status: 'active' });

        // Get applications count for recruiter's jobs
        const totalApplications = await Application.countDocuments({ recruiterId: recruiter._id });
        const pendingApplications = await Application.countDocuments({ 
            recruiterId: recruiter._id, 
            currentStatus: 'applied' 
        });

        // Calculate profile completeness
        const calculateProfileCompleteness = (recruiterData: any) => {
            const fields = [
                recruiterData.companyInfo?.name,
                recruiterData.companyInfo?.industry,
                recruiterData.companyInfo?.description,
                recruiterData.companyInfo?.website,
                recruiterData.companyInfo?.size,
                recruiterData.companyInfo?.headquarters?.city,
                recruiterData.recruiterProfile?.firstName,
                recruiterData.recruiterProfile?.lastName,
                recruiterData.recruiterProfile?.designation,
                recruiterData.hiringInfo?.preferredColleges?.length > 0,
                recruiterData.hiringInfo?.workLocations?.length > 0
            ];
            
            const completedFields = fields.filter(field => 
                field !== undefined && field !== null && field !== ''
            ).length;
            
            return Math.round((completedFields / fields.length) * 100);
        };

        const companyProfileCompleteness = calculateProfileCompleteness(recruiter);

        // Get interview count (when interview model is implemented)
        const scheduledInterviews = 0; // Placeholder
        const selectedCandidates = await Application.countDocuments({ 
            recruiterId: recruiter._id, 
            currentStatus: 'selected' 
        });

        const stats = {
            totalJobs,
            activeJobs,
            totalApplications,
            scheduledInterviews,
            selectedCandidates,
            avgApplicationsPerJob: totalJobs > 0 ? Math.round(totalApplications / totalJobs * 100) / 100 : 0,
            companyProfileCompleteness,
            pendingApplications,
            approvedApplications: await Application.countDocuments({ 
                recruiterId: recruiter._id, 
                currentStatus: 'selected' 
            }),
            rejectedApplications: await Application.countDocuments({ 
                recruiterId: recruiter._id, 
                currentStatus: 'rejected' 
            })
        };

        res.status(200).json(stats);
    } catch (error) {
        console.error('Error fetching recruiter stats:', error);
        res.status(500).json({ message: 'Server error fetching recruiter stats' });
    }
};

export const getAllRecruiters = async (req: Request, res: Response) => {
    try {
        const recruiters = await Recruiter.find({ isVerified: true })
            .select('companyInfo recruiterProfile isVerified createdAt userId approvalStatus')
            .populate('userId', 'email role')
            .sort({ createdAt: -1 });

        // Transform the data to match frontend expectations
        const transformedRecruiters = recruiters.map(recruiter => {
            const populatedUser = recruiter.userId as any;
            
            return {
                _id: recruiter._id,
                userId: recruiter.userId,
                companyInfo: recruiter.companyInfo,
                profile: recruiter.recruiterProfile,  // Map recruiterProfile to profile
                email: populatedUser?.email || 'No email',
                approvalStatus: recruiter.approvalStatus || 'approved',
                isVerified: recruiter.isVerified,
                createdAt: recruiter.createdAt
            };
        });

        res.status(200).json(transformedRecruiters);
    } catch (error) {
        console.error('Error fetching recruiters:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recruiters',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getRecruiterById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid recruiter ID' });
        }

        const recruiter = await Recruiter.findById(id)
            .populate('userId', 'email phone whatsappNumber')
            .populate('hiringInfo.preferredColleges', 'name address')
            .populate('approvedColleges', 'name address')
            .select('-verificationDocuments -submittedDocuments') // Don't expose sensitive documents
            .lean();

        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }

        // Only show approved recruiters to public
        if (recruiter.approvalStatus !== 'approved') {
            return res.status(404).json({ message: 'Recruiter not found' });
        }

        // Get additional statistics
        const totalJobs = await Job.countDocuments({ recruiterId: recruiter._id });
        const activeJobs = await Job.countDocuments({ recruiterId: recruiter._id, status: 'active' });
        const totalApplications = await Application.countDocuments({ recruiterId: recruiter._id });

        // Calculate profile completeness
        const calculateProfileCompleteness = (recruiterData: any) => {
            const fields = [
                recruiterData.companyInfo?.name,
                recruiterData.companyInfo?.industry,
                recruiterData.companyInfo?.description,
                recruiterData.companyInfo?.website,
                recruiterData.companyInfo?.size,
                recruiterData.companyInfo?.headquarters?.city,
                recruiterData.recruiterProfile?.firstName,
                recruiterData.recruiterProfile?.lastName,
                recruiterData.recruiterProfile?.designation,
                recruiterData.hiringInfo?.preferredColleges?.length > 0,
                recruiterData.hiringInfo?.workLocations?.length > 0
            ];
            
            const completedFields = fields.filter(field => 
                field !== undefined && field !== null && field !== ''
            ).length;
            
            return Math.round((completedFields / fields.length) * 100);
        };

        // Enhance recruiter data with computed stats
        const enhancedRecruiter = {
            ...recruiter,
            stats: {
                totalJobs,
                activeJobs,
                totalApplications,
                scheduledInterviews: 0, // Placeholder for future implementation
                selectedCandidates: await Application.countDocuments({ 
                    recruiterId: recruiter._id, 
                    currentStatus: 'selected' 
                }),
                avgApplicationsPerJob: totalJobs > 0 ? Math.round(totalApplications / totalJobs * 100) / 100 : 0,
                companyProfileCompleteness: calculateProfileCompleteness(recruiter),
                pendingApplications: await Application.countDocuments({ 
                    recruiterId: recruiter._id, 
                    currentStatus: 'applied' 
                }),
                approvedApplications: await Application.countDocuments({ 
                    recruiterId: recruiter._id, 
                    currentStatus: 'selected' 
                }),
                rejectedApplications: await Application.countDocuments({ 
                    recruiterId: recruiter._id, 
                    currentStatus: 'rejected' 
                })
            }
        };

        res.status(200).json(enhancedRecruiter);
    } catch (error) {
        console.error('Error fetching recruiter by ID:', error);
        res.status(500).json({ message: 'Server error fetching recruiter' });
    }
};

// Alias for route compatibility
export const getRecruiterByUserId = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        if (!Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId' });
        }
        const recruiter = await Recruiter.findOne({ userId: userId }).lean();
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }
        
        // Include approval status in response
        res.status(200).json({
            ...recruiter,
            canAccessDashboard: recruiter.approvalStatus === 'approved'
        });
    } catch (error) {
        console.error('Error fetching recruiter by userId:', error);
        res.status(500).json({ message: 'Server error fetching recruiter' });
    }
};

export const createRecruiter = async (req: Request, res: Response) => {
    res.status(200).json({ 
        message: 'Recruiter registration should use /api/auth/register endpoint',
        redirect: '/api/auth/register'
    });
};

export const updateRecruiterByUserId = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        if (!Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId' });
        }

        const updateData = req.body;

        // Map flat updateData keys to nested fields in the document
        const mappedUpdateData: any = {};

        if (updateData.firstName !== undefined) mappedUpdateData['recruiterProfile.firstName'] = updateData.firstName;
        if (updateData.lastName !== undefined) mappedUpdateData['recruiterProfile.lastName'] = updateData.lastName;
        if (updateData.designation !== undefined) mappedUpdateData['recruiterProfile.designation'] = updateData.designation;
        if (updateData.department !== undefined) mappedUpdateData['recruiterProfile.department'] = updateData.department;
        if (updateData.linkedinUrl !== undefined) mappedUpdateData['recruiterProfile.linkedinUrl'] = updateData.linkedinUrl;
        if (updateData.preferredContactMethod !== undefined) mappedUpdateData['preferredContactMethod'] = updateData.preferredContactMethod;
        if (updateData.whatsappNumber !== undefined) mappedUpdateData['whatsappNumber'] = updateData.whatsappNumber;
        if (updateData.companyName !== undefined) mappedUpdateData['companyInfo.name'] = updateData.companyName;
        if (updateData.industry !== undefined) mappedUpdateData['companyInfo.industry'] = updateData.industry;
        if (updateData.website !== undefined) mappedUpdateData['companyInfo.website'] = updateData.website;
        if (updateData.description !== undefined) mappedUpdateData['companyInfo.description'] = updateData.description;
        if (updateData.size !== undefined) mappedUpdateData['companyInfo.size'] = updateData.size;
        if (updateData.foundedYear !== undefined) mappedUpdateData['companyInfo.foundedYear'] = updateData.foundedYear;
        if (updateData.headquartersCity !== undefined) mappedUpdateData['companyInfo.headquarters.city'] = updateData.headquartersCity;
        if (updateData.headquartersState !== undefined) mappedUpdateData['companyInfo.headquarters.state'] = updateData.headquartersState;
        if (updateData.headquartersCountry !== undefined) mappedUpdateData['companyInfo.headquarters.country'] = updateData.headquartersCountry;

        const updatedRecruiter = await Recruiter.findOneAndUpdate(
            { userId: userId },
            { $set: mappedUpdateData },
            { new: true }
        ).lean();

        if (!updatedRecruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }

        res.status(200).json({ message: 'Recruiter updated successfully', recruiter: updatedRecruiter });
    } catch (error) {
        console.error('Error updating recruiter:', error);
        res.status(500).json({ message: 'Server error updating recruiter' });
    }
};

export const updateRecruiter = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Recruiter update endpoint coming soon' });
};

export const deleteRecruiter = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Recruiter deletion endpoint coming soon' });
};

export const getRecruitersByIndustry = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Recruiters by industry endpoint coming soon' });
};

export const searchRecruiters = async (req: Request, res: Response) => {
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

        // Search approved and active recruiters across multiple fields
        const recruiters = await Recruiter.find({
            $and: [
                {
                    $or: [
                        { 'companyInfo.name': searchRegex },
                        { 'companyInfo.industry': searchRegex },
                        { 'companyInfo.description': searchRegex },
                        { 'companyInfo.headquarters.city': searchRegex },
                        { 'companyInfo.headquarters.state': searchRegex },
                        { 'recruiterProfile.firstName': searchRegex },
                        { 'recruiterProfile.lastName': searchRegex },
                        { 'recruiterProfile.designation': searchRegex },
                        { 'recruiterProfile.department': searchRegex }
                    ]
                },
                { approvalStatus: 'approved' },
                { isActive: true }
            ]
        })
        .populate('userId', 'email')
        .select({
            'companyInfo.name': 1,
            'companyInfo.industry': 1,
            'companyInfo.logo': 1,
            'companyInfo.description': 1,
            'companyInfo.size': 1,
            'companyInfo.headquarters': 1,
            'recruiterProfile.firstName': 1,
            'recruiterProfile.lastName': 1,
            'recruiterProfile.designation': 1,
            'recruiterProfile.profilePicture': 1,
            'hiringInfo.workLocations': 1,
            'hiringInfo.remoteWork': 1,
            'isVerified': 1,
            'userId': 1
        })
        .limit(limitNum)
        .sort({ 'companyInfo.name': 1 })
        .lean();

        // Format results for frontend
        const formattedResults = recruiters.map(recruiter => ({
            id: recruiter._id,
            userId: recruiter.userId,
            type: 'company',
            name: recruiter.companyInfo.name,
            industry: recruiter.companyInfo.industry,
            logo: recruiter.companyInfo.logo,
            description: recruiter.companyInfo.description,
            size: recruiter.companyInfo.size,
            location: `${recruiter.companyInfo.headquarters.city}, ${recruiter.companyInfo.headquarters.state}`,
            recruiterName: `${recruiter.recruiterProfile.firstName} ${recruiter.recruiterProfile.lastName}`,
            designation: recruiter.recruiterProfile.designation,
            profilePicture: recruiter.recruiterProfile.profilePicture,
            workLocations: recruiter.hiringInfo.workLocations,
            remoteWork: recruiter.hiringInfo.remoteWork,
            isVerified: recruiter.isVerified
        }));

        res.status(200).json({
            success: true,
            data: formattedResults,
            count: formattedResults.length,
            query: searchTerm
        });

    } catch (error) {
        console.error('Error searching recruiters:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while searching recruiters'
        });
    }
};

export const verifyRecruiter = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Verify recruiter endpoint coming soon' });
};

export const requestCollegeApproval = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Request college approval endpoint coming soon' });
};

export const notifyStudents = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Notify students endpoint coming soon' });
};

// Resubmit recruiter application
export const resubmitRecruiter = async (req: Request, res: Response) => {
    try {
        const { notes } = req.body; // Changed from resubmissionNotes to notes
        const userId = req.user?.userId;
        const files = req.files as Express.Multer.File[];

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const recruiter = await Recruiter.findOne({ userId });
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }

        // Handle file uploads to BunnyCDN
        const supportingDocuments: string[] = [];
        if (files && files.length > 0) {
            for (const file of files) {
                try {
                    const uploadResult = await bunnyNetService.uploadFile(
                        file.buffer,
                        `recruiter-resubmission-${recruiter._id}-${Date.now()}-${file.originalname}`,
                        {
                            folder: 'recruiter-resubmissions',
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
        recruiter.approvalStatus = 'pending';
        recruiter.resubmissionNotes = notes;
        recruiter.rejectionReason = undefined; // Clear previous rejection reason
        
        // Add supporting documents if any were uploaded
        if (supportingDocuments.length > 0) {
            // Store in submittedDocuments field as defined in the Recruiter model
            recruiter.submittedDocuments = supportingDocuments;
        }
        
        await recruiter.save();

        res.status(200).json({ 
            message: 'Application resubmitted successfully',
            recruiter: recruiter,
            uploadedDocuments: supportingDocuments.length
        });
    } catch (error) {
        console.error('Error resubmitting recruiter application:', error);
        res.status(500).json({ message: 'Server error resubmitting application' });
    }
};
