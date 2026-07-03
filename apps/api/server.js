#!/usr/bin/env node
require('dotenv').config();
console.log('🚀 CampusPe API Startup - Node.js Entry Point');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 Port: ${process.env.PORT || '8080'}`);
console.log(`📂 Working Directory: ${process.cwd()}`);
console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

// Check for required files
const fs = require('fs');
const path = require('path');

console.log('\n📋 Verifying deployment files...');
const requiredFiles = [
  'package.json',
  'dist/app.js'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`${file}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
  if (!exists) allFilesExist = false;
}

if (!allFilesExist) {
  console.error('❌ Some required files are missing!');
  process.exit(1);
}

console.log('✅ All required files present');

// Load and print environment variables for debugging
const envVars = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  HOST: process.env.HOST,
  MONGODB_URI: process.env.MONGODB_URI?.replace(/:[^:@]+@/, ':****@')  // Mask password
};
console.log('\n📋 Environment Variables:', envVars);
console.log('\n🔄 Starting API server...');

// Start the actual API server
const app = require('./dist/app.js').default;
const port = process.env.PORT || 5001;
const host = process.env.HOST || 'localhost';

app.listen(port, host, () => {
  console.log(`🌐 Server listening on http://${host}:${port}`);
});
