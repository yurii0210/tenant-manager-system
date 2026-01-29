import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async'; // Додано HelmetProvider
import { Menu } from 'lucide-react';

import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';

// Компоненти внутрішні (Dashboard)
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import PropertyManagement from './components/PropertyManagement';
import TenantsList from './components/TenantsList';
import FinanceTracker from './components/FinanceTracker';
import Utilities from './components/Utilities';
import Reports from './components/Reports';
import Notifications from './components/Notifications';
import Settings from './components/Settings';
import ProfilePage from './components/ProfilePage';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isAuthView, setIsAuthView] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setIsAuthView(false);
  };

  // Вся логіка рендерингу тепер всередині HelmetProvider
  return (
    <HelmetProvider>
      {!isLoggedIn ? (
        <div className="min-h-screen bg-white">
          <Helmet>
            <title>{isAuthView ? 'Вхід | Tenant Manager' : 'Tenant Manager — Керування Орендою'}</title>
          </Helmet>
          
          {isAuthView ? (
            <AuthPage 
              onLoginSuccess={handleLoginSuccess} 
              onBack={() => setIsAuthView(false)} 
            />
          ) : (
            <LandingPage onStart={() => setIsAuthView(true)} />
          )}
        </div>
      ) : (
        <Router>
          <div className="min-h-screen bg-[#F8FAFC] flex overflow-hidden">
            <Helmet>
              <title>Панель керування | Tenant Manager</title>
            </Helmet>

            {isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-md border border-slate-100"
              >
                <Menu className="w-6 h-6 text-slate-600" />
              </button>
            )}

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <Header user={user} onLogout={handleLogout} />
              
              <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/properties" element={<PropertyManagement />} />
                  <Route path="/tenants" element={<TenantsList />} />
                  <Route path="/finance" element={<FinanceTracker />} />
                  <Route path="/utilities" element={<Utilities />} />
                  <Route path="/profile" element={<ProfilePage user={user} onLogout={handleLogout} />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </div>
        </Router>
      )}
    </HelmetProvider>
  );
}

export default App;