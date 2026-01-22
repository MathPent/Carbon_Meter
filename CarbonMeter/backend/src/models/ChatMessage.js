const mongoose = require('mongoose');

/**
 * ChatMessage Model
 * 
 * Stores CarBox AI chat messages for authenticated users
 * Guest chats are NOT stored in database
 */

const chatMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying by user and timestamp
chatMessageSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
