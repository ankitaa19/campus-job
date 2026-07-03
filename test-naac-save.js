// Test script to verify NAAC/NIRF data saving
const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔑 Testing login...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'liyih99267@cspaus.com',
      password: '@Nkita19'
    });
    
    console.log('✅ Login successful');
    const token = loginResponse.data.token;
    const userId = loginResponse.data.user.id;
    
    console.log('👤 User ID:', userId);
    
    // First, get current college data
    console.log('\n📊 Getting current college data...');
    const collegeResponse = await axios.get(`http://localhost:5001/api/colleges/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Current college ID:', collegeResponse.data.college?._id);
    console.log('Current NAAC Rating:', collegeResponse.data.college?.naacRating);
    console.log('Current NIRF Ranking:', collegeResponse.data.college?.nirfRanking);
    
    // Now test saving NAAC/NIRF data
    console.log('\n💾 Testing NAAC/NIRF save...');
    const testData = {
      naacRating: 'A+',
      nirfRanking: {
        category: 'Overall',
        rank: 154,
        year: 2024
      }
    };
    
    console.log('Data to save:', JSON.stringify(testData, null, 2));
    
    const updateResponse = await axios.put(`http://localhost:5001/api/colleges/user/${userId}`, testData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Update response status:', updateResponse.status);
    console.log('Updated college data:');
    console.log('- NAAC Rating:', updateResponse.data.college?.naacRating);
    console.log('- NIRF Ranking:', updateResponse.data.college?.nirfRanking);
    
    // Verify by fetching again
    console.log('\n🔍 Verifying data persistence...');
    const verifyResponse = await axios.get(`http://localhost:5001/api/colleges/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Verified data:');
    console.log('- NAAC Rating:', verifyResponse.data.college?.naacRating);
    console.log('- NIRF Ranking:', verifyResponse.data.college?.nirfRanking);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testLogin();