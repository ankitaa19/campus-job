// Admin Configuration File
// This file contains admin credentials and settings

export const ADMIN_CONFIG = {
  // Default Admin Credentials
  email: 'admin@gmail.com',
  password: 'admin123',
  
  // Admin User Details
  name: 'CampusPe Admin',
  role: 'admin',
  
  // Admin Settings
  permissions: {
    canApproveColleges: true,
    canApproveRecruiters: true,
    canSuspendAccounts: true,
    canViewAllData: true,
    canManageUsers: true,
    canViewAnalytics: true,
    canDeactivateAccounts: true,
    canSendMessages: true,
    canSendBroadcasts: true,
  },
  
  // Security Settings
  tokenExpiryHours: 24,
  maxLoginAttempts: 5,
  
  // System Settings
  defaultApprovalStatus: 'pending',
  autoApproval: false,
};

// Environment-based configuration
export const getAdminConfig = () => {
  return {
    ...ADMIN_CONFIG,
    // Override with environment variables if they exist
    email: process.env.ADMIN_EMAIL || ADMIN_CONFIG.email,
    password: process.env.ADMIN_PASSWORD || ADMIN_CONFIG.password,
    name: process.env.ADMIN_NAME || ADMIN_CONFIG.name,
  };
};

// Admin creation helper
export const createDefaultAdmin = () => {
  const config = getAdminConfig();
  
  return {
    email: config.email,
    password: config.password, // This will be hashed when saved
    name: config.name,
    role: config.role,
    permissions: config.permissions,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};
