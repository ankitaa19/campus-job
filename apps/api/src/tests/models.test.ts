import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  User, Student, College, Recruiter, Job, Application, Course, Message, Notification
} from '../models';

describe('Database Schema Tests', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    // Create in-memory MongoDB instance for testing
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri);
  });

  beforeEach(async () => {
    // Clean up all collections before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    // Clean up after each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  describe('User Model Tests', () => {
    test('should create a valid user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: 'student',
        phone: '+1234567890',
        whatsappNumber: '+1234567890',
        isVerified: true
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe(userData.role);
      expect(savedUser.isVerified).toBe(true);
    });

    test('should not create user with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        role: 'student'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should not create user with invalid role', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'invalid-role'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('Student Model Tests', () => {
    let userId: mongoose.Types.ObjectId;
    let collegeId: mongoose.Types.ObjectId;

    beforeEach(async () => {
      // Create a user first
      const user = new User({
        email: 'student@example.com',
        password: 'password123',
        role: 'student'
      });
      const savedUser = await user.save();
      userId = savedUser._id;

      // Create a college
      const collegeUser = new User({
        email: 'college@example.com',
        password: 'password123',
        role: 'college'
      });
      const savedCollegeUser = await collegeUser.save();

      const college = new College({
        userId: savedCollegeUser._id,
        name: 'Test College',
        domainCode: 'TC2024',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'India'
        },
        primaryContact: {
          name: 'Test Contact',
          designation: 'Principal',
          email: 'principal@testcollege.edu',
          phone: '+1234567890'
        },
        establishedYear: 2000,
        affiliation: 'Test University',
        departments: ['Computer Science', 'Electronics']
      });
      const savedCollege = await college.save();
      collegeId = savedCollege._id;
    });

    test('should create a valid student', async () => {
      const studentData = {
        userId: userId,
        firstName: 'John',
        lastName: 'Doe',
        collegeId: collegeId,
        studentId: 'ST2024001',
        enrollmentYear: 2024,
        education: [{
          degree: 'Bachelor of Technology',
          field: 'Computer Science',
          institution: 'Test College',
          startDate: new Date('2024-01-01'),
          isCompleted: false
        }],
        skills: [{
          name: 'JavaScript',
          level: 'intermediate',
          category: 'technical'
        }],
        jobPreferences: {
          jobTypes: ['full-time'],
          preferredLocations: ['Mumbai', 'Bangalore'],
          workMode: 'hybrid'
        },
        isActive: true,
        isPlacementReady: true
      };

      const student = new Student(studentData);
      const savedStudent = await student.save();

      expect(savedStudent._id).toBeDefined();
      expect(savedStudent.firstName).toBe(studentData.firstName);
      expect(savedStudent.skills[0].name).toBe('JavaScript');
      expect(savedStudent.jobPreferences.workMode).toBe('hybrid');
    });

    test('should validate skill categories', async () => {
      const studentData = {
        userId: userId,
        firstName: 'Jane',
        lastName: 'Smith',
        collegeId: collegeId,
        studentId: 'ST2024002',
        enrollmentYear: 2024,
        skills: [{
          name: 'Python',
          level: 'advanced',
          category: 'invalid-category' // Invalid category
        }],
        jobPreferences: {
          jobTypes: ['internship'],
          preferredLocations: ['Delhi'],
          workMode: 'remote'
        }
      };

      const student = new Student(studentData);
      await expect(student.save()).rejects.toThrow();
    });
  });

  describe('College Model Tests', () => {
    let userId: mongoose.Types.ObjectId;

    beforeEach(async () => {
      const user = new User({
        email: 'college@example.com',
        password: 'password123',
        role: 'college'
      });
      const savedUser = await user.save();
      userId = savedUser._id;
    });

    test('should create a valid college', async () => {
      const collegeData = {
        userId: userId,
        name: 'Test Engineering College',
        shortName: 'TEC',
        domainCode: 'TEC2024',
        address: {
          street: '456 College St',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          country: 'India'
        },
        primaryContact: {
          name: 'Dr. Principal',
          designation: 'Principal',
          email: 'principal@tec.edu',
          phone: '+919876543210'
        },
        establishedYear: 1985,
        affiliation: 'Mumbai University',
        departments: ['Computer Science', 'Mechanical', 'Electronics'],
        isVerified: true,
        isActive: true
      };

      const college = new College(collegeData);
      const savedCollege = await college.save();

      expect(savedCollege._id).toBeDefined();
      expect(savedCollege.name).toBe(collegeData.name);
      expect(savedCollege.domainCode).toBe(collegeData.domainCode);
      expect(savedCollege.address.city).toBe('Mumbai');
      expect(savedCollege.departments).toHaveLength(3);
    });

    test('should enforce unique domainCode', async () => {
      const collegeData1 = {
        userId: userId,
        name: 'College 1',
        domainCode: 'UNIQUE2024',
        address: {
          street: '123 St',
          city: 'City',
          state: 'State',
          zipCode: '12345',
          country: 'India'
        },
        primaryContact: {
          name: 'Contact',
          designation: 'Principal',
          email: 'contact@college1.edu',
          phone: '+1234567890'
        },
        establishedYear: 2000,
        affiliation: 'University',
        departments: ['CS']
      };

      const college1 = new College(collegeData1);
      await college1.save();

      // Create another user for second college
      const user2 = new User({
        email: 'college2@example.com',
        password: 'password123',
        role: 'college'
      });
      const savedUser2 = await user2.save();

      const collegeData2 = {
        ...collegeData1,
        userId: savedUser2._id,
        name: 'College 2',
        primaryContact: {
          ...collegeData1.primaryContact,
          email: 'contact@college2.edu'
        }
      };

      const college2 = new College(collegeData2);
      await expect(college2.save()).rejects.toThrow();
    });
  });

  describe('Job Model Tests', () => {
    let recruiterId: mongoose.Types.ObjectId;
    let collegeId: mongoose.Types.ObjectId;

    beforeEach(async () => {
      // Create recruiter
      const recruiterUser = new User({
        email: 'recruiter@company.com',
        password: 'password123',
        role: 'recruiter'
      });
      const savedRecruiterUser = await recruiterUser.save();

      const recruiter = new Recruiter({
        userId: savedRecruiterUser._id,
        companyInfo: {
          name: 'Tech Corp',
          industry: 'Technology',
          size: 'medium',
          headquarters: {
            city: 'Bangalore',
            state: 'Karnataka',
            country: 'India'
          }
        },
        recruiterProfile: {
          firstName: 'John',
          lastName: 'Recruiter',
          designation: 'HR Manager'
        },
        hiringInfo: {
          preferredColleges: [],
          preferredCourses: ['Computer Science'],
          hiringSeasons: ['summer'],
          averageHires: 10,
          workLocations: ['Bangalore'],
          remoteWork: true,
          internshipOpportunities: true
        },
        isVerified: true
      });
      const savedRecruiter = await recruiter.save();
      recruiterId = savedRecruiter._id;

      // Create college
      const collegeUser = new User({
        email: 'college@example.com',
        password: 'password123',
        role: 'college'
      });
      const savedCollegeUser = await collegeUser.save();

      const college = new College({
        userId: savedCollegeUser._id,
        name: 'Test College',
        domainCode: 'TC2024',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'India'
        },
        primaryContact: {
          name: 'Test Contact',
          designation: 'Principal',
          email: 'principal@testcollege.edu',
          phone: '+1234567890'
        },
        establishedYear: 2000,
        affiliation: 'Test University',
        departments: ['Computer Science']
      });
      const savedCollege = await college.save();
      collegeId = savedCollege._id;
    });

    test('should create a valid job', async () => {
      const jobData = {
        title: 'Software Engineer',
        description: 'Join our team as a Software Engineer',
        jobType: 'full-time',
        department: 'Engineering',
        recruiterId: recruiterId,
        companyName: 'Tech Corp',
        locations: [{
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          isRemote: false,
          hybrid: true
        }],
        workMode: 'hybrid',
        requirements: [{
          skill: 'JavaScript',
          level: 'intermediate',
          mandatory: true,
          category: 'technical'
        }],
        experienceLevel: 'entry',
        minExperience: 0,
        maxExperience: 2,
        educationRequirements: [{
          degree: 'Bachelor of Technology',
          field: 'Computer Science',
          mandatory: true
        }],
        salary: {
          min: 500000,
          max: 800000,
          currency: 'INR',
          negotiable: true
        },
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        totalPositions: 5,
        targetColleges: [collegeId],
        interviewProcess: {
          rounds: ['Technical', 'HR'],
          duration: '2 weeks',
          mode: 'hybrid'
        },
        status: 'active'
      };

      const job = new Job(jobData);
      const savedJob = await job.save();

      expect(savedJob._id).toBeDefined();
      expect(savedJob.title).toBe(jobData.title);
      expect(savedJob.requirements[0].skill).toBe('JavaScript');
      expect(savedJob.salary.min).toBe(500000);
      expect(savedJob.status).toBe('active');
    });

    test('should validate job requirements', async () => {
      const jobData = {
        title: 'Invalid Job',
        description: 'Invalid job description',
        jobType: 'invalid-type', // Invalid job type
        department: 'Engineering',
        recruiterId: recruiterId,
        companyName: 'Tech Corp',
        locations: [{
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          isRemote: false,
          hybrid: true
        }],
        workMode: 'hybrid',
        requirements: [],
        experienceLevel: 'entry',
        minExperience: 0,
        salary: {
          min: 500000,
          max: 800000,
          currency: 'INR',
          negotiable: true
        },
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalPositions: 5,
        interviewProcess: {
          rounds: ['Technical'],
          duration: '2 weeks',
          mode: 'hybrid'
        }
      };

      const job = new Job(jobData);
      await expect(job.save()).rejects.toThrow();
    });
  });

  describe('Application Model Tests', () => {
    let studentId: mongoose.Types.ObjectId;
    let jobId: mongoose.Types.ObjectId;
    let recruiterId: mongoose.Types.ObjectId;

    beforeEach(async () => {
      // Create student
      const studentUser = new User({
        email: 'student@example.com',
        password: 'password123',
        role: 'student'
      });
      const savedStudentUser = await studentUser.save();

      const collegeUser = new User({
        email: 'college@example.com',
        password: 'password123',
        role: 'college'
      });
      const savedCollegeUser = await collegeUser.save();

      const college = new College({
        userId: savedCollegeUser._id,
        name: 'Test College',
        domainCode: 'TC2024',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'India'
        },
        primaryContact: {
          name: 'Test Contact',
          designation: 'Principal',
          email: 'principal@testcollege.edu',
          phone: '+1234567890'
        },
        establishedYear: 2000,
        affiliation: 'Test University',
        departments: ['Computer Science']
      });
      const savedCollege = await college.save();

      const student = new Student({
        userId: savedStudentUser._id,
        firstName: 'John',
        lastName: 'Doe',
        collegeId: savedCollege._id,
        studentId: 'ST2024001',
        enrollmentYear: 2024,
        skills: [{
          name: 'JavaScript',
          level: 'intermediate',
          category: 'technical'
        }],
        jobPreferences: {
          jobTypes: ['full-time'],
          preferredLocations: ['Bangalore'],
          workMode: 'hybrid'
        }
      });
      const savedStudent = await student.save();
      studentId = savedStudent._id;

      // Create recruiter and job
      const recruiterUser = new User({
        email: 'recruiter@company.com',
        password: 'password123',
        role: 'recruiter'
      });
      const savedRecruiterUser = await recruiterUser.save();

      const recruiter = new Recruiter({
        userId: savedRecruiterUser._id,
        companyInfo: {
          name: 'Tech Corp',
          industry: 'Technology',
          size: 'medium',
          headquarters: {
            city: 'Bangalore',
            state: 'Karnataka',
            country: 'India'
          }
        },
        recruiterProfile: {
          firstName: 'John',
          lastName: 'Recruiter',
          designation: 'HR Manager'
        },
        hiringInfo: {
          preferredColleges: [],
          preferredCourses: ['Computer Science'],
          hiringSeasons: ['summer'],
          averageHires: 10,
          workLocations: ['Bangalore'],
          remoteWork: true,
          internshipOpportunities: true
        }
      });
      const savedRecruiter = await recruiter.save();
      recruiterId = savedRecruiter._id;

      const job = new Job({
        title: 'Software Engineer',
        description: 'Join our team',
        jobType: 'full-time',
        department: 'Engineering',
        recruiterId: recruiterId,
        companyName: 'Tech Corp',
        locations: [{
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          isRemote: false,
          hybrid: true
        }],
        workMode: 'hybrid',
        requirements: [{
          skill: 'JavaScript',
          level: 'intermediate',
          mandatory: true,
          category: 'technical'
        }],
        experienceLevel: 'entry',
        minExperience: 0,
        salary: {
          min: 500000,
          max: 800000,
          currency: 'INR',
          negotiable: true
        },
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalPositions: 5,
        interviewProcess: {
          rounds: ['Technical', 'HR'],
          duration: '2 weeks',
          mode: 'hybrid'
        },
        status: 'active'
      });
      const savedJob = await job.save();
      jobId = savedJob._id;
    });

    test('should create a valid application', async () => {
      const applicationData = {
        studentId: studentId,
        jobId: jobId,
        recruiterId: recruiterId,
        coverLetter: 'I am interested in this position',
        currentStatus: 'applied',
        statusHistory: [{
          status: 'applied',
          updatedAt: new Date(),
          updatedBy: studentId
        }],
        collegeApprovalRequired: false,
        matchScore: 85,
        whatsappNotificationSent: false,
        emailNotificationSent: true,
        recruiterViewed: false,
        source: 'platform'
      };

      const application = new Application(applicationData);
      const savedApplication = await application.save();

      expect(savedApplication._id).toBeDefined();
      expect(savedApplication.currentStatus).toBe('applied');
      expect(savedApplication.matchScore).toBe(85);
      expect(savedApplication.statusHistory).toHaveLength(1);
    });

    test('should prevent duplicate applications', async () => {
      const applicationData = {
        studentId: studentId,
        jobId: jobId,
        recruiterId: recruiterId,
        currentStatus: 'applied',
        statusHistory: [{
          status: 'applied',
          updatedAt: new Date(),
          updatedBy: studentId
        }]
      };

      const application1 = new Application(applicationData);
      await application1.save();

      const application2 = new Application(applicationData);
      await expect(application2.save()).rejects.toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete user flow', async () => {
      // 1. Create a college
      const collegeUser = new User({
        email: 'college@example.com',
        password: 'password123',
        role: 'college'
      });
      const savedCollegeUser = await collegeUser.save();

      const college = new College({
        userId: savedCollegeUser._id,
        name: 'Test College',
        domainCode: 'TC2024',
        address: {
          street: '123 Test St',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          country: 'India'
        },
        primaryContact: {
          name: 'Principal',
          designation: 'Principal',
          email: 'principal@testcollege.edu',
          phone: '+919876543210'
        },
        establishedYear: 2000,
        affiliation: 'Mumbai University',
        departments: ['Computer Science']
      });
      const savedCollege = await college.save();

      // 2. Create a course
      const course = new Course({
        name: 'Computer Science Engineering',
        code: 'CSE2024',
        description: 'Bachelor of Technology in Computer Science',
        degree: 'Bachelor',
        stream: 'Engineering',
        specialization: 'Computer Science',
        duration: 4,
        totalSemesters: 8,
        credits: 180,
        collegeId: savedCollege._id,
        subjects: ['Programming', 'Data Structures', 'Algorithms'],
        keySkills: ['Programming', 'Problem Solving', 'Software Development'],
        eligibilityCriteria: {
          minimumMarks: 60,
          requiredSubjects: ['Mathematics', 'Physics', 'Chemistry']
        },
        careerProspects: ['Software Engineer', 'Data Scientist', 'Product Manager']
      });
      const savedCourse = await course.save();

      // 3. Create a student
      const studentUser = new User({
        email: 'student@example.com',
        password: 'password123',
        role: 'student'
      });
      const savedStudentUser = await studentUser.save();

      const student = new Student({
        userId: savedStudentUser._id,
        firstName: 'John',
        lastName: 'Doe',
        collegeId: savedCollege._id,
        studentId: 'ST2024001',
        enrollmentYear: 2024,
        skills: [{
          name: 'JavaScript',
          level: 'intermediate',
          category: 'technical'
        }],
        jobPreferences: {
          jobTypes: ['full-time'],
          preferredLocations: ['Mumbai', 'Bangalore'],
          workMode: 'hybrid'
        },
        isPlacementReady: true
      });
      const savedStudent = await student.save();

      // 4. Create a recruiter
      const recruiterUser = new User({
        email: 'recruiter@company.com',
        password: 'password123',
        role: 'recruiter'
      });
      const savedRecruiterUser = await recruiterUser.save();

      const recruiter = new Recruiter({
        userId: savedRecruiterUser._id,
        companyInfo: {
          name: 'Tech Corp',
          industry: 'Technology',
          size: 'medium',
          headquarters: {
            city: 'Bangalore',
            state: 'Karnataka',
            country: 'India'
          }
        },
        recruiterProfile: {
          firstName: 'Jane',
          lastName: 'Recruiter',
          designation: 'HR Manager'
        },
        hiringInfo: {
          preferredColleges: [savedCollege._id],
          preferredCourses: ['Computer Science'],
          hiringSeasons: ['summer'],
          averageHires: 10,
          workLocations: ['Bangalore'],
          remoteWork: true,
          internshipOpportunities: true
        },
        isVerified: true
      });
      const savedRecruiter = await recruiter.save();

      // 5. Create a job
      const job = new Job({
        title: 'Software Engineer',
        description: 'Join our team as a Software Engineer',
        jobType: 'full-time',
        department: 'Engineering',
        recruiterId: savedRecruiter._id,
        companyName: 'Tech Corp',
        locations: [{
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          isRemote: false,
          hybrid: true
        }],
        workMode: 'hybrid',
        requirements: [{
          skill: 'JavaScript',
          level: 'intermediate',
          mandatory: true,
          category: 'technical'
        }],
        experienceLevel: 'entry',
        minExperience: 0,
        salary: {
          min: 500000,
          max: 800000,
          currency: 'INR',
          negotiable: true
        },
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalPositions: 5,
        targetColleges: [savedCollege._id],
        interviewProcess: {
          rounds: ['Technical', 'HR'],
          duration: '2 weeks',
          mode: 'hybrid'
        },
        status: 'active'
      });
      const savedJob = await job.save();

      // 6. Create an application
      const application = new Application({
        studentId: savedStudent._id,
        jobId: savedJob._id,
        recruiterId: savedRecruiter._id,
        collegeId: savedCollege._id,
        coverLetter: 'I am very interested in this position',
        currentStatus: 'applied',
        statusHistory: [{
          status: 'applied',
          updatedAt: new Date(),
          updatedBy: savedStudent._id
        }],
        matchScore: 90,
        source: 'platform'
      });
      const savedApplication = await application.save();

      // 7. Create a notification
      const notification = new Notification({
        recipientId: savedStudent._id,
        recipientType: 'student',
        title: 'New Job Match!',
        message: 'We found a perfect job match for you',
        notificationType: 'job_match',
        channels: {
          platform: true,
          email: true,
          whatsapp: true,
          push: false
        },
        deliveryStatus: {
          platform: 'sent',
          email: 'sent',
          whatsapp: 'delivered',
          push: 'pending'
        },
        relatedJobId: savedJob._id,
        priority: 'high',
        actionRequired: true,
        actionUrl: `/jobs/${savedJob._id}`,
        actionText: 'View Job'
      });
      const savedNotification = await notification.save();

      // Verify all entities are created and linked properly
      expect(savedCollege._id).toBeDefined();
      expect(savedCourse.collegeId.toString()).toBe(savedCollege._id.toString());
      expect(savedStudent.collegeId.toString()).toBe(savedCollege._id.toString());
      expect(savedRecruiter.hiringInfo.preferredColleges[0].toString()).toBe(savedCollege._id.toString());
      expect(savedJob.targetColleges[0].toString()).toBe(savedCollege._id.toString());
      expect(savedApplication.studentId.toString()).toBe(savedStudent._id.toString());
      expect(savedApplication.jobId.toString()).toBe(savedJob._id.toString());
      expect(savedNotification.relatedJobId?.toString()).toBe(savedJob._id.toString());
    });
  });
});
