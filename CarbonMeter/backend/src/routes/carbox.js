/**
 * CarBox AI Chat Route
 * 
 * Proxies chat requests to Nugen AI Agent API
 * Handles CarBox_AI assistant interactions
 * Manages chat history for authenticated users
 */

const express = require('express');
const fetch = require('node-fetch');
const ChatMessage = require('../models/ChatMessage');
const router = express.Router();

// Nugen API Configuration
const NUGEN_API_KEY = 'nugen-mRhGbSOhv2xizroIw0Zh9g';
const NUGEN_API_ENDPOINT = 'https://api.nugen.in/api/v3/agents/run-agents/carbox_ai/run/';

// Middleware to extract user from token (optional - for authenticated requests)
const extractUser = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.userId = decoded.userId || decoded.id;
    } catch (error) {
      // Token invalid or expired, continue as guest
      req.userId = null;
    }
  }
  next();
};

/**
 * GET /api/carbox/history
 * 
 * Get chat history for authenticated user
 * 
 * Headers:
 *   - Authorization: Bearer <token>
 * 
 * Response:
 *   - success: Boolean
 *   - messages: Array of chat messages
 */
router.get('/history', extractUser, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const messages = await ChatMessage.find({ userId: req.userId })
      .sort({ timestamp: 1 })
      .limit(100)
      .select('role content timestamp -_id');

    res.json({
      success: true,
      messages: messages
    });

  } catch (error) {
    console.error('❌ [CarBox AI] History error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat history'
    });
  }
});

/**
 * POST /api/carbox/chat
 * 
 * Send user message to CarBox AI and get response
 * Stores messages for authenticated users
 * 
 * Headers:
 *   - Authorization: Bearer <token> (optional)
 * 
 * Body:
 *   - message: User's question/message
 * 
 * Response:
 *   - success: Boolean
 *   - response: AI response text
 */
router.post('/chat', extractUser, async (req, res) => {
  try {
    const { message } = req.body;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    console.log('🤖 [CarBox AI] User query:', message, '| Authenticated:', !!req.userId);

    // Save user message to database if authenticated
    if (req.userId) {
      await ChatMessage.create({
        userId: req.userId,
        role: 'user',
        content: message
      });
    }

    // Call Nugen API
    const nugenResponse = await fetch(NUGEN_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NUGEN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message
      })
    });

    console.log('📡 [CarBox AI] Nugen status:', nugenResponse.status);

    if (!nugenResponse.ok) {
      const errorText = await nugenResponse.text();
      console.error('❌ [CarBox AI] Nugen API error:', errorText);
      throw new Error(`Nugen API returned ${nugenResponse.status}: ${errorText}`);
    }

    const data = await nugenResponse.json();
    console.log('📦 [CarBox AI] Response data:', JSON.stringify(data).substring(0, 200));

    // Extract response from Nugen API format
    let botResponse = 'I apologize, but I could not process your request.';

    // Try different possible response formats
    if (data.output) {
      botResponse = data.output;
    } else if (data.response) {
      botResponse = data.response;
    } else if (data.result) {
      botResponse = data.result;
    } else if (data.data && data.data.output) {
      botResponse = data.data.output;
    } else if (data.message) {
      botResponse = data.message;
    } else if (typeof data === 'string') {
      botResponse = data;
    }

    console.log('✅ [CarBox AI] Bot response:', botResponse.substring(0, 100));

    // Save bot response to database if authenticated
    if (req.userId) {
      await ChatMessage.create({
        userId: req.userId,
        role: 'assistant',
        content: botResponse
      });
    }

    res.json({
      success: true,
      response: botResponse
    });

  } catch (error) {
    console.error('❌ [CarBox AI] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to process your request. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
