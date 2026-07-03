import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './apps/api/src/models/User';
import { Admin } from './apps/api/src/models/Admin';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campuspe';

async function createAdminUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'admin@gmail.com';
    const password = 'admin123';

    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Admin user already exists:', email);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      role: 'admin',
      isVerified: true
    });

    await user.save();
    console.log('Admin user created:', email);

    // Create admin profile
    const adminProfile = new Admin({
      userId: user._id,
      adminProfile: {
        firstName: 'Admin',
        lastName: 'User',
        designation: 'Administrator',
        department: 'Admin'
      },
      permissions: {
        canApproveColleges: true,
        canApproveRecruiters: true,
        canManageUsers: true,
        canViewAnalytics: true,
        canManageJobs: true
      },
      isActive: true
    });

    await adminProfile.save();
    console.log('Admin profile created for user:', email);

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
