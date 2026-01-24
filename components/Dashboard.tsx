
import React, { useMemo } from 'react';
import { 
  ComposedChart, Area, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, Line, PieChart, Pie, Cell, BarChart 
} from 'recharts';
import { FinancialStats, Transaction, TransactionType, Settings, User } from '../types';

interface Props {
  stats: FinancialStats;
  transactions: Transaction[];
  settings: Settings;
  user: User;
  onLogout: () => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const uniqueItems: any[] = [];
    const seenNames = new Set();
    payload.forEach((item: any) => {
      if (!seenNames.has(item.name)) {
        seenNames.add(item.name);
        uniqueItems.push(item);
      }
    });

    return (
      <div className="bg-white/95 backdrop-blur-md p-3 border border-slate-100 rounded-[20px] shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in duration-200 min-w-[130px]">
        <p className="text-[10px] font-black text-slate-900 mb-1 border-b border-slate-50 pb-1 uppercase tracking-widest">{label}</p>
        <div className="space-y-2">
          {uniqueItems.map((entry: any, index: number) => {
            const isTarget = entry.name === 'target';
            const isExpense = entry.name === 'expense';
            return (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: isTarget ? '#4f46e5' : isExpense ? '#f43f5e' : entry.color || entry.fill }}></div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    {isTarget ? 'HẠN MỨC' : isExpense ? 'CHI' : 'GIÁ TRỊ'}
                  </span>
                </div>
                <span className="text-[9px] font-black text-slate-900">
                  {entry.value.toLocaleString('vi-VN')}đ
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<Props> = ({ stats, transactions, settings }) => {
  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days.map(date => {
      const dayTransactions = transactions.filter(t => t.date === date);
      const expense = dayTransactions.filter(t => t.type === TransactionType.EXPENSE && !t.isExcluded && !t.isFromSavings).reduce((sum, t) => sum + t.amount, 0);
      const income = dayTransactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = dayTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
      return { 
        date: date.split('-').slice(1).reverse().join('/'), 
        expense, income, totalExpense, target: settings.dailyCost 
      };
    });
  }, [transactions, settings.dailyCost]);

  const assetData = [{ name: 'Mặt', value: stats.currentCash }, { name: 'Bank', value: stats.currentBank }].filter(d => d.value > 0);
  const PIE_COLORS = ['#6366f1', '#10b981'];
  const formatCurrency = (val: number) => val.toLocaleString('vi-VN') + 'đ';
  
  // Mục tiêu Khoản nho nhỏ là 30 ngày hạn mức
  const targetSavingsPool = settings.dailyCost * 30 || 1000000;
  const fillPercentage = Math.min(100, Math.max(0, (stats.cumulativeSaving / targetSavingsPool) * 100));

  return (
    <div className="space-y-4 animate-in fade-in duration-700">
      {/* KHOẢN NHO NHỎ TANK - LIQUID UI */}
      <div className="relative overflow-hidden rounded-[32px] border border-white shadow-lg bg-white ring-1 ring-slate-100">
        <div 
          className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-indigo-500/20 to-indigo-500/40 transition-all duration-[2000ms] ease-out" 
          style={{ height: `${fillPercentage}%` }}
        >
          <div className="absolute top-0 left-0 w-[200%] h-8 -translate-y-1/2 opacity-30 animate-wave-slow fill-indigo-500">
            <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0 10 C 20 15 40 5 60 10 C 80 15 100 5 120 10 V 20 H 0 Z" />
            </svg>
          </div>
        </div>
        <div className="relative z-10 p-5 flex flex-col justify-between min-h-[120px]">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-600/60">Khoản nho nhỏ</p>
              <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Dự trữ khả dụng</span>
            </div>
            <div className="px-3 py-1.5 rounded-2xl bg-indigo-600 text-white text-[9px] font-black shadow-lg shadow-indigo-200 ring-2 ring-white">
              {fillPercentage.toFixed(1)}%
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 drop-shadow-sm">{formatCurrency(stats.cumulativeSaving)}</h2>
            <div className="w-full bg-slate-100/50 h-1 rounded-full mt-2 overflow-hidden border border-white/20">
              <div className="h-full bg-indigo-500/50" style={{ width: `${fillPercentage}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-50 p-4 rounded-[28px] flex flex-col items-center shadow-sm">
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-2 w-full text-center">Cơ cấu tài sản</p>
          <div className="h-20 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={assetData} innerRadius={18} outerRadius={30} paddingAngle={5} dataKey="value">
                  {assetData.map((_, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} strokeWidth={2} stroke="#fff" />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-1 mt-1 w-full px-1">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div><span className="text-[6px] text-slate-500 font-black uppercase">Mặt</span></div>
               <span className="text-[7px] font-black text-slate-800">{formatCurrency(stats.currentCash)}</span>
             </div>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div><span className="text-[6px] text-slate-500 font-black uppercase">Bank</span></div>
               <span className="text-[7px] font-black text-slate-800">{formatCurrency(stats.currentBank)}</span>
             </div>
          </div>
        </div>

        <div className="bg-white border border-slate-50 p-4 rounded-[28px] flex flex-col justify-center shadow-sm">
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Tổng</p>
          <p className="text-sm font-black text-slate-900 tracking-tight text-center leading-none">{formatCurrency(stats.total)}</p>
          <div className="w-full bg-slate-50 h-2 rounded-full mt-3 overflow-hidden border border-slate-100 shadow-inner">
             <div className="h-full bg-indigo-500" style={{ width: `${(stats.currentCash/stats.total)*100 || 0}%` }}></div>
          </div>
          <div className="mt-3 space-y-1.5">
             <div className="flex justify-between items-center border-b border-slate-50 pb-1">
                <span className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Tiền mặt:</span>
                <span className="text-[8px] font-black text-indigo-600">{formatCurrency(stats.currentCash)}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Tài khoản:</span>
                <span className="text-[8px] font-black text-emerald-600">{formatCurrency(stats.currentBank)}</span>
             </div>
          </div>
        </div>

        <div className="col-span-2 bg-slate-900 p-5 rounded-[32px] shadow-xl relative overflow-hidden ring-1 ring-white/5">
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
           <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em]">Tài sản tổng</p>
           <h3 className="text-3xl font-black text-white tracking-tighter my-2">{formatCurrency(stats.total)}</h3>
           <div className="flex justify-between border-t border-white/5 pt-4 mt-2">
              <div>
                <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest">Sống sót</p>
                <p className="text-base font-black text-indigo-400 leading-none">{stats.survivalDays} <span className="text-[7px] font-bold">Ngày 💀</span></p>
              </div>
              <div className="text-right">
                <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest">Chi tiêu hôm nay</p>
                <p className="text-base font-black text-rose-400 leading-none">{formatCurrency(stats.todayExpense)}</p>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-white border border-slate-50 p-4 rounded-[28px] shadow-sm">
        <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4">Biến động 7 ngày</h3>
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -35, bottom: 0 }}>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip cursor={{fill: '#f8fafc', radius: 4}} content={<CustomTooltip />} />
              <Bar dataKey="income" name="income" fill="#10b981" radius={[3, 3, 0, 0]} barSize={8} />
              <Bar dataKey="totalExpense" name="totalExpense" fill="#f43f5e" radius={[3, 3, 0, 0]} barSize={8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-2">
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-emerald-500"></div><span className="text-[7px] text-slate-500 font-black uppercase">Thu Nhập</span></div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-rose-500"></div><span className="text-[7px] text-slate-500 font-black uppercase">Tổng Chi</span></div>
        </div>
      </div>

      <div className="bg-white border border-slate-50 p-4 rounded-[28px] shadow-sm">
        <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4">Kỷ luật mục tiêu</h3>
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 0, right: 0, left: -35, bottom: 0 }}>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip cursor={{ stroke: '#f1f5f9', strokeWidth: 1 }} content={<CustomTooltip />} isAnimationActive={false} />
              <Area type="monotone" dataKey="target" name="target" fill="rgba(79, 70, 229, 0.03)" stroke="none" />
              <Bar dataKey="expense" name="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={10} />
              <Line type="monotone" dataKey="target" name="target" stroke="#4f46e5" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-8 mt-4">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-rose-500 shadow-sm"></div>
             <span className="text-[8px] font-black text-slate-500 uppercase">CHI</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-5 h-0.5 bg-indigo-600 rounded-full"></div>
             <span className="text-[8px] font-black text-slate-500 uppercase">HẠN MỨC</span>
           </div>
        </div>
      </div>
      
      <style>{`
        @keyframes wave { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } 
        .animate-wave-slow { animation: wave 10s linear infinite; }
      `}</style>
    </div>
  );
};

export default Dashboard;
