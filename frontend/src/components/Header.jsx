import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Calendar, ChevronDown, LogOut, Bell } from 'lucide-react';

/**
 * Header компонент
 * @param {Object} user - об'єкт поточного користувача з App.js
 * @param {Function} onLogout - функція виходу, передана з App.js
 */
const Header = ({ user, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const profileRef = useRef(null);

  // Пріоритет: дані з пропсів, інакше — fallback з localStorage
  const userData = useMemo(() => {
    if (user) return user;
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : { name: "Гість", role: "Користувач" };
    } catch {
      return { name: "Гість", role: "Користувач" };
    }
  }, [user]);

  // Генерація ініціалів
  const userInitials = useMemo(() => {
    return userData.name
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [userData.name]);

  // Форматування дати
  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('uk-UA', { 
      day: 'numeric', 
      month: 'short',
      weekday: 'short'
    });
  }, []);

  // Закриття меню при кліку поза ним
  const handleClickOutside = useCallback((event) => {
    if (profileRef.current && !profileRef.current.contains(event.target)) {
      setIsProfileOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    console.log('Пошук:', searchQuery);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 py-2 md:px-6">
        <div className="flex items-center justify-between gap-4">
          
          {/* Пошук */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Пошук по системі..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
            </div>
          </form>

          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Дата */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-2 text-gray-600 border-r border-gray-100 mr-2">
              <Calendar className="w-4 h-4 shrink-0" />
              <span className="text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                {formattedDate}
              </span>
            </div>

            {/* Профіль */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 pr-2 hover:bg-gray-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-expanded={isProfileOpen}
              >
                <div className="w-8 h-8 md:w-9 md:h-9 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md shadow-blue-200">
                  <span className="text-xs font-bold">{userInitials}</span>
                </div>
                
                <div className="hidden md:flex flex-col items-start leading-tight min-w-0 max-w-[120px]">
                  <span className="text-sm font-bold text-gray-900 truncate w-full text-left">
                    {userData.name}
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-tighter font-semibold truncate w-full text-left">
                    {userData.role || 'Власник'}
                  </span>
                </div>
                
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Випадаюче меню профілю */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in zoom-in duration-200">
                  <div className="px-4 py-2 border-b border-gray-50 md:hidden">
                    <p className="text-xs font-bold text-gray-900 truncate">{userData.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase">{userData.role || 'Власник'}</p>
                  </div>
                  
                  <button 
                    onClick={onLogout}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-bold flex items-center gap-3 transition-colors group"
                  >
                    <div className="p-1.5 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                      <LogOut className="w-4 h-4 text-red-600" />
                    </div>
                    Вийти з системи
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;