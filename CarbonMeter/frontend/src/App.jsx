import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import CarBoxAIWidget from './components/chatbot/CarBoxAIWidget';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import DiscoverPage from './pages/DiscoverPage';
import LogActivityPage from './pages/LogActivityPage';
import LeaderboardPage from './pages/LeaderboardPage';
import BadgesPage from './pages/BadgesPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';

// Layout wrapper to conditionally show Navbar and Chatbot
function ConditionalLayout({ children }) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Navbar />}
      {children}
      {!isAdminRoute && <CarBoxAIWidget />}
    </>
  );
}

// Protected Route Component
function ProtectedRoute({ element }) {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      fontSize: '18px',
      color: '#666'
    }}>
      Loading...
    </div>;
  }

  return isAuthenticated ? element : <Navigate to="/auth" />;
}

// Public Route Component - redirect to home if already logged in
function PublicRoute({ element }) {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      fontSize: '18px',
      color: '#666'
    }}>
      Loading...
    </div>;
  }

  return !isAuthenticated ? element : <Navigate to="/home" />;
}

// Admin Route Component - independent of user authentication
function AdminRoute({ element }) {
  const adminToken = localStorage.getItem('adminToken');
  
  if (!adminToken) {
    return <Navigate to="/admin/login" />;
  }
  
  return element;
}

function App() {
  const { loading } = useContext(AuthContext);

  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      fontSize: '18px',
      color: '#666'
    }}>
      Loading...
    </div>;
  }

  return (
    <Router>
      <ConditionalLayout>
        <Routes>
          {/* Public Routes - HomePage is accessible to all users */}
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/auth" element={<PublicRoute element={<AuthPage />} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/discover" element={<DiscoverPage />} />

          {/* Admin Routes - Separate from user routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route 
            path="/admin/dashboard" 
            element={<AdminRoute element={<AdminDashboard />} />} 
          />

          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={<ProtectedRoute element={<DashboardPage />} />} 
          />
          <Route 
            path="/log-activity" 
            element={<ProtectedRoute element={<LogActivityPage />} />} 
          />
          <Route 
            path="/leaderboard" 
            element={<ProtectedRoute element={<LeaderboardPage />} />} 
          />
          <Route 
            path="/badges" 
            element={<ProtectedRoute element={<BadgesPage />} />} 
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </ConditionalLayout>
    </Router>
  );
}

export default App;
