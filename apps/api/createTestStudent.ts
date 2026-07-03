import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://CampusPeAdmin:CampusPe@campuspestaging.adsljpw.mongodb.net/campuspe?retryWrites=true&w=majority&appName=CampuspeStaging';

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, unique: true, sparse: true },
  role: { type: String, required: true, enum: ['student', 'recruiter', 'college', 'admin'] },
  isEmailVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Student Schema  
const studentSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: String, default: 'Computer Science' },
  graduationYear: { type: Number, default: 2025 },
  skills: [{ type: String }],
  locationPreferences: [{ type: String }],
  jobPreferences: {
    jobType: { type: String, default: 'full-time' },
    salaryExpectation: { type: Number, default: 500000 }
  },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Student = mongoose.model('Student', studentSchema);

async function createTestStudent() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    // Test student credentials
    const testEmail = 'demo@student.com';
    const testPassword = 'demo123';

    // Check if user already exists
    const existingUser = await User.findOne({ email: testEmail });
    if (existingUser) {
      console.log(`Test student already exists with email: ${testEmail}`);
      console.log('Login credentials:');
      console.log(`Email: ${testEmail}`);
      console.log(`Password: ${testPassword}`);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    // Create user
    const user = new User({
      email: testEmail,
      password: hashedPassword,
      phone: '+9876543210', // Unique phone number
      role: 'student',
      isEmailVerified: true
    });

    await user.save();
    console.log('Test user created successfully!');

    // Create student profile
    const student = new Student({
      firstName: 'Test',
      lastName: 'Student',
      email: testEmail,
      phone: '+9876543210',
      userId: user._id,
      course: 'Computer Science',
      graduationYear: 2025,
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
      locationPreferences: ['Mumbai', 'Delhi', 'Bangalore'],
      jobPreferences: {
        jobType: 'full-time',
        salaryExpectation: 600000
      }
    });

    await student.save();
    console.log('Test student profile created successfully!');

    console.log('\n=== TEST STUDENT LOGIN CREDENTIALS ===');
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}`);
    console.log('=====================================\n');

    console.log('You can now login to the student dashboard at: http://localhost:3001');
    console.log('Use the credentials above to access the student dashboard.');

  } catch (error) {
    console.error('Error creating test student:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestStudent();