import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ title, value, icon, color = 'blue', trend, subtitle, className = "" }) => {
  const themeClasses = {
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
    yellow: "bg-yellow-100 text-yellow-600",
  };

  const bgClass = themeClasses[color] || themeClasses.blue;

  return (
    <div className={`bg-white rounded-2xl shadow-sm p-6 border border-gray-100 transition-all hover:shadow-md ${className}`}>
      <div className="flex justify-between">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-[11px] text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`${bgClass} p-3 rounded-xl h-fit`}>
          {React.cloneElement(icon, { size: 22, strokeWidth: 2.5 })}
        </div>
      </div>

      {trend && (
        <div className="flex items-center mt-4 gap-2">
          <div className={`flex items-center px-1.5 py-0.5 rounded-lg text-[11px] font-bold ${
            trend.value === 0 ? 'bg-gray-100 text-gray-500' : 
            trend.positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {trend.value !== 0 && (trend.positive ? <TrendingUp size={12} className="mr-1"/> : <TrendingDown size={12} className="mr-1"/>)}
            {trend.value === 0 ? 'Без змін' : `${trend.positive ? '+' : '-'}${Math.abs(trend.value)}%`}
          </div>
          <span className="text-[10px] text-gray-400 font-medium">vs мин. місяць</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
