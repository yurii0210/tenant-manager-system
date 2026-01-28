import React, { useState, useEffect } from 'react';
import { User, LogOut, Shield, Mail, Calendar, Settings, ChevronRight } from 'lucide-react';

export default function ProfilePage({ user, onLogout }) {
  const [stats, setStats] = useState({
    totalProperties: 0,
    lastLogin: new Date().toLocaleDateString('uk-UA')
  });

  // Функція виходу
  const handleLogout = () => {
    localStorage.removeItem('token'); // Видаляємо ключ доступу
    onLogout(); // Повідомляємо головний додаток
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] p-6 animate-in fade-in duration-500">
      {/* Шапка профілю */}
      <div className="max-w-md mx-auto space-y-8">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-linear-to-tr from-blue-600 to-indigo-600 rounded-4xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-200">
              <User size={48} className="text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
          </div>
          <h2 className="text-3xl font-[1000] tracking-tighter text-slate-900 mt-6">{user?.name || 'Адміністратор'}</h2>
          <p className="text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] mt-1">Premium Account</p>
        </div>

        {/* Картки інформації */}
        <div className="grid gap-4">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Email адреса</p>
              <p className="font-bold text-slate-800">{user?.email || 'realty@cz.com'}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Роль у системі</p>
              <p className="font-bold text-slate-800">Власник (Admin)</p>
            </div>
          </div>
        </div>

        {/* Налаштування та безпека */}
        <div className="space-y-3">
          <h3 className="text-xs font-[1000] text-slate-400 uppercase tracking-[0.2em] ml-6">Налаштування</h3>
          <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm overflow-hidden">
            <MenuButton icon={<Settings size={18}/>} label="Налаштування додатку" />
            <div className="h-px bg-slate-50 mx-6"></div>
            <MenuButton icon={<Calendar size={18}/>} label="Історія активності" />
          </div>
        </div>

        {/* Кнопка виходу */}
        <button 
          onClick={handleLogout}
          className="w-full py-5 bg-red-50 text-red-600 rounded-3xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors active:scale-95"
        >
          <LogOut size={20} />
          Вийти з профілю
        </button>

        <p className="text-center text-[9px] font-black text-slate-200 uppercase tracking-[0.3em]">
          Version 1.0.4 Enterprise
        </p>
      </div>
    </div>
  );
}

// Допоміжний компонент для кнопок меню
const MenuButton = ({ icon, label }) => (
  <button className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
    <div className="flex items-center gap-4">
      <div className="text-slate-400">{icon}</div>
      <span className="font-bold text-slate-700">{label}</span>
    </div>
    <ChevronRight size={18} className="text-slate-200" />
  </button>
);

