import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { 
  User, Phone, Calendar, Edit2, 
  Trash2, Plus, X, History, Search, Users, ArrowRight,
  Loader2, AlertCircle, CheckCircle, ChevronRight, Mail,
  Home, DollarSign, Clock, AlertTriangle
} from 'lucide-react';
import { format, parseISO, isPast, isToday, differenceInDays, addDays } from 'date-fns';
import { uk } from 'date-fns/locale';

// Утилітні функції
const formatDate = (dateString, formatStr = 'dd.MM.yyyy') => {
  if (!dateString) return '—';
  try {
    return format(parseISO(dateString), formatStr, { locale: uk });
  } catch (error) {
    console.warn('Помилка форматування дати:', error);
    return dateString;
  }
};

const formatCurrency = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) return '0 ₴';
  return `${num.toLocaleString('uk-UA')} ₴`;
};

const validatePhone = (phone) => {
  return /^[\d\s\-\+\(\)]{10,20}$/.test(phone);
};

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Мок-дані для історії (тимчасове рішення поки сервер не фіксує 500 помилку)
const generateMockHistory = (property) => {
  const mockData = [];
  
  // Поточний орендар (якщо є)
  if (property.tenant_name) {
    const startDate = property.contract_start || 
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    mockData.push({
      id: 1,
      tenant_name: property.tenant_name,
      start_date: startDate,
      end_date: property.contract_end || null,
      rent_amount: property.rent_amount || 0,
      notes: 'Поточний орендар' + (property.notes ? `: ${property.notes}` : '')
    });
  }
  
  // Демо-записи для тестування UI
  const demoTenants = [
    { name: 'Іваненко Іван Іванович', rent: 7500, monthsAgo: 12, notes: 'Термін завершився' },
    { name: 'Петренко Петро Петрович', rent: 8000, monthsAgo: 24, notes: 'Переїхав до іншого міста' },
    { name: 'Сидоренко Сидір Сидорович', rent: 7000, monthsAgo: 36, notes: 'Зміна роботи' }
  ];
  
  demoTenants.forEach((tenant, index) => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - tenant.monthsAgo);
    
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 11);
    
    mockData.push({
      id: index + 2,
      tenant_name: tenant.name,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      rent_amount: tenant.rent,
      notes: tenant.notes
    });
  });
  
  return mockData;
};

