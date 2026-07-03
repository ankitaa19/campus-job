import { Request, Response } from 'express';
import { Student } from '../models/Student';
import { Types } from 'mongoose';
import CareerAlertService from '../services/career-alerts';
import CentralizedMatchingService from '../services/centralized-matching';
import AIMatchingService from '../services/ai-matching';

// Update student profile and trigger job matching
export const updateStudentProfile = async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
        // Update student profile
        const updatedStudent = await Student.findByIdAndUpdate(
            id,
            {
                $set: {
                    ...updateData,
                    lastModified: new Date()
                }
            },
            { new: true }
        );

        if (!updatedStudent) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // If student profile is now placement-ready, trigger job matching
        if (updateData.isPlacementReady || updatedStudent.isPlacementReady) {
            // Trigger matching in background
            setImmediate(async () => {
                try {
                    await CareerAlertService.processStudentProfileUpdate(new Types.ObjectId(id));
                } catch (error) {
                    console.error(`Background matching failed for student ${id}:`, error);
                }
            });
        }

        res.status(200).json({
            success: true,
            message: 'Student profile updated successfully',
            data: updatedStudent
        });

    } catch (error) {
        console.error('Error updating student profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update student profile',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get job matches for a specific student
export const getStudentJobMatches = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { threshold = 20, limit = 20 } = req.query;

    try {
        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Use centralized matching service for consistent results
        const result = await CentralizedMatchingService.getStudentJobMatches(
            id,
            {
                threshold: Number(threshold) / 100, // Convert percentage to decimal
                limit: Number(limit)
            }
        );

        // Add stable scoring to prevent match percentage changes
        const stableMatches = result.matches.map(match => ({
            ...match,
            matchScore: Math.round(match.matchScore),
            // Add timestamp for caching consistency
            calculatedAt: new Date().toISOString()
        }));

        res.status(200).json({
            success: true,
            data: {
                studentId: id,
                totalMatches: result.matchCount,
                returnedMatches: stableMatches.length,
                threshold: Number(threshold),
                matches: stableMatches
            }
        });

    } catch (error) {
        console.error('Error getting student job matches:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get job matches',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Trigger manual job alerts for a student
export const triggerStudentJobAlerts = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Process student profile update (which finds and sends job matches)
        await CareerAlertService.processStudentProfileUpdate(new Types.ObjectId(id));

        res.status(200).json({
            success: true,
            message: 'Job alerts triggered successfully for student'
        });

    } catch (error) {
        console.error('Error triggering student job alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to trigger job alerts',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Generate student profile analysis using AI
export const analyzeStudentProfile = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const student = await Student.findById(id).lean();
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Create or get existing student embedding
        const studentEmbedding = await AIMatchingService.createStudentEmbedding(
            new Types.ObjectId(id), 
            student
        );

        res.status(200).json({
            success: true,
            data: {
                studentId: id,
                aiAnalysis: studentEmbedding.metadata,
                recommendations: {
                    profileCompleteness: calculateProfileCompleteness(student),
                    suggestedImprovements: getSuggestedImprovements(student, studentEmbedding.metadata),
                    careerPaths: getCareerPathSuggestions(studentEmbedding.metadata)
                }
            }
        });

    } catch (error) {
        console.error('Error analyzing student profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze student profile',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Helper functions
function calculateProfileCompleteness(student: any): number {
    let completeness = 0;
    let totalFields = 0;

    // Basic info
    totalFields += 4;
    if (student.firstName) completeness++;
    if (student.lastName) completeness++;
    if (student.collegeId) completeness++;
    if (student.studentId) completeness++;

    // Skills
    totalFields += 1;
    if (student.skills && student.skills.length > 0) completeness++;

    // Education
    totalFields += 1;
    if (student.education && student.education.length > 0) completeness++;

    // Experience
    totalFields += 1;
    if (student.experience && student.experience.length > 0) completeness++;

    // Job preferences
    totalFields += 1;
    if (student.jobPreferences && student.jobPreferences.jobTypes?.length > 0) completeness++;

    return Math.round((completeness / totalFields) * 100);
}

function getSuggestedImprovements(student: any, aiAnalysis: any): string[] {
    const suggestions = [];

    if (!student.skills || student.skills.length < 5) {
        suggestions.push('Add more skills to your profile (aim for at least 5 relevant skills)');
    }

    if (!student.experience || student.experience.length === 0) {
        suggestions.push('Add your work experience, internships, or project experience');
    }

    if (!student.resumeFile) {
        suggestions.push('Upload your resume for better job matching');
    }

    if (!student.jobPreferences?.preferredLocations?.length) {
        suggestions.push('Specify your preferred work locations');
    }

    if (aiAnalysis.skills.length < 3) {
        suggestions.push('Include more technical skills relevant to your field');
    }

    return suggestions;
}

function getCareerPathSuggestions(aiAnalysis: any): string[] {
    const category = aiAnalysis.category_preference;
    const skills = aiAnalysis.skills;
    
    const careerPaths = [];

    if (category === 'Tech') {
        if (skills.some((skill: string) => ['javascript', 'react', 'node'].includes(skill))) {
            careerPaths.push('Full Stack Developer');
            careerPaths.push('Frontend Developer');
            careerPaths.push('Backend Developer');
        }
        if (skills.some((skill: string) => ['python', 'machine learning', 'data'].includes(skill))) {
            careerPaths.push('Data Scientist');
            careerPaths.push('Machine Learning Engineer');
        }
        if (skills.some((skill: string) => ['java', 'spring', 'microservices'].includes(skill))) {
            careerPaths.push('Java Developer');
            careerPaths.push('Backend Engineer');
        }
    } else if (category === 'Non-Tech') {
        careerPaths.push('Business Analyst');
        careerPaths.push('Project Manager');
        careerPaths.push('Marketing Specialist');
    }

    return careerPaths.slice(0, 5); // Limit to top 5 suggestions
}