import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, ShieldCheck, BarChart3, Users, Building2 } from 'lucide-react';

export default function LandingPage({ onStart }) {
  return (
    <div className="bg-white">
      <Helmet>
        <title>Tenant Manager — Головна</title>
      </Helmet>

      {/* Навігація */}
      <nav className="flex justify-between items-center px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-black text-2xl tracking-tighter">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">T</div>
          <span>TENANT<span className="text-blue-600">MANAGER</span></span>
        </div>
        <button onClick={onStart} className="px-6 py-2.5 bg-slate-900 text-white rounded-full font-bold hover:bg-blue-600 transition-all shadow-md">
          Увійти
        </button>
      </nav>

      {/* Hero Section */}
      <header className="px-6 py-16 md:py-28 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1 text-center md:text-left">
          <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-bold mb-6">
            ✨ Керування нерухомістю нового покоління
          </span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight mb-8 text-slate-900">
            Ваш бізнес <br />в одному <span className="text-blue-600">застосунку</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium mb-10 max-w-xl">
            Повний контроль над об'єктами, орендарями та платежами. Більше ніяких Excel-таблиць та паперової тяганини.
          </p>
          <button onClick={onStart} className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:scale-105 transition-transform flex items-center justify-center gap-3">
            Спробувати безкоштовно <ArrowRight />
          </button>
        </div>
        <div className="flex-1 w-full bg-slate-100 aspect-square md:aspect-video rounded-[3rem] border-12px border-white shadow-2xl flex items-center justify-center text-slate-300 relative overflow-hidden">
            <Building2 size={120} className="opacity-20 text-blue-600" />
            <div className="absolute bottom-6 right-6 bg-white p-4 rounded-2xl shadow-lg border border-slate-50 animate-bounce">
                <span className="text-green-500 font-bold">+$2,450</span> Отримано сьогодні
            </div>
        </div>
      </header>
    </div>
  );
}
