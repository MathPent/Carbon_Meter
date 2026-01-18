import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import './ForgotPasswordPage.css';

/**
 * CARBOMETER FORGOT PASSWORD FLOW
 * 
 * Step 1: Request password reset by entering email → OTP sent
 * Step 2: Verify OTP sent to email
 * Step 3: Create new password → Account password updated
 * 
 * Security: OTP expires in 5 minutes, passwords hashed with bcrypt
 */

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  
  // =========================================================================
  // STATE MANAGEMENT FOR 3-STEP FORGOT PASSWORD
  // =========================================================================
  
  // Current step: 'email' | 'otp' | 'password'
  const [currentStep, setCurrentStep] = useState('email');
  
  // Step 1: Email
  const [email, setEmail] = useState('');
  
  // Step 2: OTP
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  
  // Step 3: New Password
  const [newPassword, setNewPassword] = useState('');
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
  // STEP 1: REQUEST PASSWORD RESET OTP
  // =========================================================================
  
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Validate email
      if (!email.trim()) {
        setError('Email is required');
        setLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Call backend API to send reset OTP
      const response = await authAPI.forgotPassword({
        email,
      });

      console.log('✅ Password reset OTP sent:', response.data);
      setSuccessMessage(response.data.message);
      
      // Move to OTP verification step
      setTimeout(() => {
        setCurrentStep('otp');
        setOtpTimer(300);
        startOtpTimer();
      }, 600);

    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.response?.data?.message || 'Failed to send reset OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // STEP 2: VERIFY RESET OTP
  // =========================================================================
  
  const handleVerifyResetOtp = async (e) => {
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

      // Call backend API to verify reset OTP
      const response = await authAPI.verifyResetOtp({
        email,
        otp,
      });

      console.log('✅ Reset OTP verified:', response.data);
      setSuccessMessage('✅ ' + response.data.message);
      
      // Move to password reset step
      setTimeout(() => {
        setCurrentStep('password');
      }, 600);

    } catch (err) {
      console.error('Verify reset OTP error:', err);
      setOtpError(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // STEP 3: RESET PASSWORD
  // =========================================================================
  
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPasswordError('');
    setError('');

    try {
      // Validate passwords
      if (!newPassword || !confirmPassword) {
        setPasswordError('Both password fields are required');
        setLoading(false);
        return;
      }

      // Validate password length
      if (newPassword.length < 8) {
        setPasswordError('Password must be at least 8 characters long');
        setLoading(false);
        return;
      }

      // Validate passwords match
      if (newPassword !== confirmPassword) {
        setPasswordError('Passwords do not match');
        setLoading(false);
        return;
      }

      // Validate password strength
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
      if (!passwordRegex.test(newPassword)) {
        setPasswordError('Password must contain uppercase, lowercase, and numbers');
        setLoading(false);
        return;
      }

      // Call backend API to reset password
      const response = await authAPI.resetPassword({
        email,
        newPassword,
        confirmNewPassword: confirmPassword,
      });

      console.log('✅ Password reset successfully:', response.data);
      setSuccessMessage('🎉 ' + response.data.message);
      
      // Redirect to auth page after short delay
      setTimeout(() => {
        navigate('/auth');
      }, 1500);

    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.response?.data?.message || 'Password reset failed. Please try again.');
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
    console.log('🎯 [Resend OTP] Purpose: password-reset');
    
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
      console.log('📤 [Resend OTP] Request payload:', { email, purpose: 'password-reset' });
      
      // Use the new resend-otp endpoint
      const response = await authAPI.resendOtp({
        email,
        purpose: 'password-reset',
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
  // RENDER - STEP 1: REQUEST PASSWORD RESET
  // =========================================================================

  if (currentStep === 'email') {
    return (
      <div className="min-h-screen bg-neutral-bg flex flex-col">
        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-2xl font-bold text-dark-green mb-1">
                Reset Your Password
              </h2>
              <p className="text-gray-600 text-sm mb-6 font-semibold">
                📍 Step 1 of 3: Enter Your Email
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

              <form onSubmit={handleRequestReset}>
                {/* Email */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-dark-green focus:ring-2 focus:ring-light-green"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    📧 Enter the email associated with your CarbonMeter account
                  </p>
                </div>

                {/* Request Reset Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-dark-green text-off-white py-2 rounded font-semibold hover:bg-opacity-90 disabled:opacity-50 transition"
                >
                  {loading ? '⏳ Sending OTP...' : '📧 Send Password Reset OTP'}
                </button>
              </form>

              {/* Back to Login */}
              <div className="text-center mt-6 pt-6 border-t border-gray-200">
                <span className="text-gray-600">Remember your password? </span>
                <button
                  onClick={() => navigate('/login')}
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
  // RENDER - STEP 2: VERIFY RESET OTP
  // =========================================================================

  if (currentStep === 'otp') {
    return (
      <div className="min-h-screen bg-neutral-bg flex flex-col">
        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-2xl font-bold text-dark-green mb-1">
                Verify OTP
              </h2>
              <p className="text-gray-600 text-sm mb-6 font-semibold">
                📍 Step 2 of 3: Enter Reset Code
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

              <form onSubmit={handleVerifyResetOtp}>
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
                onClick={() => setCurrentStep('email')}
                className="w-full mt-3 text-dark-green hover:underline font-semibold text-sm"
              >
                ← Back to Email
              </button>
            </div>
          </div>
        </div>
    );
  }

  // =========================================================================
  // RENDER - STEP 3: RESET PASSWORD
  // =========================================================================

  if (currentStep === 'password') {
    return (
      <div className="min-h-screen bg-neutral-bg flex flex-col">
        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-2xl font-bold text-dark-green mb-1">
                Create New Password
              </h2>
              <p className="text-gray-600 text-sm mb-6 font-semibold">
                📍 Step 3 of 3: Set Your New Password
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

              <form onSubmit={handleResetPassword}>
                {/* New Password */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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
                    Confirm New Password *
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
                {newPassword && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
                        <div
                          className={`h-full transition ${
                            newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /\d/.test(newPassword)
                              ? 'bg-green-500'
                              : newPassword.length >= 8
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{
                            width: `${Math.min((newPassword.length / 12) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold whitespace-nowrap">
                        {newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /\d/.test(newPassword)
                          ? '✅ Strong'
                          : newPassword.length >= 8
                          ? '⚠️ Medium'
                          : '❌ Weak'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Reset Password Button */}
                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  className="w-full bg-dark-green text-off-white py-2 rounded font-semibold hover:bg-opacity-90 disabled:opacity-50 transition"
                >
                  {loading ? '⏳ Resetting Password...' : '🔐 Reset Password'}
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

              {/* Security Notice */}
              <p className="text-xs text-gray-500 text-center mt-4">
                🔒 Your new password will be securely encrypted with bcrypt
              </p>
            </div>
          </div>
        </div>
    );
  }
};

export default ForgotPasswordPage;
