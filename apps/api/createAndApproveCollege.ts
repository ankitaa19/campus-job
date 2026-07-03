import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { College } from './src/models/College';
import { User } from './src/models/User';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://CampusPeAdmin:CampusPe@campuspestaging.adsljpw.mongodb.net/campuspe?retryWrites=true&w=majority&appName=CampuspeStaging';

async function createAndApproveCollege() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const testEmail = 'approvedcollege@example.com';
    const testPassword = 'testpassword123';
    
    // Check if user already exists
    let user = await User.findOne({ email: testEmail });
    if (user) {
      console.log('User already exists, deleting old records...');
      await College.deleteOne({ userId: user._id });
      await User.deleteOne({ email: testEmail });
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    user = new User({
      email: testEmail,
      password: hashedPassword,
      phone: '+91-9876543211', // Different from previous one
      role: 'college',
      isEmailVerified: true
    });
    await user.save();
    console.log('✅ User created successfully!');

    // Create college with approved status
    const college = new College({
      userId: user._id,
      name: 'Test Approved College',
      shortName: 'TAC',
      domainCode: 'TAC2024',
      website: 'https://testcollege.edu',
      establishedYear: 2000,
      affiliation: 'Test University',
      recognizedBy: 'AICTE, UGC',
      collegeType: 'Private',
      aboutCollege: 'A premier institution for higher education',
      departments: ['Computer Science', 'Electronics', 'Mechanical'],
      offeredPrograms: ['B.Tech', 'M.Tech', 'MBA'],
      accreditation: ['NAAC A+'],
      
      // Address
      address: {
        street: '123 College Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India'
      },
      
      // Primary Contact
      primaryContact: {
        name: 'Dr. John Doe',
        designation: 'Principal',
        email: testEmail,
        phone: '+91-9876543211'
      },
      
      // Set as approved
      approvalStatus: 'approved',
      isActive: true,
      isVerified: true,
      approvedAt: new Date(),
      allowDirectApplications: true
    });

    await college.save();

    console.log('✅ College created and approved successfully!');
    console.log('College ID:', college._id);
    console.log('College Name:', college.name);
    console.log('Domain Code:', college.domainCode);
    console.log('Email:', testEmail);
    console.log('Status:', college.approvalStatus);
    
    console.log('\n🔑 Login Credentials:');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    console.log('College Login URL: http://localhost:3000/college-login');
    console.log('Dashboard URL: http://localhost:3000/dashboard/college');

  } catch (error) {
    console.error('Error creating and approving college:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createAndApproveCollege();