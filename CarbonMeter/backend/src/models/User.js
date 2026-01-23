const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['Individual', 'Industry', 'Government'],
    required: true,
  },
  organizationType: {
    type: String, // For Government users: 'Government Transport', 'Buildings & Offices', etc.
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  phone: {
    type: String,
  },
  country: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving ONLY if password is new/modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    // ⚠️ CRITICAL FIX: Check if password is already hashed
    // Hashed passwords start with $2a$, $2b$, or $2y$ (bcrypt format)
    // If it's already hashed, DON'T hash again
    if (this.password.startsWith('$2')) {
      console.log('✅ Password already hashed, skipping bcrypt');
      return next();
    }
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('🔐 Password hashed with bcrypt');
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (inputPassword) {
  return await bcrypt.compare(inputPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
