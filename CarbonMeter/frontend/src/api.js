import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const authAPI = {
  // ========== 3-STEP REGISTRATION FLOW ==========
  // Step 1: Send OTP to email
  registerSendOtp: (data) => axios.post(`${API_URL}/auth/register/send-otp`, data),
  
  // Step 2: Verify OTP (email verification only, no account creation yet)
  registerVerifyOtp: (data) => axios.post(`${API_URL}/auth/register/verify-otp`, data),
  
  // Step 3: Create password and complete registration
  registerCreatePassword: (data) => axios.post(`${API_URL}/auth/register/create-password`, data),
  
  // ========== FORGOT PASSWORD FLOW (3 STEPS) ==========
  // Step 1: Request password reset OTP
  forgotPassword: (data) => axios.post(`${API_URL}/auth/forgot-password`, data),
  
  // Step 2: Verify reset OTP
  verifyResetOtp: (data) => axios.post(`${API_URL}/auth/verify-reset-otp`, data),
  
  // Step 3: Reset password with new password
  resetPassword: (data) => axios.post(`${API_URL}/auth/reset-password`, data),
  
  // ========== LEGACY METHODS (BACKWARD COMPATIBLE) ==========
  register: (data) => axios.post(`${API_URL}/auth/register`, data),
  login: (data) => axios.post(`${API_URL}/auth/login`, data),
  googleLogin: (token) => axios.post(`${API_URL}/auth/google-login`, { token }),
};

export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

export const getAuthToken = () => localStorage.getItem('token');
