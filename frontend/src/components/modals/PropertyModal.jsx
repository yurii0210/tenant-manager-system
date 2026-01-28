import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

const PropertyModal = ({ isOpen, onClose, onSave, property }) => {
  const [formData, setFormData] = useState({
    address: '',
    tenant_name: '',
    rent_amount: '',
    contract_end: ''
  });
  const [errors, setErrors] = useState({});

  // Блокування прокрутки body при відкритті модалки
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Закриття на Escape
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    if (property) {
      setFormData({
        address: property.address || '',
        tenant_name: property.tenant_name || '',
        rent_amount: property.rent_amount || '',
        contract_end: property.contract_end ? property.contract_end.split('T')[0] : ''
      });
    } else {
      setFormData({
        address: '',
        tenant_name: '',
        rent_amount: '',
        contract_end: ''
      });
    }
    setErrors({});
  }, [property, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.address.trim()) newErrors.address = 'Адреса обов\'язкова';
    if (!formData.rent_amount || parseFloat(formData.rent_amount) <= 0) {
      newErrors.rent_amount = 'Введіть коректну суму оренди';
    }
    if (!formData.contract_end) newErrors.contract_end = 'Дата закінчення обов\'язкова';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    onSave({
      ...formData,
      rent_amount: parseFloat(formData.rent_amount)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      {/* Анімований Overlay */}
      <div
        className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-50 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg mx-auto bg-white rounded-2xl shadow-2xl transform transition-all animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {property ? 'Редагувати об\'єкт' : 'Додати новий об\'єкт'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Адреса <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                  errors.address ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Вулиця, будинок, місто"
              />
              {errors.address && (
                <p className="mt-1.5 text-xs font-medium text-red-500">{errors.address}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Ім'я орендаря
              </label>
              <input
                type="text"
                name="tenant_name"
                value={formData.tenant_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="ПІБ орендаря"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Орендна плата <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="rent_amount"
                    value={formData.rent_amount}
                    onChange={handleChange}
                    step="0.01"
                    className={`w-full border rounded-xl pl-4 pr-8 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      errors.rent_amount ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₴</span>
                </div>
                {errors.rent_amount && (
                  <p className="mt-1.5 text-xs font-medium text-red-500">{errors.rent_amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Кінець договору <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="contract_end"
                  value={formData.contract_end}
                  onChange={handleChange}
                  className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.contract_end ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.contract_end && (
                  <p className="mt-1.5 text-xs font-medium text-red-500">{errors.contract_end}</p>
                )}
              </div>
            </div>

            <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Скасувати
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 active:transform active:scale-95 transition-all"
              >
                {property ? 'Зберегти зміни' : 'Додати об\'єкт'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PropertyModal;