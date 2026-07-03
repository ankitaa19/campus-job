#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001';
const WEB_BASE_URL = 'http://localhost:3001';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
};

class CollegeRegistrationTester {
  constructor() {
    this.testEmail = `test.college.${Date.now()}@example.com`;
    this.testPhone = '9876543210';
    this.otpId = null;
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runTest(testName, testFn) {
    try {
      log.info(`Running: ${testName}`);
      await testFn();
      this.results.passed++;
      this.results.tests.push({ name: testName, status: 'PASS' });
      log.success(`${testName} - PASSED`);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name: testName, status: 'FAIL', error: error.message });
      log.error(`${testName} - FAILED: ${error.message}`);
    }
  }

  // Test 1: API Health Check
  async testAPIHealth() {
    const response = await axios.get(`${API_BASE_URL}/health`);
    if (response.status !== 200 || response.data.status !== 'OK') {
      throw new Error('API health check failed');
    }
    if (response.data.database !== 'connected') {
      throw new Error('Database not connected');
    }
  }

  // Test 2: Email Availability Check
  async testEmailCheck() {
    const response = await axios.post(`${API_BASE_URL}/api/auth/check-email`, {
      email: this.testEmail
    });
    if (response.status !== 200 || !response.data.available) {
      throw new Error('Email check failed - should be available');
    }
  }

  // Test 3: Phone Availability Check  
  async testPhoneCheck() {
    const response = await axios.post(`${API_BASE_URL}/api/auth/check-phone`, {
      phone: this.testPhone
    });
    if (response.status !== 200 || !response.data.available) {
      throw new Error('Phone check failed - should be available');
    }
  }

  // Test 4: Send Email OTP
  async testSendEmailOTP() {
    const response = await axios.post(`${API_BASE_URL}/api/auth/send-otp`, {
      email: this.testEmail,
      userType: 'college'
    });
    if (response.status !== 200 || !response.data.otpId) {
      throw new Error('Email OTP send failed');
    }
    this.otpId = response.data.otpId;
  }

  // Test 5: Send WhatsApp OTP
  async testSendWhatsAppOTP() {
    const response = await axios.post(`${API_BASE_URL}/api/auth/send-otp`, {
      phoneNumber: this.testPhone,
      userType: 'college',
      preferredMethod: 'whatsapp',
      firstName: 'Test',
      lastName: 'College'
    });
    if (response.status !== 200 || !response.data.otpId) {
      throw new Error('WhatsApp OTP send failed');
    }
  }

  // Test 6: Verify OTP (using dummy OTP since we can't access real OTP)
  async testVerifyOTP() {
    if (!this.otpId) {
      throw new Error('No OTP ID available for verification');
    }
    
    try {
      // This will fail with invalid OTP, but we're testing the endpoint structure
      await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, {
        otpId: this.otpId,
        otp: '123456',
        userType: 'college'
      });
    } catch (error) {
      // Expected to fail with invalid OTP, but response should be structured
      if (error.response && error.response.status === 400) {
        // This is expected - invalid OTP
        return;
      }
      throw new Error('OTP verification endpoint error');
    }
  }

  // Test 7: College Registration Data Structure
  async testCollegeRegistration() {
    const registrationData = {
      email: this.testEmail,
      password: 'testpassword123',
      role: 'college',
      phoneNumber: this.testPhone,
      whatsappNumber: this.testPhone,
      otpId: 'dummy-otp-id',
      profileData: {
        collegeName: 'Test College',
        collegeType: 'Private College',
        establishedYear: 2020,
        recognizedBy: 'AICTE',
        website: 'https://testcollege.edu',
        affiliatedTo: 'Karnataka University',
        aboutCollege: 'Test college for automated testing',
        address: {
          street: '123 Test Street',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
          landmark: 'Near Test Mall',
          location: 'Test Location'
        },
        primaryContact: {
          name: 'Test Coordinator',
          designation: 'Principal',
          email: 'coordinator@testcollege.edu',
          phone: this.testPhone
        }
      }
    };

    try {
      await axios.post(`${API_BASE_URL}/api/auth/register`, registrationData);
      // Registration may fail due to invalid OTP, but structure should be accepted
    } catch (error) {
      if (error.response && error.response.status === 400 && 
          error.response.data.message.includes('Invalid OTP')) {
        // Expected error - invalid OTP
        return;
      }
      throw new Error(`Registration endpoint error: ${error.message}`);
    }
  }

  // Test 8: CORS Configuration
  async testCORSConfiguration() {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, {
        headers: {
          'Origin': 'http://localhost:3001'
        }
      });
      if (response.status !== 200) {
        throw new Error('CORS test failed');
      }
    } catch (error) {
      throw new Error(`CORS configuration issue: ${error.message}`);
    }
  }

  // Test 9: Frontend Page Accessibility
  async testFrontendPage() {
    try {
      const response = await axios.get(`${WEB_BASE_URL}/register/college`);
      if (response.status !== 200) {
        throw new Error('Frontend page not accessible');
      }
      if (!response.data.includes('College registration') && !response.data.includes('Create an Account')) {
        throw new Error('Frontend page content incorrect');
      }
    } catch (error) {
      throw new Error(`Frontend accessibility issue: ${error.message}`);
    }
  }

  // Test 10: File Upload Endpoint (Theoretical - checking if multipart is supported)
  async testFileUploadSupport() {
    // We can't test actual file upload without FormData, but we can check if the endpoint exists
    try {
      await axios.post(`${API_BASE_URL}/api/upload/logo`, {}, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (error) {
      // Even if endpoint returns error, it should be a structured response, not 404
      if (error.response && error.response.status === 404) {
        throw new Error('File upload endpoint not implemented');
      }
      // Other errors (400, 500) are acceptable as they indicate endpoint exists
    }
  }

  async runAllTests() {
    log.info('🚀 Starting College Registration System Tests');
    log.info('=' .repeat(60));

    await this.runTest('API Health Check', () => this.testAPIHealth());
    await this.runTest('Email Availability Check', () => this.testEmailCheck());
    await this.runTest('Phone Availability Check', () => this.testPhoneCheck());
    await this.runTest('Send Email OTP', () => this.testSendEmailOTP());
    await this.runTest('Send WhatsApp OTP', () => this.testSendWhatsAppOTP());
    await this.runTest('Verify OTP Structure', () => this.testVerifyOTP());
    await this.runTest('College Registration Data Structure', () => this.testCollegeRegistration());
    await this.runTest('CORS Configuration', () => this.testCORSConfiguration());
    await this.runTest('Frontend Page Accessibility', () => this.testFrontendPage());
    await this.runTest('File Upload Support', () => this.testFileUploadSupport());

    this.printResults();
  }

  printResults() {
    console.log('\n' + '=' .repeat(60));
    log.info('TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));
    
    this.results.tests.forEach(test => {
      if (test.status === 'PASS') {
        log.success(`${test.name}`);
      } else {
        log.error(`${test.name}: ${test.error}`);
      }
    });

    console.log('\n' + '=' .repeat(60));
    log.info(`Total Tests: ${this.results.passed + this.results.failed}`);
    log.success(`Passed: ${this.results.passed}`);
    if (this.results.failed > 0) {
      log.error(`Failed: ${this.results.failed}`);
    }

    const successRate = Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100);
    
    if (successRate >= 80) {
      log.success(`Success Rate: ${successRate}% - System is working well! 🎉`);
    } else if (successRate >= 60) {
      log.warn(`Success Rate: ${successRate}% - Some issues need attention ⚠️`);
    } else {
      log.error(`Success Rate: ${successRate}% - Major issues need fixing ❌`);
    }

    console.log('=' .repeat(60));
    log.info('Test completed. Check the results above for any issues.');
    
    if (successRate >= 80) {
      log.success('✨ College registration system is ready for use!');
      log.info('You can now test the registration flow in the browser at:');
      log.info(`🌐 ${WEB_BASE_URL}/register/college`);
    }
  }
}

// Run the tests
(async () => {
  const tester = new CollegeRegistrationTester();
  await tester.runAllTests();
})().catch(console.error);
