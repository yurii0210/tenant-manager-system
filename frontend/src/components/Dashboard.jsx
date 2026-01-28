import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DollarSign, TrendingUp, Home, Activity, Loader2 } from 'lucide-react';
import StatsCard from './StatsCard';
import { api } from '../services/api';
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// Утилітна функція для безпечного парсингу
const getSafeUserData = () => {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : { name: "Користувач" };
  } catch (error) {
    console.error('Помилка завантаження даних користувача:', error);
    return { name: "Користувач" };
  }
};

// Початкові дані для уникнення undefined помилок
const INITIAL_DATA = {
  stats: {
    totalIncome: 0,
    totalExpenses: 0,
    activeProperties: 0,
    netProfit: 0,
  },
  chartData: [],
};

const Dashboard = () => {
  const [data, setData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(() => getSafeUserData());

  // Безпечне форматування валюти
  const formatCZK = useCallback((val) => {
    const num = Number(val);
    if (isNaN(num)) return '0 Kč';
    return `${num.toLocaleString('cs-CZ')} Kč`;
  }, []);

  // Отримання імені для вітання
  const userName = useMemo(() => 
    user.name.split(' ')[0] || 'Користувач', 
    [user.name]
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Оновлюємо дані користувача при кожному завантаженні
      const savedUser = getSafeUserData();
      setUser(savedUser);

      // Отримуємо дані з API з таймаутом
      const response = await Promise.race([
        api.get('/properties/dashboard/stats'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Таймаут запиту')), 10000)
        )
      ]);

      // Валідація отриманих даних
      const responseData = response.data || INITIAL_DATA;
      
      // Переконуємось, що всі необхідні поля існують
      const validatedData = {
        stats: {
          totalIncome: Number(responseData.stats?.totalIncome) || 0,
          totalExpenses: Number(responseData.stats?.totalExpenses) || 0,
          activeProperties: Number(responseData.stats?.activeProperties) || 0,
          netProfit: Number(responseData.stats?.netProfit) || 0,
        },
        chartData: Array.isArray(responseData.chartData) 
          ? responseData.chartData 
          : [],
      };

      setData(validatedData);
    } catch (err) {
      console.error('Помилка завантаження дашборду:', err);
      setError(err.message || 'Не вдалося завантажити дані');
      setData(INITIAL_DATA); // Повертаємо початкові дані при помилці
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Екран завантаження
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-gray-500 font-medium">Завантаження даних...</p>
      </div>
    );
  }

  // Екран помилки
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-lg text-center">
          <h3 className="text-xl font-bold text-red-700 mb-2">Помилка завантаження</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Спробувати знову
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6 animate-in fade-in duration-700">
      <header>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
          Вітаємо, {userName}! 👋
        </h1>
        <p className="text-gray-500 font-medium mt-1">
          Огляд вашої бізнес-активності
          {data.chartData.length > 0 && ` · ${data.chartData.length} місяців даних`}
        </p>
      </header>

      {/* Картки статистики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Дохід" 
          value={formatCZK(data.stats.totalIncome)} 
          icon={<DollarSign className="w-5 h-5" />} 
          color="green"
          trend="up"
          description="Загальний дохід"
        />
        <StatsCard 
          title="Витрати" 
          value={formatCZK(data.stats.totalExpenses)} 
          icon={<TrendingUp className="w-5 h-5" />} 
          color="red" 
          trend="down"
          description="Загальні витрати"
        />
        <StatsCard 
          title="Прибуток" 
          value={formatCZK(data.stats.netProfit)} 
          icon={<Activity className="w-5 h-5" />} 
          color="blue" 
          trend={data.stats.netProfit >= 0 ? "up" : "down"}
          description="Чистий прибуток"
        />
        <StatsCard 
          title="Об'єкти" 
          value={data.stats.activeProperties.toString()} 
          icon={<Home className="w-5 h-5" />} 
          color="purple"
          description="Активні нерухомості"
        />
      </div>

      {/* Графік */}
      <section className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h3 className="text-xl font-black text-gray-900">Фінансова динаміка</h3>
            <p className="text-gray-500 text-sm mt-1">Останні 12 місяців</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-bold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span>Дохід</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span>Витрати</span>
            </div>
          </div>
        </div>
        
        <div className="h-80 w-full">
          {data.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={data.chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke="#f3f4f6" 
                  strokeOpacity={0.8}
                />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 600}} 
                  dy={10}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 12}} 
                  tickFormatter={(val) => `${(val/1000).toFixed(0)}k`}
                  width={50}
                />
                <Tooltip 
                  contentStyle={{
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', 
                    padding: '12px',
                    backgroundColor: 'white',
                  }}
                  itemStyle={{fontWeight: 800}}
                  formatter={(value) => [formatCZK(value), 'Сума']}
                  labelFormatter={(label) => `Місяць: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  name="Дохід"
                  stroke="#3b82f6" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 8 }}
                  strokeOpacity={0.9}
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  name="Витрати"
                  stroke="#ef4444" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 8 }}
                  strokeOpacity={0.9}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 font-medium border-2 border-dashed border-gray-100 rounded-2xl p-8">
              <Activity className="w-16 h-16 mb-4 opacity-40" />
              <p className="text-lg mb-2">Недостатньо даних</p>
              <p className="text-sm text-gray-300 text-center max-w-md">
                Для побудови графіка потрібні дані за декілька місяців. 
                Додайте транзакції або зачекайте на наступний звітний період.
              </p>
            </div>
          )}
        </div>
        
        {/* Інформація про оновлення */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 flex items-center justify-between">
            <span>Дані оновлено: {new Date().toLocaleDateString('uk-UA')}</span>
            <button 
              onClick={fetchData}
              disabled={loading}
              className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Loader2 className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Оновлення...' : 'Оновити дані'}
            </button>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;