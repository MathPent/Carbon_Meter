/**
 * Create Admin User Script
 * 
 * Run this once to create the initial admin account
 * Usage: node create-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./src/models/Admin');

const DB_URI = process.env.MONGODB_URI || 'mongodb+srv://ayushd2702:ay4kHiKSw1TlmzJj@carbonmeter.8upv5.mongodb.net/carbonMeter?retryWrites=true&w=majority';

// Default admin credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'CarbonAdmin@2026';

async function createAdmin() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(DB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: ADMIN_USERNAME });
    
    if (existingAdmin) {
      console.log('⚠️  Admin already exists with username:', ADMIN_USERNAME);
      console.log('🔄 Updating password...');
      
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      existingAdmin.password = hashedPassword;
      existingAdmin.loginAttempts = 0;
      existingAdmin.lockUntil = null;
      await existingAdmin.save();
      
      console.log('✅ Admin password updated successfully!');
    } else {
      console.log('👤 Creating new admin user...');
      
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      
      const admin = new Admin({
        username: ADMIN_USERNAME,
        password: hashedPassword,
        role: 'admin'
      });

      await admin.save();
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n📋 Admin Credentials:');
    console.log('───────────────────────────────');
    console.log('Username:', ADMIN_USERNAME);
    console.log('Password:', ADMIN_PASSWORD);
    console.log('───────────────────────────────');
    console.log('\n🔐 Please change the password after first login!');
    console.log('🌐 Login at: http://localhost:3000/admin/login\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
