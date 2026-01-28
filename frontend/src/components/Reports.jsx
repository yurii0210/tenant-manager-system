import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, ArrowUpRight, ArrowDownRight, 
  Filter, Loader2, TrendingUp, DollarSign 
} from 'lucide-react';
import { api } from '../services/api';

const Reports = () => {
  const [reportType, setReportType] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    properties: []
  });

  // Завантаження даних
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        // Запит до вашого API (замініть на реальний шлях)
        const response = await api.get(`/reports?period=${reportType}`);
        setData(response.data);
      } catch (error) {
        console.error("Помилка завантаження звітів:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [reportType]);

  // Функція для красивого форматування валюти (Чеська крона)
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      {/* Шапка сторінки */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Аналітика</h1>
          <p className="text-gray-500 mt-1">Огляд фінансової ефективності вашої нерухомості</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
          <button 
            onClick={() => setReportType('monthly')}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${reportType === 'monthly' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Місяць
          </button>
          <button 
            onClick={() => setReportType('yearly')}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${reportType === 'yearly' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Рік
          </button>
        </div>
      </div>

      {/* Картки з головними показниками */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Загальний дохід" 
          value={formatCurrency(data.totalRevenue)} 
          icon={<TrendingUp className="text-green-600" />} 
          trendUp={true}
        />
        <StatCard 
          title="Витрати" 
          value={formatCurrency(data.totalExpenses)} 
          icon={<ArrowDownRight className="text-red-600" />} 
          trendUp={false}
        />
        <StatCard 
          title="Чистий прибуток" 
          value={formatCurrency(data.netProfit)} 
          icon={<DollarSign className="text-blue-600" />} 
          highlight={true}
        />
      </div>

      {/* Секція з таблицею */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-linear-to-r from-white to-gray-50/50">
          <h3 className="font-black text-gray-900 uppercase tracking-wider text-sm">Ефективність об'єктів</h3>
          <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
            <Download size={20} />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[11px] uppercase font-black text-gray-400 tracking-widest border-b border-gray-50">
                <th className="px-8 py-5 text-left">Назва об'єкта</th>
                <th className="px-8 py-5 text-left">Дохід</th>
                <th className="px-8 py-5 text-left">Витрати</th>
                <th className="px-8 py-5 text-left text-blue-600">Прибуток</th>
                <th className="px-8 py-5 text-right">Рентабельність</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.properties.length > 0 ? (
                data.properties.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-all group">
                    <td className="px-8 py-5 font-bold text-gray-900">{item.name}</td>
                    <td className="px-8 py-5 text-green-600 font-semibold">{formatCurrency(item.income)}</td>
                    <td className="px-8 py-5 text-red-500">{formatCurrency(item.expenses)}</td>
                    <td className="px-8 py-5 font-black text-gray-900">{formatCurrency(item.profit)}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-xs font-bold text-gray-500">{Math.round((item.profit / item.income) * 100)}%</span>
                        <div className="w-24 bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full transition-all duration-1000" 
                            style={{ width: `${(item.profit / item.income) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center text-gray-400 font-medium">
                    Дані за цей період відсутні
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Допоміжний компонент для карток статистики
const StatCard = ({ title, value, icon, trend, trendUp, highlight }) => (
  <div className={`p-6 rounded-3xl border transition-all ${highlight ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-200' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}`}>
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-2xl ${highlight ? 'bg-white/20 text-white' : 'bg-gray-50'}`}>
        {icon}
      </div>
      {trend && (
        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {trend}
        </span>
      )}
    </div>
    <div className="mt-5">
      <p className={`text-xs font-bold uppercase tracking-widest ${highlight ? 'text-blue-100' : 'text-gray-400'}`}>{title}</p>
      <p className={`text-2xl font-black mt-1 ${highlight ? 'text-white' : 'text-gray-900'}`}>{value}</p>
    </div>
  </div>
);

export default Reports;