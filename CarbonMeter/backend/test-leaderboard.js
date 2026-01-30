const axios = require('axios');

// Backend API URL from environment or default to production for testing
const API_BASE_URL = process.env.API_BASE_URL || 'https://carbon-meter-kixz.onrender.com';

// You need to replace this with your actual token from browser localStorage
const token = process.argv[2];

if (!token) {
  console.log('Usage: node test-leaderboard.js <your-token>');
  console.log('\nTo get your token:');
  console.log('1. Open browser console (F12)');
  console.log('2. Type: localStorage.getItem("token")');
  console.log('3. Copy the token and run: node test-leaderboard.js <token>');
  process.exit(1);
}

async function testLeaderboard() {
  try {
    console.log(`Testing leaderboard API at ${API_BASE_URL}...\n`);
    
    const response = await axios.get(`${API_BASE_URL}/api/activities/leaderboard?period=monthly`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('✅ API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.leaderboard.length > 0) {
      console.log(`\n🏆 Found ${response.data.leaderboard.length} users on leaderboard`);
    } else {
      console.log('\n⚠️  Leaderboard is empty');
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testLeaderboard();
