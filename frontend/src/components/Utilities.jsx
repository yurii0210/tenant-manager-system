import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, Search, Filter, Droplets, Zap, Flame, 
  Calendar, TrendingUp, Download, Clock, AlertCircle,
  CheckCircle, X, Users, Home, ChevronRight, Trash2,
  Loader2, BarChart3, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { format, parseISO, differenceInDays, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { uk } from 'date-fns/locale';

// Утилітні функції
const formatDate = (dateString, formatStr = 'dd.MM.yyyy') => {
  if (!dateString) return '—';
  try {
    return format(parseISO(dateString), formatStr, { locale: uk });
  } catch (error) {
    return dateString;
  }
};

const formatNumber = (num) => {
  return Number(num).toLocaleString('uk-UA');
};

const Utilities = () => {
  const [meterReadings, setMeterReadings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedReading, setSelectedReading] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [newReading, setNewReading] = useState({
    property_id: '',
    type: 'water',
    value: '',
    reading_date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  const [filters, setFilters] = useState({
    property_id: '',
    type: '',
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const fetchMeterReadings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/meters');
      const data = response.data || [];
      
      // Сортуємо за датою (найновіші перші)
      const sortedData = data.sort((a, b) => 
        new Date(b.reading_date) - new Date(a.reading_date)
      );
      
      setMeterReadings(sortedData);
    } catch (error) {
      console.error('Помилка завантаження показників:', error);
      setError('Не вдалося завантажити показники лічильників');
      setMeterReadings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProperties = useCallback(async () => {
    try {
      const response = await api.get('/properties');
      setProperties(response.data || []);
    } catch (error) {
      console.error('Помилка завантаження об\'єктів:', error);
      setProperties([]);
    }
  }, []);

  useEffect(() => {
    fetchMeterReadings();
    fetchProperties();
  }, [fetchMeterReadings, fetchProperties]);

  // Обчислення статистики
  const stats = useMemo(() => {
    const waterReadings = meterReadings.filter(r => r.type === 'water');
    const electricityReadings = meterReadings.filter(r => r.type === 'electricity');
    const gasReadings = meterReadings.filter(r => r.type === 'gas');
    
    const uniqueProperties = [...new Set(meterReadings.map(r => r.property_id))];
    
    // Останні показники по кожному типу
    const latestReadings = {
      water: waterReadings[0] || null,
      electricity: electricityReadings[0] || null,
      gas: gasReadings[0] || null
    };
    
    // Обчислення споживання (різниця між послідовними показами)
    let totalConsumption = 0;
    const propertyReadings = {};
    
    meterReadings.forEach(reading => {
      if (!propertyReadings[reading.property_id]) {
        propertyReadings[reading.property_id] = [];
      }
      propertyReadings[reading.property_id].push(reading);
    });
    
    // Сортуємо показники по даті для кожного об'єкта
    Object.values(propertyReadings).forEach(readings => {
      readings.sort((a, b) => new Date(a.reading_date) - new Date(b.reading_date));
      
      for (let i = 1; i < readings.length; i++) {
        const current = readings[i];
        const previous = readings[i - 1];
        
        if (current.type === previous.type) {
          const consumption = current.value - previous.value;
          if (consumption > 0) {
            totalConsumption += consumption;
          }
        }
      }
    });
    
    return {
      totalReadings: meterReadings.length,
      uniqueProperties: uniqueProperties.length,
      waterReadings: waterReadings.length,
      electricityReadings: electricityReadings.length,
      gasReadings: gasReadings.length,
      latestReadings,
      totalConsumption: Math.round(totalConsumption),
      overdueProperties: properties.filter(p => {
        const propertyReadings = meterReadings.filter(r => r.property_id === p.id);
        if (propertyReadings.length === 0) return true;
        
        const latestReading = propertyReadings.reduce((latest, reading) => 
          new Date(reading.reading_date) > new Date(latest.reading_date) ? reading : latest
        );
        
        const daysSinceLastReading = differenceInDays(new Date(), parseISO(latestReading.reading_date));
        return daysSinceLastReading > 30; // Більше 30 днів без показників
      }).length
    };
  }, [meterReadings, properties]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewReading(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateReading = () => {
    if (!newReading.property_id) {
      setError('Оберіть об\'єкт нерухомості');
      return false;
    }
    
    if (!newReading.value || Number(newReading.value) <= 0) {
      setError('Введіть коректне значення показника');
      return false;
    }
    
    const readingDate = new Date(newReading.reading_date);
    if (readingDate > new Date()) {
      setError('Дата показника не може бути у майбутньому');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateReading()) {
      return;
    }
    
    setActionLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/meters', {
        ...newReading,
        value: parseFloat(newReading.value)
      });
      
      setMeterReadings(prev => [response.data, ...prev]);
      
      setSuccessMessage('Показники успішно додано!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Скидання форми
      setNewReading({
        property_id: '',
        type: 'water',
        value: '',
        reading_date: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
      });
    } catch (error) {
      console.error('Помилка додавання показників:', error);
      setError(error.response?.data?.message || 'Не вдалося додати показники');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReading = async () => {
    if (!selectedReading) return;
    
    setActionLoading(true);
    try {
      await api.delete(`/meters/${selectedReading.id}`);
      
      setMeterReadings(prev => prev.filter(r => r.id !== selectedReading.id));
      setSuccessMessage('Показник успішно видалено');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      setShowDeleteModal(false);
      setSelectedReading(null);
    } catch (error) {
      console.error('Помилка видалення:', error);
      setError('Не вдалося видалити показник');
    } finally {
      setActionLoading(false);
    }
  };

  const getMeterIcon = (type) => {
    switch (type) {
      case 'water':
        return <Droplets className="w-5 h-5 text-blue-500" />;
      case 'electricity':
        return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'gas':
        return <Flame className="w-5 h-5 text-orange-500" />;
      default:
        return <Droplets className="w-5 h-5 text-gray-500" />;
    }
  };

  const getMeterColor = (type) => {
    switch (type) {
      case 'water':
        return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
      case 'electricity':
        return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' };
      case 'gas':
        return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
    }
  };

  const getMeterLabel = (type) => {
    switch (type) {
      case 'water':
        return { label: 'Вода', unit: 'м³' };
      case 'electricity':
        return { label: 'Електрика', unit: 'кВт·год' };
      case 'gas':
        return { label: 'Газ', unit: 'м³' };
      default:
        return { label: 'Невідомо', unit: '' };
    }
  };

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name || property.address : `Об'єкт #${propertyId}`;
  };

  const filteredReadings = useMemo(() => {
    return meterReadings.filter(reading => {
      if (filters.property_id && reading.property_id !== parseInt(filters.property_id)) return false;
      if (filters.type && reading.type !== filters.type) return false;
      if (filters.startDate && new Date(reading.reading_date) < new Date(filters.startDate)) return false;
      if (filters.endDate && new Date(reading.reading_date) > new Date(filters.endDate)) return false;
      return true;
    });
  }, [meterReadings, filters]);

  const resetFilters = () => {
    setFilters({
      property_id: '',
      type: '',
      startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    });
  };

  const exportToCSV = () => {
    const headers = ['Дата', 'Об\'єкт', 'Тип лічильника', 'Показник', 'Одиниці', 'Нотатки'];
    const csvData = filteredReadings.map(reading => [
      formatDate(reading.reading_date),
      getPropertyName(reading.property_id),
      getMeterLabel(reading.type).label,
      reading.value,
      getMeterLabel(reading.type).unit,
      reading.notes || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `показники_лічильників_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (loading && meterReadings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={40} />
          <p className="text-gray-500">Завантаження показників лічильників...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Заголовок */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Комунальні послуги</h1>
          <p className="text-gray-500 mt-1">Внесення та аналіз показників лічильників</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <Download size={18} /> Експорт CSV
          </button>
          <button
            onClick={fetchMeterReadings}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all flex items-center gap-2"
            disabled={actionLoading}
          >
            <RefreshCw size={18} className={actionLoading ? 'animate-spin' : ''} />
            Оновити
          </button>
        </div>
      </div>

      {/* Повідомлення про помилки та успіх */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-fade-in">
          <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={20} />
          <div className="flex-1">
            <p className="font-medium text-red-700">Помилка</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 animate-fade-in">
          <CheckCircle className="text-green-500 mt-0.5 shrink-0" size={20} />
          <div className="flex-1">
            <p className="font-medium text-green-700">Успішно!</p>
            <p className="text-green-600 text-sm">{successMessage}</p>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="text-green-400 hover:text-green-600"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Всього показників</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalReadings}</p>
            </div>
            <BarChart3 className="text-blue-500" size={20} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Об'єктів з даними</p>
              <p className="text-xl font-bold text-gray-900">{stats.uniqueProperties}</p>
            </div>
            <Home className="text-green-500" size={20} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Вода</p>
              <p className="text-xl font-bold text-blue-600">{stats.waterReadings}</p>
            </div>
            <Droplets className="text-blue-500" size={20} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Електрика</p>
              <p className="text-xl font-bold text-yellow-600">{stats.electricityReadings}</p>
            </div>
            <Zap className="text-yellow-500" size={20} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Газ</p>
              <p className="text-xl font-bold text-orange-600">{stats.gasReadings}</p>
            </div>
            <Flame className="text-orange-500" size={20} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Без показників</p>
              <p className="text-xl font-bold text-red-600">{stats.overdueProperties}</p>
            </div>
            <AlertCircle className="text-red-500" size={20} />
          </div>
        </div>
      </div>

      {/* Форма для додавання показників */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Plus size={20} />
            Додати нові показники
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Об'єкт нерухомості *
              </label>
              <select
                name="property_id"
                value={newReading.property_id}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">Оберіть об'єкт</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name || property.address}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип лічильника *
              </label>
              <select
                name="type"
                value={newReading.type}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="water">Вода</option>
                <option value="electricity">Електрика</option>
                <option value="gas">Газ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Показник ({getMeterLabel(newReading.type).unit}) *
              </label>
              <input
                type="number"
                name="value"
                value={newReading.value}
                onChange={handleInputChange}
                required
                step="0.001"
                min="0"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="0.000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дата зняття *
              </label>
              <input
                type="date"
                name="reading_date"
                value={newReading.reading_date}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Нотатки (необов'язково)
            </label>
            <input
              type="text"
              name="notes"
              value={newReading.notes}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Додаткові коментарі щодо показання..."
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={actionLoading}
              className="px-8 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Додавання...
                </>
              ) : (
                <>
                  <Plus size={20} />
                  Додати показники
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Фільтри */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Filter size={20} />
            Фільтрація показників
          </h3>
          <button
            onClick={resetFilters}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
          >
            Скинути фільтри
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Об'єкт
            </label>
            <select
              value={filters.property_id}
              onChange={(e) => setFilters(prev => ({ ...prev, property_id: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Всі об'єкти</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.name || property.address}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип лічильника
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Всі типи</option>
              <option value="water">Вода</option>
              <option value="electricity">Електрика</option>
              <option value="gas">Газ</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Початок періоду
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Кінець періоду
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Історія показників */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Історія показників</h3>
            <p className="text-sm text-gray-500 mt-1">
              {filteredReadings.length} записів • 
              {filters.type && ` Тип: ${getMeterLabel(filters.type).label.toLowerCase()}`}
              {filters.property_id && ` • Об'єкт: ${getPropertyName(parseInt(filters.property_id))}`}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              Показано: <span className="font-bold text-gray-900">{filteredReadings.length}</span>
            </div>
          </div>
        </div>

        {filteredReadings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-gray-300" size={24} />
            </div>
            <h4 className="text-lg font-medium text-gray-700 mb-2">Показників не знайдено</h4>
            <p className="text-gray-500 max-w-md mx-auto">
              {filters.property_id || filters.type || filters.startDate || filters.endDate
                ? 'Спробуйте змінити параметри фільтрів'
                : 'Додайте перші показники лічильників'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-800px">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Об'єкт
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Тип
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Показник
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Попередній
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Споживання
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дії
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReadings.map((reading, index) => {
                  const colors = getMeterColor(reading.type);
                  const label = getMeterLabel(reading.type);
                  const propertyName = getPropertyName(reading.property_id);
                  
                  // Знаходимо попередній показник того ж типу для цього об'єкта
                  const previousReading = meterReadings
                    .filter(r => r.property_id === reading.property_id && r.type === reading.type)
                    .sort((a, b) => new Date(b.reading_date) - new Date(a.reading_date))
                    .find(r => new Date(r.reading_date) < new Date(reading.reading_date));
                  
                  const consumption = previousReading 
                    ? reading.value - previousReading.value
                    : null;
                  
                  return (
                    <tr 
                      key={reading.id} 
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="text-gray-400" size={16} />
                          <span className="text-sm font-medium text-gray-900">
                            {formatDate(reading.reading_date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {propertyName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${colors.bg} ${colors.text} border ${colors.border}`}>
                          {getMeterIcon(reading.type)}
                          {label.label}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold text-gray-900">
                            {formatNumber(reading.value)}
                          </span>
                          <span className="text-sm text-gray-500">{label.unit}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {previousReading ? formatNumber(previousReading.value) : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {consumption !== null && consumption >= 0 ? (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="text-green-500" size={16} />
                            <span className="text-sm font-bold text-green-600">
                              +{formatNumber(consumption)}
                            </span>
                            <span className="text-xs text-gray-500">{label.unit}</span>
                          </div>
                        ) : consumption !== null ? (
                          <div className="text-sm text-red-600 font-medium">
                            Некоректні дані
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">—</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedReading(reading);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Видалити"
                            disabled={actionLoading}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Пагінація/інфо */}
        {filteredReadings.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Показано <span className="font-medium">{filteredReadings.length}</span> з <span className="font-medium">{meterReadings.length}</span> записів
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  На початок ↑
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Модальне вікно видалення */}
      {showDeleteModal && selectedReading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Видалити показник</h3>
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedReading(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 rounded-xl ${getMeterColor(selectedReading.type).bg}`}>
                  {getMeterIcon(selectedReading.type)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{getPropertyName(selectedReading.property_id)}</h4>
                  <p className="text-sm text-gray-500">
                    {getMeterLabel(selectedReading.type).label} • 
                    {formatDate(selectedReading.reading_date)}
                  </p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-red-700">Увага: ця дія незворотня</p>
                    <p className="text-red-600 text-sm mt-1">
                      Видалення показника може вплинути на розрахунки споживання
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedReading(null);
                  }}
                  className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  disabled={actionLoading}
                >
                  Скасувати
                </button>
                <button
                  onClick={handleDeleteReading}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Trash2 size={20} />
                  )}
                  Видалити
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Utilities;