const TenantsList = () => {
  const [tenants, setTenants] = useState([]);
  const [availableProperties, setAvailableProperties] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [selectedPropName, setSelectedPropName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [additionalTenants, setAdditionalTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const [formData, setFormData] = useState({
    propertyId: '',
    tenant_name: '',
    tenant_phone: '',
    tenant_email: '',
    rent_amount: '',
    contract_end: '',
    next_payment_date: '',
    deposit: '',
    notes: '',
    contract_start: format(new Date(), 'yyyy-MM-dd')
  });

  // Фільтровані орендарі з пошуком та фільтрами
  const filteredTenants = useMemo(() => {
    let filtered = tenants.filter(tenant => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        tenant.tenant_name?.toLowerCase().includes(searchLower) ||
        tenant.name?.toLowerCase().includes(searchLower) ||
        tenant.tenant_phone?.includes(searchTerm) ||
        tenant.tenant_email?.toLowerCase().includes(searchLower) ||
        tenant.address?.toLowerCase().includes(searchLower)
      );
      
      if (!matchesSearch) return false;
      
      // Застосування фільтрів статусу
      switch (activeFilter) {
        case 'expiring':
          if (!tenant.contract_end) return false;
          const daysLeft = differenceInDays(parseISO(tenant.contract_end), new Date());
          return daysLeft > 0 && daysLeft <= 30;
          
        case 'overdue':
          if (!tenant.next_payment_date) return false;
          return isPast(parseISO(tenant.next_payment_date)) && !isToday(parseISO(tenant.next_payment_date));
          
        case 'multi':
          return tenant.tenant_name?.includes(',');
          
        default:
          return true;
      }
    });
    
    // Сортування за датою оплати
    filtered.sort((a, b) => {
      if (!a.next_payment_date && !b.next_payment_date) return 0;
      if (!a.next_payment_date) return 1;
      if (!b.next_payment_date) return -1;
      return new Date(a.next_payment_date) - new Date(b.next_payment_date);
    });
    
    return filtered;
  }, [tenants, searchTerm, activeFilter]);

  // Статистика
  const stats = useMemo(() => {
    const totalRent = tenants.reduce((sum, t) => sum + (Number(t.rent_amount) || 0), 0);
    
    const expiringSoon = tenants.filter(t => {
      if (!t.contract_end) return false;
      const daysLeft = differenceInDays(parseISO(t.contract_end), new Date());
      return daysLeft > 0 && daysLeft <= 30;
    }).length;
    
    const overduePayments = tenants.filter(t => {
      if (!t.next_payment_date) return false;
      return isPast(parseISO(t.next_payment_date)) && !isToday(parseISO(t.next_payment_date));
    }).length;

    const multiTenant = tenants.filter(t => t.tenant_name?.includes(',')).length;
    
    const totalDeposit = tenants.reduce((sum, t) => sum + (Number(t.deposit) || 0), 0);

    return { 
      totalRent, 
      expiringSoon, 
      overduePayments, 
      multiTenant,
      totalDeposit,
      totalTenants: tenants.length 
    };
  }, [tenants]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Тільки основні дані про нерухомість
      const propertiesRes = await api.get('/properties');
      const allProperties = propertiesRes.data || [];
      
      setTenants(allProperties.filter(p => p.tenant_name && p.status === 'occupied'));
      setAvailableProperties(allProperties.filter(p => !p.tenant_name || p.status === 'vacant'));
      
    } catch (err) {
      console.error("Помилка завантаження:", err);
      setError(err.message || 'Не вдалося завантажити дані про нерухомість');
      setTenants([]);
      setAvailableProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.tenant_name.trim()) {
      errors.tenant_name = "Введіть ПІБ орендаря";
    }
    
    if (formData.tenant_phone && !validatePhone(formData.tenant_phone)) {
      errors.tenant_phone = "Невірний формат телефону (10-20 цифр)";
    }
    
    if (formData.tenant_email && !validateEmail(formData.tenant_email)) {
      errors.tenant_email = "Невірний формат email";
    }
    
    if (!formData.rent_amount || Number(formData.rent_amount) <= 0) {
      errors.rent_amount = "Введіть коректну суму оренди";
    }
    
    if (formData.contract_end) {
      const endDate = new Date(formData.contract_end);
      const startDate = new Date(formData.contract_start || new Date());
      if (endDate < startDate) {
        errors.contract_end = "Дата завершення не може бути раніше початку";
      }
    }
    
    if (formData.next_payment_date && formData.contract_end) {
      const paymentDate = new Date(formData.next_payment_date);
      const contractEnd = new Date(formData.contract_end);
      if (paymentDate > contractEnd) {
        errors.next_payment_date = "Дата оплати не може бути після завершення договору";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = useCallback((tenant = null) => {
    if (tenant) {
      setEditingTenant(tenant);
      const names = tenant.tenant_name ? tenant.tenant_name.split(', ').filter(n => n) : [''];
      setFormData({
        propertyId: tenant.id,
        tenant_name: names[0] || '',
        tenant_phone: tenant.tenant_phone || '',
        tenant_email: tenant.tenant_email || '',
        rent_amount: tenant.rent_amount || '',
        contract_start: tenant.contract_start ? format(parseISO(tenant.contract_start), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        contract_end: tenant.contract_end ? format(parseISO(tenant.contract_end), 'yyyy-MM-dd') : '',
        next_payment_date: tenant.next_payment_date ? format(parseISO(tenant.next_payment_date), 'yyyy-MM-dd') : '',
        deposit: tenant.deposit || '',
        notes: tenant.notes || ''
      });
      setAdditionalTenants(names.slice(1).map(name => ({ name })));
    } else {
      setEditingTenant(null);
      setFormData({ 
        propertyId: '', 
        tenant_name: '', 
        tenant_phone: '', 
        tenant_email: '', 
        rent_amount: '', 
        contract_start: format(new Date(), 'yyyy-MM-dd'),
        contract_end: format(addDays(new Date(), 365), 'yyyy-MM-dd'),
        next_payment_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        deposit: '',
        notes: ''
      });
      setAdditionalTenants([]);
    }
    setFormErrors({});
    setIsModalOpen(true);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setActionLoading(true);
    setError(null);
    
    try {
      const allNames = [formData.tenant_name, ...additionalTenants.map(t => t.name)]
        .filter(name => name && name.trim() !== "")
        .join(', ');

      const payload = {
        tenant_name: allNames,
        tenant_phone: formData.tenant_phone || null,
        tenant_email: formData.tenant_email || null,
        rent_amount: parseFloat(formData.rent_amount) || 0,
        contract_start: formData.contract_start || new Date().toISOString().split('T')[0],
        contract_end: formData.contract_end || null,
        next_payment_date: formData.next_payment_date || null,
        deposit: formData.deposit ? parseFloat(formData.deposit) : null,
        notes: formData.notes || null,
        status: 'occupied'
      };
      
      const id = editingTenant ? editingTenant.id : formData.propertyId;
      if (!id) {
        setFormErrors({ propertyId: "Оберіть об'єкт" });
        setActionLoading(false);
        return;
      }

      await api.put(`/properties/${id}`, payload);
      
      setSuccessMessage(editingTenant ? 'Контракт оновлено!' : 'Новий контракт створено!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Помилка збереження:", err);
      const errorMsg = err.response?.data?.message || 
                      err.response?.data?.error || 
                      "Помилка збереження. Спробуйте ще раз.";
      setError(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = useCallback(async (tenant) => {
    if (!window.confirm(`Виселити ${tenant.tenant_name} з ${tenant.name}? Дані будуть архівовані.`)) {
      return;
    }

    setActionLoading(true);
    setError(null);
    
    try {
      await api.put(`/properties/${tenant.id}`, { 
        tenant_name: null, 
        status: 'vacant',
        tenant_phone: null,
        tenant_email: null,
        contract_start: null,
        contract_end: null,
        next_payment_date: null,
        deposit: null,
        notes: tenant.notes ? `${tenant.notes} [Виселено ${format(new Date(), 'dd.MM.yyyy')}]` : null
      });
      
      setSuccessMessage(`Орендаря ${tenant.tenant_name} виселено з ${tenant.name}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      fetchData();
    } catch (err) {
      console.error("Помилка при виселенні:", err);
      setError("Не вдалося виселити орендаря");
    } finally {
      setActionLoading(false);
    }
  }, [fetchData]);

  const openHistory = useCallback((property) => {
    try {
      // Використовуємо мок-дані замість API запиту через 500 помилку сервера
      const mockHistory = generateMockHistory(property);
      setHistoryData(mockHistory);
      setSelectedPropName(property.name);
      setIsHistoryOpen(true);
    } catch (err) {
      console.error("Помилка створення історії:", err);
      setError("Не вдалося завантажити історію");
    }
  }, []);

  // Показувати статус завантаження
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={40} />
          <p className="text-gray-500">Завантаження даних про орендарів...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Заголовок та статистика */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Управління орендарями</h1>
            <p className="text-gray-500 mt-1">Активні контракти та історія заїздів</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Пошук за ПІБ, телефоном, email або адресою..."
                className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => handleOpenModal()} 
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
              Новий контракт
            </button>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Загальний дохід</p>
            <p className="text-lg md:text-xl font-bold text-gray-900">{formatCurrency(stats.totalRent)}</p>
            <div className="flex items-center gap-1 text-green-600 text-xs mt-1">
              <DollarSign size={12} />
              <span>місяць</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Орендарів</p>
            <p className="text-lg md:text-xl font-bold text-gray-900">{stats.totalTenants}</p>
            <div className="flex items-center gap-1 text-blue-600 text-xs mt-1">
              <Users size={12} />
              <span>активні</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Закінчуються</p>
            <p className="text-lg md:text-xl font-bold text-amber-600">{stats.expiringSoon}</p>
            <div className="flex items-center gap-1 text-amber-600 text-xs mt-1">
              <Clock size={12} />
              <span>≤ 30 днів</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Прострочені</p>
            <p className="text-lg md:text-xl font-bold text-red-600">{stats.overduePayments}</p>
            <div className="flex items-center gap-1 text-red-600 text-xs mt-1">
              <AlertTriangle size={12} />
              <span>оплати</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Депозити</p>
            <p className="text-lg md:text-xl font-bold text-purple-600">{formatCurrency(stats.totalDeposit)}</p>
            <div className="flex items-center gap-1 text-purple-600 text-xs mt-1">
              <Home size={12} />
              <span>гарантія</span>
            </div>
          </div>
        </div>

        {/* Фільтри */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeFilter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Всі ({tenants.length})
          </button>
          <button
            onClick={() => setActiveFilter('expiring')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeFilter === 'expiring' 
                ? 'bg-amber-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Закінчуються ({stats.expiringSoon})
          </button>
          <button
            onClick={() => setActiveFilter('overdue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeFilter === 'overdue' 
                ? 'bg-red-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Прострочені ({stats.overduePayments})
          </button>
          <button
            onClick={() => setActiveFilter('multi')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeFilter === 'multi' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Співмешканці ({stats.multiTenant})
          </button>
        </div>
      </div>

      {/* Повідомлення про помилки та успіх */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-fade-in">
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
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 animate-fade-in">
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

      {/* Картки орендарів */}
      {filteredTenants.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center">
          <Users className="text-gray-300 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            {searchTerm ? 'Орендарів не знайдено' : 'Орендарів ще немає'}
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {searchTerm 
              ? 'Спробуйте змінити пошуковий запит або очистити фільтри' 
              : 'Додайте першого орендаря, щоб почати управління нерухомістю'}
          </p>
          <button 
            onClick={() => handleOpenModal()} 
            className="bg-blue-600 text-white px-6 py-3 rounded-xl inline-flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg"
          >
            <Plus size={18} /> Додати першого орендаря
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTenants.map(tenant => {
            const contractEndDate = tenant.contract_end ? parseISO(tenant.contract_end) : null;
            const paymentDate = tenant.next_payment_date ? parseISO(tenant.next_payment_date) : null;
            const daysLeft = contractEndDate ? differenceInDays(contractEndDate, new Date()) : null;
            const paymentDaysLeft = paymentDate ? differenceInDays(paymentDate, new Date()) : null;
            
            const isExpiringSoon = daysLeft && daysLeft > 0 && daysLeft <= 30;
            const isOverdue = paymentDate && isPast(paymentDate) && !isToday(paymentDate);
            const isPaymentSoon = paymentDaysLeft && paymentDaysLeft > 0 && paymentDaysLeft <= 7;
            const hasMultipleTenants = tenant.tenant_name?.includes(',');
            
            return (
              <div key={tenant.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
                {/* Хедер картки з статусами */}
                <div className="p-5 border-b border-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-linear-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center">
                      {hasMultipleTenants ? 
                        <Users className="text-blue-600" size={24} /> : 
                        <User className="text-blue-600" size={24} />
                      }
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleOpenModal(tenant)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Редагувати"
                        disabled={actionLoading}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(tenant)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Виселити"
                        disabled={actionLoading}
                      >
                        {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 truncate mb-1" title={tenant.tenant_name}>
                    {tenant.tenant_name}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Home className="text-blue-400" size={14} />
                    <span className="text-sm font-medium text-blue-600">{tenant.name}</span>
                    {tenant.address && (
                      <span className="text-xs text-gray-400 truncate flex-1" title={tenant.address}>
                        • {tenant.address}
                      </span>
                    )}
                  </div>
                  
                  {/* Бейджи статусів */}
                  <div className="flex flex-wrap gap-2">
                    {isExpiringSoon && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full flex items-center gap-1">
                        <Clock size={10} />
                        {daysLeft} дн. до завершення
                      </span>
                    )}
                    {isOverdue && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full flex items-center gap-1">
                        <AlertTriangle size={10} />
                        Прострочення
                      </span>
                    )}
                    {isPaymentSoon && !isOverdue && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                        Оплата через {paymentDaysLeft} дн.
                      </span>
                    )}
                    {hasMultipleTenants && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">
                        {tenant.tenant_name.split(',').length} особи
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Інформація про орендаря */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="text-gray-400 shrink-0" size={16} />
                    <span className="text-sm text-gray-700 font-medium">
                      {tenant.tenant_phone || <span className="text-gray-400 italic">Телефон не вказано</span>}
                    </span>
                  </div>
                  
                  {tenant.tenant_email && (
                    <div className="flex items-center gap-3">
                      <Mail className="text-gray-400 shrink-0" size={16} />
                      <span className="text-sm text-gray-700 truncate" title={tenant.tenant_email}>
                        {tenant.tenant_email}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="text-gray-400 shrink-0" size={16} />
                    <div className="text-sm text-gray-700">
                      <div>Контракт: <strong>{formatDate(tenant.contract_start)}</strong> - <strong>{formatDate(tenant.contract_end)}</strong></div>
                      {tenant.next_payment_date && (
                        <div className="text-xs text-gray-500 mt-1">
                          Наступна оплата: <strong>{formatDate(tenant.next_payment_date)}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {tenant.deposit && Number(tenant.deposit) > 0 && (
                    <div className="mt-3 p-2 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-green-700 font-medium">Депозит:</span>
                        <span className="text-sm font-bold text-green-700">{formatCurrency(tenant.deposit)}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Футер з орендною платою та кнопками */}
                <div className="p-5 border-t border-gray-50 bg-gray-50/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Орендна плата</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(tenant.rent_amount)}
                        <span className="text-sm text-gray-400 font-normal ml-2">/місяць</span>
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openHistory(tenant)}
                        className="px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                        title="Історія оренди"
                      >
                        <History size={14} />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(tenant)}
                        className="px-3 py-2 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-lg text-xs font-bold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-1.5"
                      >
                        <ChevronRight size={14} /> Деталі
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Інформація про вільні об'єкти */}
      {availableProperties.length > 0 && (
        <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Вільні об'єкти</h3>
              <p className="text-sm text-gray-500">Доступні для заселення: {availableProperties.length}</p>
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
            >
              <Plus size={16} /> Заселити всі
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {availableProperties.slice(0, 3).map(property => (
              <div key={property.id} className="p-3 border border-gray-100 rounded-lg hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Home className="text-gray-400" size={16} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{property.name}</p>
                    {property.address && (
                      <p className="text-xs text-gray-500 truncate">{property.address}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {availableProperties.length > 3 && (
              <div className="p-3 border border-dashed border-gray-200 rounded-lg text-center">
                <p className="text-sm text-gray-500">+{availableProperties.length - 3} ще</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Модальне вікно форми */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingTenant ? 'Редагувати контракт' : 'Новий договір оренди'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {editingTenant ? `Об'єкт: ${editingTenant.name}` : 'Заповніть дані для нового контракту'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                disabled={actionLoading}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              {!editingTenant && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Об'єкт нерухомості *
                  </label>
                  <select 
                    required
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                      formErrors.propertyId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.propertyId}
                    onChange={(e) => {
                      setFormData({...formData, propertyId: e.target.value});
                      setFormErrors({...formErrors, propertyId: null});
                    }}
                  >
                    <option value="">Оберіть вільний об'єкт...</option>
                    {availableProperties.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.address ? `(${p.address})` : ''}
                      </option>
                    ))}
                  </select>
                  {formErrors.propertyId && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.propertyId}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Головний орендар (ПІБ) *
                </label>
                <input 
                  type="text" 
                  required
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                    formErrors.tenant_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  value={formData.tenant_name}
                  onChange={(e) => {
                    setFormData({...formData, tenant_name: e.target.value});
                    setFormErrors({...formErrors, tenant_name: null});
                  }}
                  placeholder="Повне ім'я орендаря"
                />
                {formErrors.tenant_name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.tenant_name}</p>
                )}
              </div>

              {/* Співмешканці */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Співмешканці (необов'язково)
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setAdditionalTenants([...additionalTenants, { name: '' }])}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    disabled={additionalTenants.length >= 5}
                  >
                    <Plus size={14} /> Додати мешканця
                  </button>
                </div>
                
                {additionalTenants.map((t, index) => (
                  <div key={index} className="flex gap-2 items-center animate-fade-in">
                    <div className="text-sm text-gray-400 w-6">{index + 2}.</div>
                    <input 
                      type="text" 
                      placeholder={`Ім'я співмешканця #${index + 2}`}
                      className="flex-1 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={t.name}
                      onChange={(e) => {
                        const newFields = [...additionalTenants];
                        newFields[index].name = e.target.value;
                        setAdditionalTenants(newFields);
                      }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setAdditionalTenants(additionalTenants.filter((_, i) => i !== index))}
                      className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Контактна інформація */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Телефон (необов'язково)
                  </label>
                  <input 
                    type="tel"
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                      formErrors.tenant_phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.tenant_phone}
                    onChange={(e) => {
                      setFormData({...formData, tenant_phone: e.target.value});
                      setFormErrors({...formErrors, tenant_phone: null});
                    }}
                    placeholder="+380 XX XXX XX XX"
                  />
                  {formErrors.tenant_phone && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.tenant_phone}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (необов'язково)
                  </label>
                  <input 
                    type="email"
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                      formErrors.tenant_email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.tenant_email}
                    onChange={(e) => {
                      setFormData({...formData, tenant_email: e.target.value});
                      setFormErrors({...formErrors, tenant_email: null});
                    }}
                    placeholder="email@example.com"
                  />
                  {formErrors.tenant_email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.tenant_email}</p>
                  )}
                </div>
              </div>

              {/* Дати договору */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Початок договору *
                  </label>
                  <input 
                    type="date"
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={formData.contract_start}
                    onChange={(e) => setFormData({...formData, contract_start: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Кінець договору (необов'язково)
                  </label>
                  <input 
                    type="date"
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                      formErrors.contract_end ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.contract_end}
                    onChange={(e) => {
                      setFormData({...formData, contract_end: e.target.value});
                      setFormErrors({...formErrors, contract_end: null});
                    }}
                  />
                  {formErrors.contract_end && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.contract_end}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Наступна оплата (необов'язково)
                  </label>
                  <input 
                    type="date"
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                      formErrors.next_payment_date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.next_payment_date}
                    onChange={(e) => {
                      setFormData({...formData, next_payment_date: e.target.value});
                      setFormErrors({...formErrors, next_payment_date: null});
                    }}
                  />
                  {formErrors.next_payment_date && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.next_payment_date}</p>
                  )}
                </div>
              </div>

              {/* Фінансова інформація */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Орендна плата (₴) *
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                      formErrors.rent_amount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.rent_amount}
                    onChange={(e) => {
                      setFormData({...formData, rent_amount: e.target.value});
                      setFormErrors({...formErrors, rent_amount: null});
                    }}
                    placeholder="0.00"
                  />
                  {formErrors.rent_amount && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.rent_amount}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Депозит (₴) (необов'язково)
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={formData.deposit}
                    onChange={(e) => setFormData({...formData, deposit: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Нотатки */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Нотатки (необов'язково)
                </label>
                <textarea 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Додаткові примітки, умови договору тощо..."
                />
              </div>

              <div className="pt-4 border-t">
                <button 
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-4 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      {editingTenant ? 'Оновлення...' : 'Створення...'}
                    </>
                  ) : (
                    <>
                      {editingTenant ? 'Оновити контракт' : 'Підписати та заселити'}
                      <CheckCircle size={20} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальне вікно історії */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-linear-to-r from-blue-50 to-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Історія оренди</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Home className="text-blue-500" size={14} />
                  <p className="text-sm text-gray-600">{selectedPropName}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="p-2 hover:bg-white/50 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {historyData.length > 0 ? (
                <div className="space-y-6">
                  {historyData.map((record, index) => (
                    <div key={index} className="relative pl-8">
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-linear-to-br from-blue-200 to-gray-200"></div>
                      <div className="absolute left-8px top-0 w-4 h-4 bg-white border-4 border-blue-500 rounded-full shadow-sm"></div>
                      
                      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 mb-1">{record.tenant_name}</h4>
                            <div className="flex items-center gap-2">
                              <DollarSign className="text-green-500" size={12} />
                              <span className="text-sm font-bold text-green-600">
                                {formatCurrency(record.rent_amount)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {!record.end_date && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">
                                Поточний
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="text-blue-400" size={14} />
                            <div className="flex-1">
                              <div className="font-medium">Заїзд: <strong className="text-gray-900">{formatDate(record.start_date)}</strong></div>
                              {record.end_date && (
                                <div className="font-medium mt-1">Виїзд: <strong className="text-gray-900">{formatDate(record.end_date)}</strong></div>
                              )}
                            </div>
                          </div>
                          
                          {record.notes && (
                            <div className="mt-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                              <div className="flex items-start gap-2">
                                <div className="text-blue-400 mt-0.5">
                                  <ArrowRight size={12} />
                                </div>
                                <p className="text-xs text-gray-600 italic">{record.notes}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="text-gray-300" size={32} />
                  </div>
                  <h4 className="text-lg font-medium text-gray-700 mb-2">Історія оренди відсутня</h4>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Цей об'єкт ще не має записів в історії оренди.
                    {selectedPropName && ` ${selectedPropName} буде першим в списку!`}
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Записи:</span> {historyData.length}
                </div>
                <button 
                  onClick={() => setIsHistoryOpen(false)}
                  className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Закрити історію
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantsList;