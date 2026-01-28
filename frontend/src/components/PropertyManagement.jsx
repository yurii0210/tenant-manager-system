import React, { useState, useEffect } from 'react';
import { 
  Plus, MapPin, Trash2, X, 
  History, Calendar, ArrowRight, Home,
  DollarSign, Wallet, TrendingUp, TrendingDown, User
} from 'lucide-react';
import { api } from '../services/api';

const PropertyManagement = () => {
  const [properties, setProperties] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProperty, setNewProperty] = useState({ name: '', address: '', type: 'apartment', status: 'vacant' });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [selectedPropName, setSelectedPropName] = useState('');

  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  
  // ОНОВЛЕНИЙ СТАН: додано payer та description
  const [transaction, setTransaction] = useState({
    type: 'income',
    category: 'rent',
    amount: '',
    payer: '',
    description: ''
  });

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      setProperties(response.data);
    } catch (error) {
      console.error('Помилка завантаження:', error);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/properties', newProperty);
      setIsModalOpen(false);
      setNewProperty({ name: '', address: '', type: 'apartment', status: 'vacant' });
      fetchProperties();
    } catch (error) {
      alert('Помилка при збереженні об\'єкта');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Видалити "${name}"? Це видалить всю історію та транзакції!`)) {
      try {
        await api.delete(`/properties/${id}`);
        fetchProperties();
      } catch (error) {
        alert('Не вдалося видалити об\'єкт');
      }
    }
  };

  const openHistory = async (property) => {
    try {
      const res = await api.get(`/properties/${property.id}/history`);
      setHistoryData(res.data);
      setSelectedPropName(property.name || property.address);
      setIsHistoryOpen(true);
    } catch (err) {
      alert("Архів порожній");
    }
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transactions', {
        ...transaction,
        property_id: selectedPropertyId,
        date: new Date().toISOString().split('T')[0]
      });
      setIsTransModalOpen(false);
      // Очищення полів
      setTransaction({ type: 'income', category: 'rent', amount: '', payer: '', description: '' });
      alert('Транзакцію успішно додано!');
      fetchProperties(); 
    } catch (error) {
      alert('Помилка при збереженні транзакції');
    }
  };

  return (
    <div className="p-6 space-y-8 animate-fade-in bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Управління Нерухомістю</h1>
          <p className="text-gray-500 text-sm font-medium">Об'єкти, орендарі та фінансова історія</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-blue-100 font-bold"
        >
          <Plus size={20} /> Додати Об'єкт
        </button>
      </div>

      {/* PROPERTY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <div key={property.id} className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
                <Home size={28} />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setSelectedPropertyId(property.id);
                    setSelectedPropName(property.name || property.address);
                    setIsTransModalOpen(true);
                  }}
                  className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors border border-green-100"
                >
                  <DollarSign size={18} />
                </button>
                <button 
                  onClick={() => openHistory(property)}
                  className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors border border-amber-100"
                >
                  <History size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(property.id, property.name)}
                  className="p-2.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="space-y-1">
                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 ${
                  property.status === 'occupied' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  {property.status === 'occupied' ? 'Зайнято' : 'Вільно'}
                </span>
                <h3 className="text-xl font-bold text-gray-900 leading-tight">{property.name}</h3>
                <div className="flex items-center gap-1.5 text-gray-400 text-sm font-medium">
                  <MapPin size={14} className="text-blue-300" /> {property.address}
                </div>
            </div>

            <div className="mt-6 pt-5 border-t border-gray-50 flex justify-between items-center text-xs">
                <div className="flex flex-col">
                    <span className="text-gray-400 font-bold uppercase tracking-tighter">Тип</span>
                    <span className="text-gray-700 font-bold">{property.type === 'apartment' ? 'Квартира' : 'Комерція'}</span>
                </div>
                <div className="text-right">
                    <span className="text-gray-400 font-bold uppercase tracking-tighter">Транзакцій</span>
                    <span className="block text-gray-700 font-bold">{property.transaction_count || 0} шт.</span>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- МОДАЛКА: ФІНАНСИ --- */}
      {isTransModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-60 p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900 italic">Фінансовий Запис</h2>
                <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest">{selectedPropName}</p>
              </div>
              <button onClick={() => setIsTransModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleTransactionSubmit} className="space-y-4">
              <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl">
                <button 
                  type="button"
                  onClick={() => setTransaction({...transaction, type: 'income', category: 'rent'})}
                  className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2 ${transaction.type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400'}`}
                >
                  <TrendingUp size={16} /> Дохід
                </button>
                <button 
                  type="button"
                  onClick={() => setTransaction({...transaction, type: 'expense', category: 'repair'})}
                  className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2 ${transaction.type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400'}`}
                >
                  <TrendingDown size={16} /> Витрата
                </button>
              </div>

              {/* ПОЛЕ: ВІД КОГО / КОМУ */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                  {transaction.type === 'income' ? 'Від кого (Орендар)' : 'Кому (Отримувач)'}
                </label>
                <div className="relative mt-1">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="text"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder={transaction.type === 'income' ? "Ім'я платника" : "Назва сервісу/майстра"}
                    value={transaction.payer}
                    onChange={(e) => setTransaction({...transaction, payer: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Сума (грн)</label>
                  <input 
                    type="number"
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl mt-1 outline-none font-black text-lg text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="0.00"
                    value={transaction.amount}
                    onChange={(e) => setTransaction({...transaction, amount: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Категорія</label>
                  <select 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl mt-1 outline-none font-bold text-gray-700"
                    value={transaction.category}
                    onChange={(e) => setTransaction({...transaction, category: e.target.value})}
                  >
                    {transaction.type === 'income' ? (
                      <>
                        <option value="rent">Оренда</option>
                        <option value="deposit">Застава</option>
                        <option value="other">Інше</option>
                      </>
                    ) : (
                      <>
                        <option value="repair">Ремонт</option>
                        <option value="utilities">Комунальні</option>
                        <option value="tax">Податки</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Коментар</label>
                <input 
                  type="text"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl mt-1 outline-none font-medium text-gray-600 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Додаткові деталі..."
                  value={transaction.description}
                  onChange={(e) => setTransaction({...transaction, description: e.target.value})}
                />
              </div>

              <button type="submit" className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2 mt-2">
                <Wallet size={20} /> Зберегти
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- МОДАЛКА: ДОДАТИ ОБ'ЄКТ --- (залишена без змін) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-900">Нова Нерухомість</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase ml-1">Назва</label>
                <input 
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl mt-1 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
                  placeholder="напр. Кв. на Печерську"
                  value={newProperty.name}
                  onChange={(e) => setNewProperty({...newProperty, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase ml-1">Адреса</label>
                <input 
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl mt-1 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
                  placeholder="Вул. Соборна, 12"
                  value={newProperty.address}
                  onChange={(e) => setNewProperty({...newProperty, address: e.target.value})}
                  required
                />
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-lg font-bold transition-all">
                Створити Об'єкт
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- МОДАЛКА: АРХІВ --- (залишена без змін) */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
            <div className="px-8 py-6 border-b flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="font-black text-gray-900 text-xl italic uppercase">Архів Оренд</h2>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{selectedPropName}</p>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto bg-white">
              <div className="space-y-6">
                {historyData.length > 0 ? (
                  historyData.map((h, i) => (
                    <div key={i} className="relative pl-8 border-l-2 border-blue-100 last:border-0 pb-6">
                      <div className="absolute -left-2.25 top-0 w-4 h-4 bg-white border-4 border-blue-500 rounded-full"></div>
                      <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100">
                        <div className="flex justify-between items-start mb-3">
                          <p className="font-black text-gray-900 uppercase text-sm">{h.tenant_name}</p>
                          <span className="text-xs font-black text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                            {Number(h.rent_amount).toLocaleString()} ₴
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                          <span>{new Date(h.start_date).toLocaleDateString()}</span>
                          <ArrowRight size={12} />
                          <span>{h.end_date ? new Date(h.end_date).toLocaleDateString() : 'Понині'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <History className="text-gray-200 mx-auto mb-4" size={64} />
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Немає історії</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t flex justify-center">
                <button onClick={() => setIsHistoryOpen(false)} className="px-10 py-3 bg-white border border-gray-200 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest hover:bg-gray-100 transition-all">
                  Закрити
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyManagement;