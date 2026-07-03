#!/usr/bin/env node
console.log('🚀 CampusPe Web Startup - Node.js Entry Point');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 Port: ${process.env.PORT || '8080'}`);
console.log(`📂 Working Directory: ${process.cwd()}`);
console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
console.log(`🌍 Platform: ${process.platform}`);
console.log(`📦 Node Version: ${process.version}`);

// Check for required files
const fs = require('fs');
const path = require('path');

console.log('\n📋 Verifying deployment files...');

// Azure App Service specific environment variables
const azureEnvVars = [
  'WEBSITE_SITE_NAME',
  'WEBSITE_RESOURCE_GROUP',
  'WEBSITE_OWNER_NAME'
];

const hasAzureVars = azureEnvVars.some(envVar => process.env[envVar]);
if (hasAzureVars) {
  console.log('🔵 Azure App Service environment detected');
  console.log(`📡 Site: ${process.env.WEBSITE_SITE_NAME || 'Unknown'}`);
  console.log(`📦 Resource Group: ${process.env.WEBSITE_RESOURCE_GROUP || 'Unknown'}`);
}

const requiredFiles = [
  'package.json',
  'server-azure.js',
  '.next/BUILD_ID'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`${file}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
  if (!exists) allFilesExist = false;
}

// Check for node_modules/next specifically
const nextExists = fs.existsSync(path.join(process.cwd(), 'node_modules', 'next'));
console.log(`node_modules/next: ${nextExists ? '✅ EXISTS' : '❌ MISSING'}`);
if (!nextExists) allFilesExist = false;

if (!allFilesExist) {
  console.error('❌ Some required files are missing!');
  console.error('🔧 This might be due to incomplete deployment or build process.');
  console.error('📚 Check Azure App Service logs for more details.');
  process.exit(1);
}

console.log('✅ All required files present');

// Set production environment variables if not already set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
  console.log('🔧 Set NODE_ENV to production');
}

console.log('\n🔄 Starting server-azure.js...');

// Handle uncaught exceptions gracefully in production
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the actual server
try {
  require('./server-azure.js');
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}
