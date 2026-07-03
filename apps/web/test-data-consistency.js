#!/usr/bin/env node

console.log('Testing Company Data Generation...\n');

// Mock the module system for Node.js testing
const { getCompanyData, refreshCompanyData } = require('./utils/companyData.ts');

try {
  console.log('🔍 Testing initial data generation...');
  const companies1 = getCompanyData();
  console.log(`✅ Generated ${companies1.length} companies`);
  
  console.log('\n🔍 Testing data consistency...');
  const companies2 = getCompanyData();
  console.log(`✅ Second call returned ${companies2.length} companies`);
  console.log(`✅ Same data: ${companies1[0].name === companies2[0].name ? 'Yes' : 'No'}`);
  
  console.log('\n🔍 Testing data refresh...');
  const companies3 = refreshCompanyData();
  console.log(`✅ After refresh: ${companies3.length} companies`);
  console.log(`✅ Different data: ${companies1[0].name !== companies3[0].name ? 'Yes' : 'No'}`);
  
  console.log('\n📋 Sample Companies:');
  companies1.slice(0, 3).forEach((company, index) => {
    console.log(`${index + 1}. ${company.name} (${company.industry}) - ${company.jobs.length} jobs`);
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
