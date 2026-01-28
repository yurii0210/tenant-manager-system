import React, { useState, useEffect } from 'react';
import { 
  Bell, CheckCheck, Trash2, DollarSign, 
  AlertTriangle, Info, Clock, Loader2 
} from 'lucide-react';
import { api } from '../services/api';

const Notifications = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Завантаження сповіщень із сервера
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Фільтруємо за типом, якщо вибрано не 'all'
      const url = activeTab === 'all' ? '/notifications' : `/notifications?type=${activeTab}`;
      const response = await api.get(url);
      setNotifications(response.data);
    } catch (error) {
      console.error('Помилка завантаження сповіщень:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  // 2. Позначити одне як прочитане
  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Помилка оновлення статусу:', error);
    }
  };

  // 3. Видалити сповіщення
  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Помилка видалення:', error);
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'finance': return <div className="p-2 bg-green-100 text-green-600 rounded-lg"><DollarSign size={20} /></div>;
      case 'warning': return <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg"><AlertTriangle size={20} /></div>;
      default: return <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Info size={20} /></div>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      {/* Шапка */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Сповіщення</h1>
          <p className="text-gray-500 text-sm mt-1">Події, що потребують вашої уваги</p>
        </div>
        <button 
          onClick={async () => {
            await api.put('/notifications/read-all');
            fetchNotifications();
          }}
          className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all flex items-center gap-2"
        >
          <CheckCheck size={18} /> Позначити всі прочитаними
        </button>
      </div>

      {/* Таби фільтрації */}
      <div className="flex gap-6 mb-8 border-b border-gray-100">
        {[
          { id: 'all', label: 'Усі' },
          { id: 'finance', label: 'Фінанси' },
          { id: 'warning', label: 'Важливі' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 px-1 text-sm font-black transition-all relative ${
              activeTab === tab.id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-full" />}
          </button>
        ))}
      </div>

      {/* Список */}
      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className={`flex items-start gap-4 p-5 rounded-2xl border transition-all ${
                n.is_read ? 'bg-white border-gray-100 opacity-75' : 'bg-linear-to-r from-blue-50/50 to-white border-blue-100 shadow-sm'
              }`}
            >
              {getTypeIcon(n.type)}
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className={`font-bold ${n.is_read ? 'text-gray-600' : 'text-gray-900'}`}>
                    {n.title}
                  </h3>
                  <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                    <Clock size={12} /> {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{n.message}</p>
                
                <div className="flex gap-4 mt-4">
                  {!n.is_read && (
                    <button 
                      onClick={() => markAsRead(n.id)}
                      className="text-xs font-black text-blue-600 hover:text-blue-700"
                    >
                      ПРОЧИТАНО
                    </button>
                  )}
                  <button 
                    onClick={() => deleteNotification(n.id)}
                    className="text-xs font-black text-gray-300 hover:text-red-500 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={12} /> ВИДАЛИТИ
                  </button>
                </div>
              </div>
              {!n.is_read && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.5)]" />}
            </div>
          ))
        ) : (
          <div className="text-center py-24 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
            <Bell size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-bold">Сповіщень не знайдено</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;