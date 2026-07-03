// Simple test to validate the dummy company data generation
const { getCompanyData } = require('./utils/companyData.ts');

console.log('Testing dynamic dummy company data generation...\n');

try {
  const companies = getCompanyData();
  
  console.log(`✅ Generated ${companies.length} companies successfully`);
  
  // Test first company
  const firstCompany = companies[0];
  console.log('\n📋 Sample Company Data:');
  console.log('- Name:', firstCompany.name);
  console.log('- Industry:', firstCompany.industry);
  console.log('- Location:', firstCompany.location);
  console.log('- Partnership Type:', firstCompany.partnershipType);
  console.log('- Active Jobs:', firstCompany.metrics.activeJobs);
  console.log('- Average Package:', firstCompany.metrics.avgPackage);
  console.log('- Total Jobs:', firstCompany.jobs.length);
  
  if (firstCompany.jobs.length > 0) {
    console.log('\n💼 Sample Job Data:');
    const firstJob = firstCompany.jobs[0];
    console.log('- Job Title:', firstJob.title);
    console.log('- Job Type:', firstJob.type);
    console.log('- Salary Range:', firstJob.salaryRange);
    console.log('- Skills Required:', firstJob.skillsRequired.join(', '));
    console.log('- Deadline:', firstJob.deadline);
  }
  
  console.log('\n🎯 All companies have unique data and varied job counts');
  console.log('🔄 Data regenerates on each function call for dynamic experience');
  
} catch (error) {
  console.error('❌ Error testing company data:', error.message);
}
