import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './CarBoxAIWidget.css';
import API_BASE_URL from '../../config/api.config';

/**
 * CarBox_AI - Global AI Chatbot Widget
 * 
 * Floating AI assistant available on all pages
 * Provides carbon footprint and sustainability guidance
 * 
 * Features:
 * - Guest chats: temporary, cleared on login
 * - Authenticated chats: persisted in database
 * - Chat history restored on login
 */

const CarBoxAIWidget = () => {
  const { token, isAuthenticated } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hello! I\'m CarBox AI, your carbon intelligence assistant. Ask me anything about carbon emissions, sustainability, or how to use CarbonMeter!',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatLoaded, setChatLoaded] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const previousAuthState = useRef(isAuthenticated);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Load chat history for authenticated users
  const loadChatHistory = async () => {
    if (!isAuthenticated || !token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/carbox/history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.messages && data.messages.length > 0) {
          // Add welcome message + loaded history
          setMessages([
            {
              role: 'assistant',
              content: '👋 Welcome back! Here\'s your previous conversation history.',
              timestamp: new Date()
            },
            ...data.messages
          ]);
          console.log('✅ [CarBox AI] Loaded', data.messages.length, 'previous messages');
        } else {
          // No history, start fresh with welcome message
          resetToWelcomeMessage();
        }
      } else {
        resetToWelcomeMessage();
      }
    } catch (error) {
      console.error('❌ [CarBox AI] Failed to load history:', error);
      resetToWelcomeMessage();
    }
  };

  // Reset to welcome message only
  const resetToWelcomeMessage = () => {
    setMessages([
      {
        role: 'assistant',
        content: '👋 Hello! I\'m CarBox AI, your carbon intelligence assistant. Ask me anything about carbon emissions, sustainability, or how to use CarbonMeter!',
        timestamp: new Date()
      }
    ]);
  };

  // Handle authentication state changes
  useEffect(() => {
    const authStateChanged = previousAuthState.current !== isAuthenticated;
    
    if (authStateChanged) {
      console.log('🔄 [CarBox AI] Auth state changed. Authenticated:', isAuthenticated);
      
      if (isAuthenticated && !chatLoaded) {
        // User just logged in - clear guest chats and load user history
        console.log('🔐 [CarBox AI] User logged in - loading chat history');
        loadChatHistory();
        setChatLoaded(true);
      } else if (!isAuthenticated && chatLoaded) {
        // User just logged out - clear chat UI
        console.log('🚪 [CarBox AI] User logged out - clearing chat');
        resetToWelcomeMessage();
        setChatLoaded(false);
      }
      
      previousAuthState.current = isAuthenticated;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token, chatLoaded]);

  // Load history on initial mount if already authenticated
  useEffect(() => {
    if (isAuthenticated && !chatLoaded) {
      loadChatHistory();
      setChatLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message to chat
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
      };

      // Add auth token if user is logged in
      if (isAuthenticated && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Call backend API
      const response = await fetch(`${API_BASE_URL}/api/carbox/chat`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ message: userMessage })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Add bot response
        const botMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('CarBox AI Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again later.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const minimizeChat = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          className="carbox-ai-button"
          onClick={toggleChat}
          aria-label="Open CarBox AI Assistant"
        >
          <div className="carbox-ai-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="ai-icon"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" />
            </svg>
          </div>
          <span className="carbox-ai-pulse"></span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="carbox-ai-window">
          {/* Header */}
          <div className="carbox-ai-header">
            <div className="header-content">
              <div className="header-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                </svg>
              </div>
              <div className="header-text">
                <h3>CarBox AI</h3>
                <p>Carbon Intelligence Assistant</p>
              </div>
            </div>
            <div className="header-actions">
              <button
                className="header-btn minimize-btn"
                onClick={minimizeChat}
                aria-label="Minimize chat"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <button
                className="header-btn close-btn"
                onClick={toggleChat}
                aria-label="Close chat"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="carbox-ai-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message-wrapper ${msg.role === 'user' ? 'user-message' : 'bot-message'}`}
              >
                <div className="message-bubble">
                  {msg.role === 'assistant' && (
                    <div className="message-avatar">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                      </svg>
                    </div>
                  )}
                  <div className="message-content">
                    <p>{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="message-wrapper bot-message">
                <div className="message-bubble">
                  <div className="message-avatar">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                    </svg>
                  </div>
                  <div className="message-content typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="carbox-ai-input-area">
            <div className="input-container">
              <input
                ref={inputRef}
                type="text"
                className="message-input"
                placeholder="Ask about carbon emissions, tips, or features..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <button
                className="send-button"
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                aria-label="Send message"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CarBoxAIWidget;
