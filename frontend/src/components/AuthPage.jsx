import React, { useState } from 'react';
import { User, Mail, Lock, LogIn, ArrowRight } from 'lucide-react';

export default function AuthPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // login / register / reset
  const [formData, setFormData] = useState({ email: '', password: '', password2: '', name: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      let endpoint = '';
      let body = {};

      if (mode === 'login') {
        endpoint = '/api/auth/login';
        body = { email: formData.email, password: formData.password };
      } else if (mode === 'register') {
        if (formData.password !== formData.password2) {
          setError('Паролі не збігаються!');
          return;
        }
        endpoint = '/api/auth/register';
        body = { email: formData.email, password: formData.password, name: formData.name };
      } else if (mode === 'reset') {
        if (!formData.email) {
          setError('Введіть email для відновлення пароля');
          return;
        }
        endpoint = '/api/auth/reset-password';
        body = { email: formData.email };
      }

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Сталася помилка. Спробуйте ще раз.');
      }

      if (mode === 'login' && data.token) {
        localStorage.setItem('token', data.token);
        onLoginSuccess(data.user);
      }

      if (mode === 'reset') {
        setSuccessMsg('Інструкції для відновлення пароля відправлено на вашу пошту.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
      <div className="w-full max-w-md bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-500">
        {/* Заголовок */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-4xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-100">
            <LogIn size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-[1000] tracking-tighter text-slate-900">
            {mode === 'login' && 'Вхід у систему'}
            {mode === 'register' && 'Реєстрація'}
            {mode === 'reset' && 'Відновлення пароля'}
          </h2>
          <p className="text-slate-400 text-sm mt-2 font-bold uppercase tracking-widest">
            Система управління нерухомістю
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100 font-bold">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-2xl border border-green-100 font-bold">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Ім'я"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 transition-all font-bold"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'reset') && (
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="email"
                placeholder="Електронна пошта"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 transition-all font-bold"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="password"
                placeholder="Пароль"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 transition-all font-bold"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          )}

          {mode === 'register' && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="password"
                placeholder="Повторіть пароль"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 transition-all font-bold"
                value={formData.password2}
                onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-5 bg-slate-900 text-white rounded-3xl font-bold shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {mode === 'login' && 'Увійти'}
            {mode === 'register' && 'Зареєструватися'}
            {mode === 'reset' && 'Відновити пароль'}
            <ArrowRight size={20} />
          </button>
        </form>

        <div className="text-center mt-6 space-y-2">
          {mode === 'login' && (
            <>
              <button
                onClick={() => setMode('register')}
                className="text-slate-400 text-sm font-bold hover:text-blue-600 transition-colors block"
              >
                Немає акаунту? Зареєструватися
              </button>
              <button
                onClick={() => setMode('reset')}
                className="text-slate-400 text-sm font-bold hover:text-blue-600 transition-colors block"
              >
                Забули пароль?
              </button>
            </>
          )}

          {mode === 'register' && (
            <button
              onClick={() => setMode('login')}
              className="text-slate-400 text-sm font-bold hover:text-blue-600 transition-colors block"
            >
              Вже є акаунт? Увійти
            </button>
          )}

          {mode === 'reset' && (
            <button
              onClick={() => setMode('login')}
              className="text-slate-400 text-sm font-bold hover:text-blue-600 transition-colors block"
            >
              Повернутись до входу
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
