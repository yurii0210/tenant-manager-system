import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Home, DollarSign, Droplets,
  Settings, Users, FileText, Bell, ChevronLeft
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  // Отримуємо дані користувача для відображення внизу
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = userData.name || 'Користувач';
  const userEmail = userData.email || 'user@example.com';

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const menuItems = [
    { path: '/', label: 'Дашборд', icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: '/properties', label: 'Нерухомість', icon: <Home className="w-5 h-5" /> },
    { path: '/finance', label: 'Фінанси', icon: <DollarSign className="w-5 h-5" /> },
    { path: '/utilities', label: 'Комунальні', icon: <Droplets className="w-5 h-5" /> },
    { path: '/tenants', label: 'Орендарі', icon: <Users className="w-5 h-5" /> },
    { path: '/reports', label: 'Звіти', icon: <FileText className="w-5 h-5" /> },
    { path: '/notifications', label: 'Сповіщення', icon: <Bell className="w-5 h-5" /> },
    { path: '/settings', label: 'Налаштування', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Overlay для мобільних пристроїв */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />}

      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col`}>
        
        {/* Логотип */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Home className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">TMS</span>
          </div>
          <button onClick={onClose} className="md:hidden text-gray-500 hover:text-gray-700">
            <ChevronLeft />
          </button>
        </div>

        {/* Навігація */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `
                flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all
                ${isActive 
                  ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/50' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
              `}
              onClick={() => window.innerWidth < 768 && onClose()}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Профіль (без кнопки виходу) */}
        <div className="border-t border-gray-100 p-4 bg-gray-50/50">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
              {getInitials(userName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{userName}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold truncate">
                {userData.role || 'Адміністратор'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;