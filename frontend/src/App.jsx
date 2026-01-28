import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AuthPage from './components/AuthPage'; 
import ProfilePage from './components/ProfilePage';
import Header from './components/Header';
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

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Стан авторизації
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
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Вхід
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Вихід (Централізована функція)
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
  };

  // 1. Якщо не авторизований — показуємо тільки AuthPage
  if (!isLoggedIn) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex overflow-hidden">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-100"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>

        {/* Sidebar тепер не потребує onLogout, бо ми видалили звідти кнопку */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* ТУТ ВАЖЛИВО: Передаємо handleLogout у Header */}
          <Header user={user} onLogout={handleLogout} />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
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
              
              {/* Автоматичний редірект на головну */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;