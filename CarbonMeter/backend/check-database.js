/**
 * Check which users exist in database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Otp = require('./src/models/Otp');

async function checkDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    console.log('\n==========================================');
    console.log('📊 Database Status Check');
    console.log('==========================================\n');

    // Check users
    const users = await User.find({}, { email: 1, isVerified: 1, createdAt: 1 }).limit(10);
    console.log('👥 Registered Users (First 10):');
    if (users.length === 0) {
      console.log('   (No users found)');
    } else {
      users.forEach((user, idx) => {
        console.log(`   ${idx + 1}. ${user.email} (Verified: ${user.isVerified})`);
      });
    }

    // Check OTPs
    const otps = await Otp.find({}, { email: 1, purpose: 1, resendCount: 1, createdAt: 1 }).limit(10);
    console.log('\n🔐 Pending OTPs (First 10):');
    if (otps.length === 0) {
      console.log('   (No OTPs found)');
    } else {
      otps.forEach((otp, idx) => {
        console.log(`   ${idx + 1}. ${otp.email} (Purpose: ${otp.purpose}, Resends: ${otp.resendCount})`);
      });
    }

    console.log('\n==========================================\n');

    // Disconnect
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
