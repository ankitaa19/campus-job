import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://CampusPeAdmin:CampusPe@campuspestaging.adsljpw.mongodb.net/campuspe?retryWrites=true&w=majority&appName=CampuspeStaging';

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, required: true, enum: ['student', 'recruiter', 'college', 'admin'] },
  isEmailVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// College Schema  
const collegeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String, default: 'India' }
  },
  website: { type: String },
  description: { type: String },
  establishedYear: { type: Number },
  totalStudents: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const College = mongoose.model('College', collegeSchema);

async function createTestCollege() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    // Test college credentials
    const testEmail = 'college@test.com';
    const testPassword = 'test123';

    // Check if user already exists
    const existingUser = await User.findOne({ email: testEmail });
    if (existingUser) {
      console.log(`Test college already exists with email: ${testEmail}`);
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
      phone: '+91-9876543210',
      role: 'college',
      isEmailVerified: true
    });

    await user.save();
    console.log('Test college user created successfully!');

    // Create college profile
    const college = new College({
      name: 'Test College',
      email: testEmail,
      phone: '+91-9876543210',
      userId: user._id,
      address: {
        street: '123 College Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India'
      },
      website: 'https://testcollege.edu.in',
      description: 'A test college for development and testing purposes',
      establishedYear: 2000,
      totalStudents: 5000,
      isActive: true
    });

    await college.save();
    console.log('Test college profile created successfully!');

    console.log('\n=== TEST COLLEGE LOGIN CREDENTIALS ===');
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}`);
    console.log(`Role: college`);
    console.log('=====================================\n');

    console.log('You can now login to the college dashboard at: http://localhost:3001');
    console.log('Use the credentials above to access the college dashboard.');

  } catch (error) {
    console.error('Error creating test college:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestCollege();