import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import './RegisterPage.css';

/**
 * CARBOMETER 3-STEP REGISTRATION FLOW
 * 
 * Step 1: Collect firstName, lastName, email → Send OTP
 * Step 2: Verify OTP sent to email
 * Step 3: Create password (with confirmation) → Register account
 * 
 * Security: Passwords hashed with bcrypt, OTP expires in 5 minutes
 */

const RegisterPage = ({ onSwitchToLogin }) => {
  const navigate = useNavigate();
  
  // =========================================================================
  // STATE MANAGEMENT FOR 3-STEP REGISTRATION
  // =========================================================================
  
  // Current step: 'details' | 'otp' | 'password'
  const [currentStep, setCurrentStep] = useState('details');
  
  // Step 1: User Details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('Individual');
  
  // Step 2: OTP
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  
  // Step 3: Password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Global states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // OTP timer for resend functionality
  const [otpTimer, setOtpTimer] = useState(300); // 5 minutes

  // =========================================================================
  // STEP 1: SEND OTP TO EMAIL
  // =========================================================================
  
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Validate inputs
      if (!firstName.trim() || !email.trim()) {
        setError('First name and email are required');
        setLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Call backend API to send OTP
      const response = await authAPI.registerSendOtp({
        firstName,
        lastName,
        email,
      });

      console.log('✅ OTP sent successfully:', response.data);
      setSuccessMessage(response.data.message);
      
      // Move to OTP verification step
      setTimeout(() => {
        setCurrentStep('otp');
        setOtpTimer(300);
        startOtpTimer();
      }, 600);

    } catch (err) {
      console.error('Send OTP error:', err);
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // STEP 2: VERIFY OTP
  // =========================================================================
  
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setOtpError('');
    setError('');

    try {
      // Validate OTP
      if (!otp || otp.length !== 6) {
        setOtpError('Please enter a valid 6-digit OTP');
        setLoading(false);
        return;
      }

      // Call backend API to verify OTP
      const response = await authAPI.registerVerifyOtp({
        email,
        otp,
      });

      console.log('✅ OTP verified successfully:', response.data);
      setSuccessMessage('✅ ' + response.data.message);
      
      // Move to password creation step
      setTimeout(() => {
        setCurrentStep('password');
      }, 600);

    } catch (err) {
      console.error('Verify OTP error:', err);
      setOtpError(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // STEP 3: CREATE PASSWORD & REGISTER ACCOUNT
  // =========================================================================
  
  const handleCreatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPasswordError('');
    setError('');

    try {
      // Validate passwords
      if (!password || !confirmPassword) {
        setPasswordError('Both password fields are required');
        setLoading(false);
        return;
      }

      // Validate password length
      if (password.length < 8) {
        setPasswordError('Password must be at least 8 characters long');
        setLoading(false);
        return;
      }

      // Validate passwords match
      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match');
        setLoading(false);
        return;
      }

      // Validate password strength (uppercase, lowercase, numbers)
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
      if (!passwordRegex.test(password)) {
        setPasswordError('Password must contain uppercase, lowercase, and numbers');
        setLoading(false);
        return;
      }

      // Call backend API to create account with password
      const response = await authAPI.registerCreatePassword({
        email,
        password,
        confirmPassword,
        firstName,
        lastName,
        role: selectedRole,
      });

      console.log('✅ Account created successfully:', response.data);

      // Save token and user data to localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      setSuccessMessage('🎉 ' + response.data.message);
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (err) {
      console.error('Create password error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // OTP TIMER & RESEND FUNCTIONALITY
  // =========================================================================
  
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const startOtpTimer = () => {
    setResendCountdown(30); // 30-second countdown for resend button
    const timer = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Countdown timer for resend button (30 seconds)
    const resendTimer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(resendTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOtp = async () => {
    console.log('🔄 [Resend OTP] Button clicked');
    console.log('📧 [Resend OTP] Email state:', email);
    console.log('🎯 [Resend OTP] Purpose: registration');
    
    setIsResending(true);
    setOtpError('');
    setError('');

    try {
      // Validate email before sending
      if (!email || !email.trim()) {
        console.error('❌ [Resend OTP] Email is empty!');
        throw new Error('Email is missing. Please go back and try again.');
      }

      console.log('🚀 [Resend OTP] Sending API request to /auth/resend-otp');
      console.log('📤 [Resend OTP] Request payload:', { email, purpose: 'registration' });
      
      // Use the new resend-otp endpoint
      const response = await authAPI.resendOtp({
        email,
        purpose: 'registration',
      });

      console.log('✅ [Resend OTP] API Response:', response.data);
      console.log('📨 [Resend OTP] Resend count:', response.data.resendCount);
      console.log('📨 [Resend OTP] Max attempts:', response.data.maxResendAttempts);
      
      setSuccessMessage('✅ OTP resent! Check your email');
      setOtp('');
      setResendCountdown(30); // Reset 30-second countdown
      
      console.log('⏳ [Resend OTP] Starting 30-second countdown');
      
      // Restart timer for resend button
      const resendTimer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(resendTimer);
            console.log('✅ [Resend OTP] Countdown finished, button enabled');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      console.error('❌ [Resend OTP] Error occurred:', err.message);
      console.error('🔍 [Resend OTP] Error response:', err.response?.data);
      console.error('📊 [Resend OTP] Error status:', err.response?.status);
      console.error('📋 [Resend OTP] Full error:', err);
      
      const errorMsg = err.response?.data?.message || err.message || 'Failed to resend OTP';
      console.log('⚠️ [Resend OTP] Setting error message:', errorMsg);
      setOtpError(errorMsg);
      setError(errorMsg);
    } finally {
      setIsResending(false);
    }
  };

  // Format timer display (MM:SS)
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // =========================================================================
  // RENDER - STEP 1: USER DETAILS
  // =========================================================================

  if (currentStep === 'details') {
    return (
      <div className="min-h-screen bg-neutral-bg flex flex-col">
        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-2xl font-bold text-dark-green mb-1">
                Register for CarbonMeter
              </h2>
              <p className="text-gray-600 text-sm mb-6 font-semibold">
                📍 Step 1 of 3: Your Details
              </p>

              {/* Error Message */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                  ❌ {error}
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm">
                  ✅ {successMessage}
                </div>
              )}

              <form onSubmit={handleSendOtp}>
                {/* First Name */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-dark-green focus:ring-2 focus:ring-light-green"
                    required
                  />
                </div>

                {/* Last Name */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-dark-green focus:ring-2 focus:ring-light-green"
                  />
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-dark-green focus:ring-2 focus:ring-light-green"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    📧 We'll send a verification code to this email
                  </p>
                </div>

                {/* Role Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Who are you? *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Individual', 'Industry', 'Government'].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className={`py-2 px-3 rounded text-sm font-semibold transition border ${
                          selectedRole === role
                            ? 'bg-dark-green text-off-white border-dark-green'
                            : 'bg-gray-100 text-dark-green border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Send OTP Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-dark-green text-off-white py-2 rounded font-semibold hover:bg-opacity-90 disabled:opacity-50 transition"
                >
                  {loading ? '⏳ Sending OTP...' : '📧 Send OTP to Email'}
                </button>
              </form>

              {/* Login Link */}
              <div className="text-center mt-6 pt-6 border-t border-gray-200">
                <span className="text-gray-600">Already have an account? </span>
                <button
                  onClick={onSwitchToLogin}
                  className="font-semibold text-dark-green hover:underline"
                >
                  LOGIN
                </button>
              </div>
            </div>
          </div>
        </div>
    );
  }

  // =========================================================================
  // RENDER - STEP 2: OTP VERIFICATION
  // =========================================================================

  if (currentStep === 'otp') {
    return (
      <div className="min-h-screen bg-neutral-bg flex flex-col">
        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-2xl font-bold text-dark-green mb-1">
                Verify Your Email
              </h2>
              <p className="text-gray-600 text-sm mb-6 font-semibold">
                📍 Step 2 of 3: Enter OTP Code
              </p>

              {/* Error Message */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                  ❌ {error}
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm">
                  {successMessage}
                </div>
              )}

              {/* Email Display */}
              <div className="bg-light-blue bg-opacity-30 border border-light-blue px-4 py-2 rounded mb-6 text-sm">
                <p className="text-gray-700">
                  We sent a 6-digit code to:<br />
                  <strong className="text-dark-green">{email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp}>
                {/* OTP Input */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Enter OTP Code *
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength="6"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded focus:outline-none focus:border-dark-green text-3xl font-bold text-center tracking-widest"
                    required
                  />
                  {otpError && (
                    <p className="text-red-600 text-sm mt-2">❌ {otpError}</p>
                  )}
                </div>

                {/* Timer & Resend */}
                <div className="mb-6 text-center bg-soft-beige bg-opacity-50 px-4 py-3 rounded">
                  <p className="text-sm text-gray-700 mb-3">
                    ⏱️ OTP expires in: <span className="font-bold text-dark-green text-lg">{formatTimer(otpTimer)}</span>
                  </p>
                  {resendCountdown > 0 ? (
                    <p className="text-sm text-gray-600">
                      🔄 Resend OTP in {resendCountdown}s
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isResending}
                      className="bg-dark-green text-off-white px-4 py-2 rounded font-semibold text-sm hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                    >
                      {isResending ? '⏳ Sending OTP...' : '🔄 Resend OTP'}
                    </button>
                  )}
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-dark-green text-off-white py-2 rounded font-semibold hover:bg-opacity-90 disabled:opacity-50 transition"
                >
                  {loading ? '⏳ Verifying...' : '✅ Verify OTP'}
                </button>
              </form>

              {/* Back Button */}
              <button
                type="button"
                onClick={() => setCurrentStep('details')}
                className="w-full mt-3 text-dark-green hover:underline font-semibold text-sm"
              >
                ← Back to Details
              </button>
            </div>
          </div>
        </div>
    );
  }

  // =========================================================================
  // RENDER - STEP 3: CREATE PASSWORD
  // =========================================================================

  if (currentStep === 'password') {
    return (
      <div className="min-h-screen bg-neutral-bg flex flex-col">
        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-2xl font-bold text-dark-green mb-1">
                Create Your Password
              </h2>
              <p className="text-gray-600 text-sm mb-6 font-semibold">
                📍 Step 3 of 3: Secure Your Account
              </p>

              {/* Error Message */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                  ❌ {error}
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleCreatePassword}>
                {/* Password */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter a strong password"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-dark-green focus:ring-2 focus:ring-light-green"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 text-lg"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ✓ Min 8 characters with uppercase, lowercase & numbers
                  </p>
                </div>

                {/* Confirm Password */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-dark-green focus:ring-2 focus:ring-light-green"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 text-lg"
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                {/* Password Error */}
                {passwordError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                    ❌ {passwordError}
                  </div>
                )}

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
                        <div
                          className={`h-full transition ${
                            password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password)
                              ? 'bg-green-500'
                              : password.length >= 8
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{
                            width: `${Math.min((password.length / 12) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold whitespace-nowrap">
                        {password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password)
                          ? '✅ Strong'
                          : password.length >= 8
                          ? '⚠️ Medium'
                          : '❌ Weak'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Register Button */}
                <button
                  type="submit"
                  disabled={loading || !password || !confirmPassword}
                  className="w-full bg-dark-green text-off-white py-2 rounded font-semibold hover:bg-opacity-90 disabled:opacity-50 transition"
                >
                  {loading ? '⏳ Creating Account...' : '🚀 Complete Registration'}
                </button>
              </form>

              {/* Back Button */}
              <button
                type="button"
                onClick={() => setCurrentStep('otp')}
                className="w-full mt-3 text-dark-green hover:underline font-semibold text-sm"
              >
                ← Back to OTP Verification
              </button>

              {/* Privacy Notice */}
              <p className="text-xs text-gray-500 text-center mt-4">
                🔒 Your password is securely encrypted with bcrypt
              </p>
            </div>
          </div>
        </div>
    );
  }
};

export default RegisterPage;
