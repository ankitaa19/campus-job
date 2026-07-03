import mongoose from 'mongoose';
import { Job } from '../models/Job';
import 'dotenv/config';

// Sample jobs for testing job matching
const sampleJobs = [
  {
    title: 'Frontend Developer',
    description: 'Looking for a skilled frontend developer to join our team. You will work on building modern web applications using React and TypeScript.',
    jobType: 'full-time',
    department: 'Engineering',
    companyName: 'TechCorp Solutions',
    recruiterId: new mongoose.Types.ObjectId(),
    locations: [{
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      isRemote: false,
      hybrid: true
    }],
    workMode: 'hybrid',
    requirements: [
      { skill: 'JavaScript', level: 'intermediate', mandatory: true, category: 'technical' },
      { skill: 'React', level: 'intermediate', mandatory: true, category: 'technical' },
      { skill: 'TypeScript', level: 'beginner', mandatory: false, category: 'technical' },
      { skill: 'HTML', level: 'intermediate', mandatory: true, category: 'technical' },
      { skill: 'CSS', level: 'intermediate', mandatory: true, category: 'technical' }
    ],
    requiredSkills: ['JavaScript', 'React', 'TypeScript', 'HTML', 'CSS'],
    experienceLevel: 'entry',
    minExperience: 0,
    maxExperience: 2,
    educationRequirements: [{
      degree: 'Bachelor\'s degree in Computer Science or related field',
      field: 'Computer Science',
      mandatory: false
    }],
    salary: {
      min: 70000,
      max: 90000,
      currency: 'USD',
      negotiable: true
    },
    benefits: ['Health insurance', 'Remote work', 'Learning budget'],
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    totalPositions: 2,
    filledPositions: 0,
    targetColleges: [],
    targetCourses: ['Computer Science', 'Information Technology'],
    allowDirectApplications: true,
    interviewProcess: {
      rounds: ['Technical Screen', 'Coding Challenge', 'System Design', 'Final Interview'],
      duration: '2-3 weeks',
      mode: 'hybrid'
    },
    status: 'active',
    isUrgent: false,
    matchingKeywords: ['frontend', 'react', 'javascript', 'web development'],
    views: 0,
    applications: [],
    postedAt: new Date(),
    lastModified: new Date()
  },
  {
    title: 'Full Stack Developer Intern',
    description: 'Join our startup as a full stack developer intern. Work with cutting-edge technologies and gain hands-on experience.',
    jobType: 'internship',
    department: 'Product',
    companyName: 'StartupXYZ',
    recruiterId: new mongoose.Types.ObjectId(),
    locations: [{
      city: 'Austin',
      state: 'TX',
      country: 'USA',
      isRemote: true,
      hybrid: false
    }],
    workMode: 'remote',
    requirements: [
      { skill: 'JavaScript', level: 'beginner', mandatory: true, category: 'technical' },
      { skill: 'Node.js', level: 'beginner', mandatory: true, category: 'technical' },
      { skill: 'React', level: 'beginner', mandatory: false, category: 'technical' },
      { skill: 'MongoDB', level: 'beginner', mandatory: false, category: 'technical' },
      { skill: 'Express', level: 'beginner', mandatory: false, category: 'technical' }
    ],
    requiredSkills: ['JavaScript', 'Node.js', 'React', 'MongoDB', 'Express'],
    experienceLevel: 'entry',
    minExperience: 0,
    maxExperience: 1,
    educationRequirements: [{
      degree: 'Currently pursuing degree in Computer Science',
      field: 'Computer Science',
      mandatory: true
    }],
    salary: {
      min: 15,
      max: 25,
      currency: 'USD',
      negotiable: false
    },
    benefits: ['Mentorship', 'Flexible hours', 'Remote work'],
    applicationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    totalPositions: 3,
    filledPositions: 0,
    targetColleges: [],
    targetCourses: ['Computer Science', 'Software Engineering'],
    allowDirectApplications: true,
    interviewProcess: {
      rounds: ['Resume Review', 'Technical Interview', 'Behavioral Interview'],
      duration: '1-2 weeks',
      mode: 'online'
    },
    status: 'active',
    isUrgent: true,
    matchingKeywords: ['fullstack', 'intern', 'javascript', 'node.js', 'startup'],
    views: 0,
    applications: [],
    postedAt: new Date(),
    lastModified: new Date()
  },
  {
    title: 'Backend Developer',
    description: 'We are looking for a backend developer to build and maintain our server-side applications.',
    jobType: 'full-time',
    department: 'Engineering',
    companyName: 'DataFlow Inc',
    recruiterId: new mongoose.Types.ObjectId(),
    locations: [{
      city: 'Seattle',
      state: 'WA',
      country: 'USA',
      isRemote: false,
      hybrid: true
    }],
    workMode: 'hybrid',
    requirements: [
      { skill: 'Python', level: 'intermediate', mandatory: true, category: 'technical' },
      { skill: 'Django', level: 'intermediate', mandatory: true, category: 'technical' },
      { skill: 'PostgreSQL', level: 'beginner', mandatory: false, category: 'technical' },
      { skill: 'AWS', level: 'beginner', mandatory: false, category: 'technical' },
      { skill: 'Docker', level: 'beginner', mandatory: false, category: 'technical' }
    ],
    requiredSkills: ['Python', 'Django', 'PostgreSQL', 'AWS', 'Docker'],
    experienceLevel: 'mid',
    minExperience: 2,
    maxExperience: 5,
    educationRequirements: [{
      degree: 'Bachelor\'s degree in Computer Science',
      field: 'Computer Science',
      mandatory: true
    }],
    salary: {
      min: 85000,
      max: 110000,
      currency: 'USD',
      negotiable: true
    },
    benefits: ['Health insurance', '401k matching', 'Stock options'],
    applicationDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    totalPositions: 1,
    filledPositions: 0,
    targetColleges: [],
    targetCourses: ['Computer Science', 'Software Engineering'],
    allowDirectApplications: true,
    interviewProcess: {
      rounds: ['Technical Screen', 'System Design', 'Team Interview', 'Final Round'],
      duration: '3-4 weeks',
      mode: 'hybrid'
    },
    status: 'active',
    isUrgent: false,
    matchingKeywords: ['backend', 'python', 'django', 'server', 'api'],
    views: 0,
    applications: [],
    postedAt: new Date(),
    lastModified: new Date()
  },
  {
    title: 'Software Engineer',
    description: 'Join our engineering team to work on large-scale distributed systems and innovative products.',
    jobType: 'full-time',
    department: 'Engineering',
    companyName: 'BigTech Corp',
    recruiterId: new mongoose.Types.ObjectId(),
    locations: [{
      city: 'Mountain View',
      state: 'CA',
      country: 'USA',
      isRemote: false,
      hybrid: false
    }],
    workMode: 'onsite',
    requirements: [
      { skill: 'Java', level: 'intermediate', mandatory: true, category: 'technical' },
      { skill: 'Python', level: 'intermediate', mandatory: false, category: 'technical' },
      { skill: 'Kubernetes', level: 'beginner', mandatory: false, category: 'technical' },
      { skill: 'Microservices', level: 'intermediate', mandatory: false, category: 'technical' },
      { skill: 'SQL', level: 'intermediate', mandatory: true, category: 'technical' }
    ],
    requiredSkills: ['Java', 'Python', 'Kubernetes', 'Microservices', 'SQL'],
    experienceLevel: 'mid',
    minExperience: 3,
    maxExperience: 7,
    educationRequirements: [{
      degree: 'Master\'s degree preferred',
      field: 'Computer Science',
      mandatory: false
    }],
    salary: {
      min: 120000,
      max: 160000,
      currency: 'USD',
      negotiable: true
    },
    benefits: ['Comprehensive health insurance', 'Stock options', 'Free meals'],
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    totalPositions: 2,
    filledPositions: 0,
    targetColleges: [],
    targetCourses: ['Computer Science', 'Software Engineering', 'Computer Engineering'],
    allowDirectApplications: true,
    interviewProcess: {
      rounds: ['Phone Screen', 'Technical Interview', 'System Design', 'Behavioral Interview', 'Final Review'],
      duration: '4-6 weeks',
      mode: 'offline'
    },
    status: 'active',
    isUrgent: false,
    matchingKeywords: ['software engineer', 'java', 'distributed systems', 'microservices'],
    views: 0,
    applications: [],
    postedAt: new Date(),
    lastModified: new Date()
  },
  {
    title: 'Web Developer',
    description: 'Looking for a creative web developer to build responsive and user-friendly websites.',
    jobType: 'full-time',
    department: 'Design & Development',
    companyName: 'Creative Studios',
    recruiterId: new mongoose.Types.ObjectId(),
    locations: [{
      city: 'New York',
      state: 'NY',
      country: 'USA',
      isRemote: true,
      hybrid: true
    }],
    workMode: 'hybrid',
    requirements: [
      { skill: 'HTML', level: 'intermediate', mandatory: true, category: 'technical' },
      { skill: 'CSS', level: 'intermediate', mandatory: true, category: 'technical' },
      { skill: 'JavaScript', level: 'intermediate', mandatory: true, category: 'technical' },
      { skill: 'React', level: 'beginner', mandatory: false, category: 'technical' },
      { skill: 'WordPress', level: 'beginner', mandatory: false, category: 'technical' }
    ],
    requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React', 'WordPress'],
    experienceLevel: 'entry',
    minExperience: 1,
    maxExperience: 3,
    educationRequirements: [{
      degree: 'Associate degree or equivalent experience',
      field: 'Web Development',
      mandatory: false
    }],
    salary: {
      min: 55000,
      max: 75000,
      currency: 'USD',
      negotiable: true
    },
    benefits: ['Creative freedom', 'Remote work', 'Health insurance'],
    applicationDeadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    totalPositions: 1,
    filledPositions: 0,
    targetColleges: [],
    targetCourses: ['Web Development', 'Computer Science', 'Design'],
    allowDirectApplications: true,
    interviewProcess: {
      rounds: ['Portfolio Review', 'Technical Interview', 'Creative Challenge'],
      duration: '2 weeks',
      mode: 'online'
    },
    status: 'active',
    isUrgent: false,
    matchingKeywords: ['web developer', 'html', 'css', 'javascript', 'frontend'],
    views: 0,
    applications: [],
    postedAt: new Date(),
    lastModified: new Date()
  }
];

async function createSampleJobs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campuspe');
    console.log('Connected to MongoDB');

    // Clear existing sample jobs (optional)
    await Job.deleteMany({ companyName: { $in: ['TechCorp Solutions', 'StartupXYZ', 'DataFlow Inc', 'BigTech Corp', 'Creative Studios'] } });
    console.log('Cleared existing sample jobs');

    // Insert sample jobs
    const createdJobs = await Job.insertMany(sampleJobs);
    console.log(`Created ${createdJobs.length} sample jobs`);

    // Log the created jobs
    createdJobs.forEach((job, index) => {
      const skills = job.requiredSkills || job.requirements?.map((r: any) => r.skill) || [];
      console.log(`${index + 1}. ${job.title} at ${job.companyName} - Skills: ${Array.isArray(skills) ? skills.join(', ') : 'N/A'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error creating sample jobs:', error);
    process.exit(1);
  }
}

// Run the script
createSampleJobs();
