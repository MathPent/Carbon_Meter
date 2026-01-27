const axios = require('axios');

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
    console.log('Testing leaderboard API...\n');
    
    const response = await axios.get('http://localhost:5000/api/activities/leaderboard?period=monthly', {
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
