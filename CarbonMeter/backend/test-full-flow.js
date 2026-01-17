/**
 * Complete Test: Send OTP then Resend OTP
 * This tests the full resend-otp flow
 */

const http = require('http');

const testEmail = `24mc3043@rgipt.ac.in`;  // Real registered user email
console.log('\n==========================================');
console.log('🧪 Complete Resend OTP Test Flow');
console.log('==========================================\n');

// Step 1: Send OTP
function sendOtp() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      email: testEmail
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/forgot-password',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('📤 STEP 1: Sending initial OTP');
    console.log(`   Email: ${testEmail}`);
    console.log('   Endpoint: POST /api/auth/forgot-password\n');

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('✅ Initial OTP sent successfully!');
            console.log(`   Message: ${jsonData.message}\n`);
            resolve(true);
          } else {
            console.log('❌ Failed to send initial OTP');
            console.log(`   Error: ${jsonData.message}\n`);
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Error parsing response\n');
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Request error:', e.message);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

// Step 2: Resend OTP
function resendOtp() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      email: testEmail,
      purpose: 'password-reset'
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

    console.log('📤 STEP 2: Resending OTP');
    console.log(`   Email: ${testEmail}`);
    console.log('   Purpose: password-reset');
    console.log('   Endpoint: POST /api/auth/resend-otp\n');

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('✅ OTP resent successfully!');
            console.log(`   Message: ${jsonData.message}`);
            console.log(`   Resend count: ${jsonData.resendCount}/${jsonData.maxResendAttempts}\n`);
            resolve(true);
          } else {
            console.log('❌ Failed to resend OTP');
            console.log(`   Error: ${jsonData.message}`);
            console.log(`   Code: ${jsonData.code || 'N/A'}\n`);
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Error parsing response\n');
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Request error:', e.message);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

// Run the test
async function runTest() {
  const step1 = await sendOtp();
  
  // Wait 1 second between requests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (step1) {
    const step2 = await resendOtp();
    
    if (step2) {
      console.log('==========================================');
      console.log('✨ All tests passed! Resend OTP works!');
      console.log('==========================================\n');
    } else {
      console.log('==========================================');
      console.log('❌ Resend OTP test failed');
      console.log('==========================================\n');
    }
  } else {
    console.log('==========================================');
    console.log('❌ Initial OTP test failed');
    console.log('==========================================\n');
  }
}

runTest();
