// Test file to verify validation functions
const { 
  validateEstablishmentYear, 
  validateWebsite 
} = require('./utils/collegeValidation');

// Test establishment year validation
console.log('=== Testing Establishment Year Validation ===');

// Test current year (should fail)
const currentYear = new Date().getFullYear();
console.log(`Current year (${currentYear}):`, validateEstablishmentYear(currentYear));

// Test future year (should fail)
console.log(`Future year (${currentYear + 1}):`, validateEstablishmentYear(currentYear + 1));

// Test past year (should pass)
console.log(`Past year (${currentYear - 5}):`, validateEstablishmentYear(currentYear - 5));

// Test very old year (should pass)
console.log('Year 1950:', validateEstablishmentYear(1950));

// Test invalid year (should fail)
console.log('Year 1700:', validateEstablishmentYear(1700));

console.log('\n=== Testing Website Validation ===');

// Test valid websites
console.log('Valid website (https://college.edu):', validateWebsite('https://college.edu'));
console.log('Valid website (www.college.edu):', validateWebsite('www.college.edu'));
console.log('Valid website (college.edu):', validateWebsite('college.edu'));

// Test invalid websites
console.log('Invalid website (just text):', validateWebsite('just text'));
console.log('Invalid website (no domain):', validateWebsite('college'));

// Test empty website (should fail since it's now required)
console.log('Empty website:', validateWebsite(''));
console.log('Whitespace website:', validateWebsite('   '));
