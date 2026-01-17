import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { authAPI, setAuthToken } from '../api';
import { AuthContext } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData);
      login(response.data.user, response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.googleLogin(credentialResponse.credential);
      setAuthToken(response.data.token);
      login(response.data.user, response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="min-h-screen bg-neutral-bg flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-dark-green text-off-white shadow">
          <h1 className="text-2xl font-bold">CarbonMeter</h1>
          <select className="px-4 py-2 bg-dark-green text-off-white border border-off-white rounded">
            <option>English</option>
            <option>Spanish</option>
          </select>
        </div>

        {/* Login Form */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-2xl font-bold text-dark-green mb-6 text-center">
              Welcome Back
            </h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <input
                type="email"
                name="email"
                placeholder="Email or Mobile"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 mb-4 border border-gray-300 rounded focus:outline-none focus:border-dark-green"
                required
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-2 mb-2 border border-gray-300 rounded focus:outline-none focus:border-dark-green"
                required
              />

              {/* Forgot Password Link */}
              <div className="text-right mb-6">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-dark-green hover:underline font-semibold"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-dark-green text-off-white py-2 rounded font-semibold hover:bg-opacity-90 disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            {/* Social Login */}
            <div className="my-6 flex items-center gap-2">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-gray-500 text-sm">Or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <div className="mb-4">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google login failed')}
              />
            </div>

            {/* Sign Up Link */}
            <div className="text-center mt-6">
              <span className="text-gray-600">Don't have an account? </span>
              <button
                onClick={() => navigate('/register')}
                className="font-semibold text-dark-green hover:underline"
              >
                REGISTER YOURSELF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
