import mongoose from 'mongoose';
import { College } from './src/models/College';
import { User } from './src/models/User';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://CampusPeAdmin:CampusPe@campuspestaging.adsljpw.mongodb.net/campuspe?retryWrites=true&w=majority&appName=CampuspeStaging';

async function approveTestCollege() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const testEmail = 'testcollege@example.com';
    
    // Find the user first
    const user = await User.findOne({ email: testEmail });
    if (!user) {
      console.log('User not found with email:', testEmail);
      return;
    }

    // Find and approve the college
    const college = await College.findOne({ userId: user._id });
    if (!college) {
      console.log('College not found for user:', testEmail);
      return;
    }

    // Update college status to approved
    college.approvalStatus = 'approved';
    college.isActive = true;
    college.isVerified = true;
    college.approvedAt = new Date();
    await college.save();

    console.log('✅ College approved successfully!');
    console.log('College ID:', college._id);
    console.log('College Name:', college.name);
    console.log('Email:', testEmail);
    console.log('Status:', college.approvalStatus);
    
    console.log('\n🔑 Login Credentials:');
    console.log('Email: testcollege@example.com');
    console.log('Password: testpassword123');
    console.log('Dashboard URL: http://localhost:3000/college-login');

  } catch (error) {
    console.error('Error approving college:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

approveTestCollege();