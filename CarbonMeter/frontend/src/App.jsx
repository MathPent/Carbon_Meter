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
import CalculatePage from './pages/CalculatePage';
import LeaderboardPage from './pages/LeaderboardPage';
import BadgesPage from './pages/BadgesPage';
import CarbonMapPage from './pages/CarbonMapPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';

// Government pages
import GovDashboard from './pages/gov/GovDashboard';
import GovLogActivity from './pages/gov/GovLogActivity';
import GovAnalytics from './pages/gov/GovAnalytics';
import GovLeaderboard from './pages/gov/GovLeaderboard';
import GovCarbonMap from './pages/gov/GovCarbonMap';
import GovReports from './pages/gov/GovReports';

// Organization pages
import OrgDashboard from './pages/org/OrgDashboard';
import OrgCalculate from './pages/org/OrgCalculate';
import OrgLogActivity from './pages/org/OrgLogActivity';
import OrgCarbonCredits from './pages/org/OrgCarbonCredits';
import OrgCompare from './pages/org/OrgCompare';
import OrgNavbar from './components/org/OrgNavbar';

// Layout wrapper to conditionally show Navbar and Chatbot
function ConditionalLayout({ children }) {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isGovRoute = location.pathname.startsWith('/gov');
  const isOrgRoute = location.pathname.startsWith('/org');

  return (
    <>
      {!isAdminRoute && !isGovRoute && !isOrgRoute && <Navbar />}
      {isOrgRoute && <OrgNavbar />}
      {children}
      {!isAdminRoute && !isGovRoute && !isOrgRoute && <CarBoxAIWidget />}
    </>
  );
}

// Protected Route Component
function ProtectedRoute({ element }) {
  const { isAuthenticated, loading, user } = useContext(AuthContext);
  const location = useLocation();

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

  if (!isAuthenticated) {
    // Save the intended destination
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  // Redirect government users away from individual routes
  if (user?.role === 'Government' && window.location.pathname.startsWith('/dashboard')) {
    return <Navigate to="/gov/dashboard" />;
  }

  // Redirect organization users away from individual routes
  if (user?.role === 'Organization' && window.location.pathname.startsWith('/dashboard')) {
    return <Navigate to="/org/dashboard" />;
  }

  return element;
}

// Organization Route Component
function OrgRoute({ element }) {
  const { isAuthenticated, loading, user } = useContext(AuthContext);

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

  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }

  if (user?.role !== 'Organization') {
    return <Navigate to="/dashboard" />;
  }

  return element;
}

// Government Route Component
function GovRoute({ element }) {
  const { isAuthenticated, loading, user } = useContext(AuthContext);

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

  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }

  if (user?.role !== 'Government') {
    return <Navigate to="/dashboard" />;
  }

  return element;
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

          {/* Government Routes - Only for Government role */}
          <Route 
            path="/gov/dashboard" 
            element={<GovRoute element={<GovDashboard />} />} 
          />
          <Route 
            path="/gov/log-activity" 
            element={<GovRoute element={<GovLogActivity />} />} 
          />
          <Route 
            path="/gov/analytics" 
            element={<GovRoute element={<GovAnalytics />} />} 
          />
          <Route 
            path="/gov/leaderboard" 
            element={<GovRoute element={<GovLeaderboard />} />} 
          />
          <Route 
            path="/gov/carbon-map" 
            element={<GovRoute element={<GovCarbonMap />} />} 
          />
          <Route 
            path="/gov/reports" 
            element={<GovRoute element={<GovReports />} />} 
          />

          {/* Organization Routes - Only for Organization role */}
          <Route 
            path="/org/dashboard" 
            element={<OrgRoute element={<OrgDashboard />} />} 
          />
          <Route 
            path="/org/calculate" 
            element={<OrgRoute element={<OrgCalculate />} />} 
          />
          <Route 
            path="/org/log-activity" 
            element={<OrgRoute element={<OrgLogActivity />} />} 
          />
          <Route 
            path="/org/carbon-credits" 
            element={<OrgRoute element={<OrgCarbonCredits />} />} 
          />
          <Route 
            path="/org/compare" 
            element={<OrgRoute element={<OrgCompare />} />} 
          />

          {/* Protected Routes - Individual/Industry users */}
          <Route 
            path="/dashboard" 
            element={<ProtectedRoute element={<DashboardPage />} />} 
          />
          <Route 
            path="/calculate" 
            element={<ProtectedRoute element={<CalculatePage />} />} 
          />
          <Route 
            path="/leaderboard" 
            element={<ProtectedRoute element={<LeaderboardPage />} />} 
          />
          <Route 
            path="/badges" 
            element={<ProtectedRoute element={<BadgesPage />} />} 
          />
          <Route 
            path="/carbon-map" 
            element={<CarbonMapPage />} 
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </ConditionalLayout>
    </Router>
  );
}

export default App;
