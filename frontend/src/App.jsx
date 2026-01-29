import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AuthPage from './components/AuthPage';
import ProfilePage from './components/ProfilePage';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import PropertyManagement from './components/PropertyManagement';
import TenantsList from './components/TenantsList';
import StatsCard from './components/StatsCard';
import FinanceTracker from './components/FinanceTracker';
import Utilities from './components/Utilities';
import Reports from './components/Reports';
import Notifications from './components/Notifications';
import Settings from './components/Settings';
import { Menu } from 'lucide-react';

function AppRoutes({ isLoggedIn, user, handleLogout, handleLoginSuccess }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isLoggedIn) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />
        <div className="flex-1">
          <Header user={user} onLogout={handleLogout} />
          <main className="p-4 md:p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/properties" element={<PropertyManagement />} />
              <Route path="/tenants" element={<TenantsList />} />
              <Route path="/finance" element={<FinanceTracker />} />
              <Route path="/utilities" element={<Utilities />} />
              <Route path="/profile" element={<ProfilePage user={user} onLogout={handleLogout} />} />
              <Route path="/statscard" element={<StatsCard />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  const handleStart = () => setShowLanding(false);

  const handleLoginSuccess = (userData, token) => {
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setShowLanding(true);
  };

  return (
    <Router>
      {!isLoggedIn ? (
        showLanding ? (
          <LandingPage onStart={handleStart} />
        ) : (
          <AuthPage onLoginSuccess={handleLoginSuccess} />
        )
      ) : (
        <AppRoutes
          isLoggedIn={isLoggedIn}
          user={user}
          handleLogout={handleLogout}
          handleLoginSuccess={handleLoginSuccess}
        />
      )}
    </Router>
  );
}

export default App;
