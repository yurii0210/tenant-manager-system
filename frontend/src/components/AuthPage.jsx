import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  LogIn,
  ArrowRight,
  KeyRound,
  ChevronLeft
} from 'lucide-react';
import { api } from '../services/api';

export default function AuthPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // login | register | forgot
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const resetMessages = () => {
    setError('');
    setMessage('');
  };

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      let response;

      switch (mode) {
        case 'login':
          response = await api.post('/auth/login', {
            email: formData.email,
            password: formData.password
          });
          break;

        case 'register':
          response = await api.post('/auth/register', {
            name: formData.name,
            email: formData.email,
            password: formData.password
          });
          break;

        case 'forgot':
          await api.post('/auth/forgot-password', {
            email: formData.email
          });
          setMessage('Інструкції з відновлення надіслано на Email');
          setLoading(false);
          return;

        default:
          return;
      }

      const { token, user } = response.data;

      if (token) {
        localStorage.setItem('token', token);
        onLoginSuccess(user);
      }

    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Сталася помилка. Спробуйте ще раз.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
      <div className="w-full max-w-md bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100">

        {/* Back button */}
        {mode !== 'login' && (
          <button
            onClick={() => {
              setMode('login');
              resetMessages();
            }}
            className="flex items-center gap-1 text-slate-400 hover:text-blue-600 mb-4 font-bold text-sm"
          >
            <ChevronLeft size={18} /> Назад
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
            {mode === 'forgot'
              ? <KeyRound size={32} className="text-white" />
              : <LogIn size={32} className="text-white" />
            }
          </div>

          <h2 className="text-3xl font-black text-slate-900">
            {mode === 'login' && 'З поверненням'}
            {mode === 'register' && 'Створити акаунт'}
            {mode === 'forgot' && 'Відновлення доступу'}
          </h2>

          <p className="text-slate-400 text-sm mt-2 font-bold uppercase tracking-widest">
            Realty System
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl font-bold">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-2xl font-bold">
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {mode === 'register' && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ваше імʼя"
                required
                onChange={handleChange('name')}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl font-bold outline-none"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              placeholder="Email"
              required
              onChange={handleChange('email')}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl font-bold outline-none"
            />
          </div>

          {mode !== 'forgot' && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                placeholder="Пароль"
                required
                onChange={handleChange('password')}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl font-bold outline-none"
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="text-xs font-bold text-slate-400 hover:text-blue-600"
              >
                Забули пароль?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-slate-900 text-white rounded-3xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Завантаження...' : (
              <>
                {mode === 'login' && 'Увійти'}
                {mode === 'register' && 'Зареєструватися'}
                {mode === 'forgot' && 'Надіслати'}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-8">
          {mode === 'login' && (
            <button
              onClick={() => setMode('register')}
              className="text-slate-400 text-sm font-bold hover:text-blue-600"
            >
              Немає акаунту? Створити
            </button>
          )}

          {mode === 'register' && (
            <button
              onClick={() => setMode('login')}
              className="text-slate-400 text-sm font-bold hover:text-blue-600"
            >
              Вже є акаунт? Увійти
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
