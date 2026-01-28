import React, { useState } from 'react';
import { User, Mail, Lock, LogIn, ArrowRight, KeyRound, ChevronLeft } from 'lucide-react';

export default function AuthPage({ onLoginSuccess }) {
  // Режими: 'login' (вхід), 'register' (реєстрація), 'forgot' (відновлення)
  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);
    
    let endpoint = '';
    if (authMode === 'login') endpoint = '/api/auth/login';
    else if (authMode === 'register') endpoint = '/api/auth/register';
    else endpoint = '/api/auth/forgot-password';
    
    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Щось пішло не так');
      }

      if (authMode === 'forgot') {
        setMessage('Інструкції з відновлення надіслано на ваш Email');
      } else if (data.token) {
        localStorage.setItem('token', data.token);
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
      <div className="w-full max-w-md bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-500">
        
        {/* Кнопка повернення */}
        {authMode !== 'login' && (
          <button 
            onClick={() => {
              setAuthMode('login');
              setError('');
              setMessage('');
            }}
            className="flex items-center gap-1 text-slate-400 hover:text-blue-600 mb-4 transition-colors font-bold text-sm"
          >
            <ChevronLeft size={18} /> Повернутися до входу
          </button>
        )}

        {/* Заголовок */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-4xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-100">
            {authMode === 'forgot' ? (
              <KeyRound size={32} className="text-white" />
            ) : (
              <LogIn size={32} className="text-white" />
            )}
          </div>
          <h2 className="text-3xl font-[1000] tracking-tighter text-slate-900">
            {authMode === 'login' && 'З поверненням!'}
            {authMode === 'register' && 'Створити профіль'}
            {authMode === 'forgot' && 'Відновлення'}
          </h2>
          <p className="text-slate-400 text-sm mt-2 font-bold uppercase tracking-widest">
            {authMode === 'forgot' ? 'Скидання паролю' : 'Realty System'}
          </p>
        </div>

        {/* Повідомлення про помилки та успіх */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100 font-bold">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-6 p-4 bg-green-50 text-green-600 text-sm rounded-2xl border border-green-100 font-bold">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'register' && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Ваше ім'я" 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 transition-all font-bold"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="email" 
              placeholder="Email" 
              autoComplete="username"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 transition-all font-bold"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          {authMode !== 'forgot' && (
            <>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="password" 
                  placeholder="Пароль" 
                  autoComplete={authMode === 'login' ? "current-password" : "new-password"}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 transition-all font-bold"
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
              
              {authMode === 'login' && (
                <div className="text-right">
                  <button 
                    type="button"
                    onClick={() => setAuthMode('forgot')}
                    className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    Забули пароль?
                  </button>
                </div>
              )}
            </>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-5 bg-slate-900 text-white rounded-3xl font-bold shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {isLoading ? 'Завантаження...' : (
              <>
                {authMode === 'login' && 'Увійти'}
                {authMode === 'register' && 'Зареєструватися'}
                {authMode === 'forgot' && 'Надіслати код'}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-8">
          {authMode === 'login' ? (
            <button 
              onClick={() => setAuthMode('register')} 
              className="text-slate-400 text-sm font-bold hover:text-blue-600 transition-colors"
            >
              Немає профілю? Створити зараз
            </button>
          ) : authMode === 'register' ? (
            <button 
              onClick={() => setAuthMode('login')} 
              className="text-slate-400 text-sm font-bold hover:text-blue-600 transition-colors"
            >
              Вже маєте профіль? Увійти
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}