import { Request, Response } from 'express';
import { Student } from '../models/Student';
import { Types } from 'mongoose';

export const getAllStudents = async (req: Request, res: Response) => {
    try {
        const students = await Student.find({ isActive: true }).lean();
        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching all students:', error);
        res.status(500).json({ message: 'Server error fetching students' });
    }
};

export const getStudentById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid student ID' });
        }
        
        const student = await Student.findById(id)
            .populate('userId', 'email phone whatsappNumber')
            .populate('collegeId', 'name address establishedYear affiliation departments')
            .lean();
            
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Transform the data to match frontend expectations
        const transformedStudent = {
            ...student,
            profile: {
                skills: Array.isArray(student.skills) ? student.skills.map(skill => 
                    typeof skill === 'string' ? skill : skill.name
                ) : [],
                experience: student.experience || [],
                education: student.education || [],
                projects: student.resumeAnalysis?.extractedDetails?.projects || [],
                achievements: [],
                bio: student.resumeAnalysis?.summary || '',
                linkedinUrl: student.linkedinUrl,
                githubUrl: student.githubUrl,
                portfolioUrl: student.portfolioUrl
            },
            resume: student.resumeFile ? {
                filename: student.resumeFile,
                uploadDate: student.resumeAnalysis?.uploadDate || student.createdAt
            } : undefined
        };

        res.status(200).json(transformedStudent);
    } catch (error) {
        console.error('Error fetching student by ID:', error);
        res.status(500).json({ message: 'Server error fetching student' });
    }
};

// Alias for route compatibility
export const getStudentByUserId = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        if (!Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId' });
        }
        const student = await Student.findOne({ userId: userId })
            .populate('userId', 'email phone whatsappNumber')
            .populate('collegeId', 'name')
            .lean();

        // Log populated student for debugging
        console.log('Populated student with userId:', JSON.stringify(student, null, 2));
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.status(200).json(student);
    } catch (error) {
        console.error('Error fetching student by userId:', error);
        res.status(500).json({ message: 'Server error fetching student' });
    }
};

export const createStudent = async (req: Request, res: Response) => {
    try {
        const { email, password, role, phoneNumber, whatsappNumber, otpId, sessionId, profileData } = req.body;

        // Basic validation
        if (!email || !password || !role || role !== 'student' || !profileData) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if student already exists by userId or email (assuming User creation is separate)
        // Here, we assume user creation is handled elsewhere and userId is available in profileData.userId
        // For now, we proceed to create student document

        // Create new student document
        const newStudent = new Student({
            userId: profileData.userId, // This should be set after user creation in auth flow
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            dateOfBirth: profileData.dateOfBirth,
            gender: profileData.gender,
            phoneNumber: phoneNumber,
            email: email,
            linkedinUrl: profileData.linkedinUrl,
            githubUrl: profileData.githubUrl,
            portfolioUrl: profileData.portfolioUrl,
            collegeId: profileData.collegeId,
            studentId: profileData.studentId,
            enrollmentYear: profileData.enrollmentYear,
            graduationYear: profileData.graduationYear,
            currentSemester: profileData.currentSemester,
            education: profileData.education || [],
            experience: profileData.experience || [],
            skills: profileData.skills || [],
            resumeFile: profileData.resumeFile,
            resumeText: profileData.resumeText,
            resumeScore: profileData.resumeScore,
            jobPreferences: profileData.jobPreferences,
            profileCompleteness: 0,
            isActive: true,
            isPlacementReady: false
        });

        await newStudent.save();
        res.status(201).json({ message: 'Student created successfully', student: newStudent });
    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({ message: 'Server error creating student' });
    }
};

export const updateStudent = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const updateData = req.body;

        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid student ID' });
        }

        const updatedStudent = await Student.findByIdAndUpdate(id, updateData, { new: true }).lean();
        if (!updatedStudent) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.status(200).json({ message: 'Student updated successfully', student: updatedStudent });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ message: 'Server error updating student' });
    }
};

// Alias for route compatibility
export const updateStudentByUserId = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        const updateData = req.body;

        if (!Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId' });
        }

        const updatedStudent = await Student.findOneAndUpdate({ userId: userId }, updateData, { new: true }).lean();
        if (!updatedStudent) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.status(200).json({ message: 'Student updated successfully', student: updatedStudent });
    } catch (error) {
        console.error('Error updating student by userId:', error);
        res.status(500).json({ message: 'Server error updating student' });
    }
};

export const deleteStudent = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid student ID' });
        }

        const deletedStudent = await Student.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
        if (!deletedStudent) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.status(200).json({ message: 'Student deleted (deactivated) successfully', student: deletedStudent });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ message: 'Server error deleting student' });
    }
};

export const getStudentsByCollege = async (req: Request, res: Response) => {
    try {
        const collegeId = req.params.collegeId;

        if (!Types.ObjectId.isValid(collegeId)) {
            return res.status(400).json({ message: 'Invalid college ID' });
        }

        const students = await Student.find({ collegeId: collegeId, isActive: true }).lean();
        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching students by college:', error);
        res.status(500).json({ message: 'Server error fetching students by college' });
    }
};

export const searchStudents = async (req: Request, res: Response) => {
    try {
        const { name, skills, collegeId, isPlacementReady } = req.query;

        const filter: any = { isActive: true };

        if (name) {
            filter.$or = [
                { firstName: { $regex: name, $options: 'i' } },
                { lastName: { $regex: name, $options: 'i' } }
            ];
        }

        if (skills) {
            const skillsArray = Array.isArray(skills) ? skills : [skills];
            filter['skills.name'] = { $in: skillsArray };
        }

        if (collegeId && Types.ObjectId.isValid(collegeId as string)) {
            filter.collegeId = collegeId;
        }

        if (isPlacementReady !== undefined) {
            filter.isPlacementReady = isPlacementReady === 'true';
        }

        const students = await Student.find(filter).lean();
        res.status(200).json(students);
    } catch (error) {
        console.error('Error searching students:', error);
        res.status(500).json({ message: 'Server error searching students' });
    }
};
