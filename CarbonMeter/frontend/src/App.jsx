import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import DiscoverPage from './pages/DiscoverPage';
import LogActivityPage from './pages/LogActivityPage';
import LeaderboardPage from './pages/LeaderboardPage';
import BadgesPage from './pages/BadgesPage';

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
      <Navbar />
      <Routes>
        {/* Public Routes - HomePage is accessible to all users */}
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/auth" element={<PublicRoute element={<AuthPage />} />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/discover" element={<DiscoverPage />} />

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
    </Router>
  );
}

export default App;
