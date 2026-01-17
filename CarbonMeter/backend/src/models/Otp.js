const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  otp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['registration', 'password-reset'],
    default: 'registration',
  },
  resendCount: {
    type: Number,
    default: 0,
  },
  maxResendAttempts: {
    type: Number,
    default: 5,
  },
  lastResendTime: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // Auto-delete after 5 minutes (300 seconds)
  },
});

module.exports = mongoose.model('Otp', otpSchema);
