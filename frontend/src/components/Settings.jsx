import React, { useState } from 'react';
import { User, Lock, Bell, Globe, Save, Palette } from 'lucide-react';

const Settings = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{"name": "", "email": ""}'));

  const handleSaveProfile = (e) => {
    e.preventDefault();
    localStorage.setItem('user', JSON.stringify(user));
    alert('Профіль оновлено!');
    window.location.reload(); // Щоб ім'я оновилося всюди
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-black text-gray-900 mb-8">Налаштування системи</h1>

      <div className="space-y-6">
        {/* Блок 1: Профіль */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><User size={20} /></div>
            <h2 className="font-bold text-gray-900">Особиста інформація</h2>
          </div>
          <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Ваше Ім'я</label>
                <input 
                  type="text" 
                  value={user.name}
                  onChange={(e) => setUser({...user, name: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Email</label>
                <input 
                  type="email" 
                  value={user.email}
                  onChange={(e) => setUser({...user, email: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
              <Save size={18} /> Зберегти зміни
            </button>
          </form>
        </div>

        {/* Блок 2: Безпека */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><Lock size={20} /></div>
            <h2 className="font-bold text-gray-900">Безпека</h2>
          </div>
          <div className="p-6">
            <button className="text-sm font-bold text-blue-600 hover:underline">Змінити пароль доступу</button>
            <p className="text-xs text-gray-400 mt-1">Останній раз пароль було змінено 3 місяці тому</p>
          </div>
        </div>

        {/* Блок 3: Регіональні налаштування */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center gap-3">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Globe size={20} /></div>
            <h2 className="font-bold text-gray-900">Локалізація</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Валюта за замовчуванням</label>
              <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 outline-none">
                <option value="CZK">Чеська коруна(Kč)</option>
                <option value="USD">Долар ($)</option>
                <option value="EUR">Євро (€)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Мова інтерфейсу</label>
              <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 outline-none">
                <option value="uk">Українська</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;