/**
 * Direct Test: Call resend-otp endpoint from command line
 * This helps identify if the problem is frontend or backend
 */

const http = require('http');

// Test data
const email = '24mc3065@rigpt.ac.in'; // Use test email
const purpose = 'password-reset';

// Prepare request
const postData = JSON.stringify({
  email: email,
  purpose: purpose
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/resend-otp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('\n==========================================');
console.log('🧪 Direct Test: Resend OTP Endpoint');
console.log('==========================================\n');

console.log('📤 Request Details:');
console.log('   Method: POST');
console.log('   URL: http://localhost:5000/api/auth/resend-otp');
console.log('   Email:', email);
console.log('   Purpose:', purpose);
console.log('\n⏳ Waiting for response...\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📥 Response Details:');
    console.log('   Status Code:', res.statusCode);
    console.log('   Status Message:', res.statusMessage);
    console.log('   Content-Type:', res.headers['content-type']);
    
    try {
      const jsonData = JSON.parse(data);
      console.log('\n📋 Response Body:');
      console.log(JSON.stringify(jsonData, null, 2));
      
      if (res.statusCode === 200) {
        console.log('\n✅ SUCCESS! Resend OTP endpoint is working!');
        console.log(`   Resend count: ${jsonData.resendCount}/${jsonData.maxResendAttempts}`);
      } else {
        console.log('\n❌ Request failed with error:');
        console.log(`   ${jsonData.message}`);
        console.log(`   Code: ${jsonData.code || 'N/A'}`);
      }
    } catch (e) {
      console.log('\n📋 Raw Response:');
      console.log(data);
    }
    
    console.log('\n==========================================\n');
  });
});

req.on('error', (e) => {
  console.error('❌ Error making request:', e.message);
  console.error('\nPossible issues:');
  console.error('   - Backend is not running on port 5000');
  console.error('   - Network connection issue');
  console.error('   - Invalid email or OTP not found');
  console.log('\n==========================================\n');
});

// Write data to request body
req.write(postData);
req.end();
