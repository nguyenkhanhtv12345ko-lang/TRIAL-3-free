
import React, { useMemo } from 'react';
import { 
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Line, PieChart, Pie, Cell, BarChart, Legend 
} from 'recharts';
import { FinancialStats, Transaction, TransactionType, Settings, User } from '../types';

interface Props {
  stats: FinancialStats;
  transactions: Transaction[];
  settings: Settings;
  user: User;
  onLogout: () => void;
}

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
        expense, 
        income,
        totalExpense,
        target: settings.dailyCost 
      };
    });
  }, [transactions, settings.dailyCost]);

  const assetData = [
    { name: 'Tiền mặt', value: stats.currentCash },
    { name: 'Tài khoản', value: stats.currentBank }
  ].filter(d => d.value > 0);

  const PIE_COLORS = ['#4f46e5', '#10b981'];

  const formatCurrency = (val: number) => val.toLocaleString('vi-VN') + 'đ';
  const targetSavingsPool = settings.dailyCost * 30 || 1000000;
  const fillPercentage = Math.min(100, Math.max(0, (stats.cumulativeSaving / targetSavingsPool) * 100));

  return (
    <div className="space-y-4 animate-in fade-in duration-700">
      {/* TANK LIGHT MODE */}
      <div className="relative group overflow-hidden rounded-[32px] border border-slate-100 shadow-lg bg-white">
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-indigo-500/10 via-indigo-400/5 to-transparent transition-all duration-[2000ms]" style={{ height: `${fillPercentage}%` }}>
          <div className="absolute top-0 left-0 w-[200%] h-8 -translate-y-[80%] opacity-20 animate-wave-slow fill-indigo-500"><svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full"><path d="M0 10 C 20 15 40 5 60 10 C 80 15 100 5 120 10 V 20 H 0 Z" /></svg></div>
        </div>
        <div className="relative z-10 p-5 flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">QUỸ TÍCH LŨY</p>
            <div className="px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 text-[9px] font-black">{fillPercentage.toFixed(1)}%</div>
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-slate-800">{formatCurrency(stats.cumulativeSaving)}</h2>
            <p className="text-[7px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Tài sản tích lũy cho tương lai</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Biểu đồ cơ cấu tài sản */}
        <div className="bg-white border border-slate-100 p-4 rounded-3xl flex flex-col items-center shadow-sm">
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-2 w-full">Cơ cấu tài sản</p>
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={assetData} innerRadius={20} outerRadius={35} paddingAngle={5} dataKey="value">
                  {assetData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '8px', fontSize: '8px' }} formatter={(v: any) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-2 mt-1">
             <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div><span className="text-[6px] text-slate-400 font-bold uppercase">Tiền mặt</span></div>
             <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div><span className="text-[6px] text-slate-400 font-bold uppercase">Bank</span></div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-3xl flex flex-col justify-center shadow-sm">
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Dư nợ hiện tại</p>
          <p className="text-sm font-black text-slate-800 tracking-tighter">{formatCurrency(stats.total)}</p>
          <div className="w-full bg-slate-50 h-1.5 rounded-full mt-2 overflow-hidden border border-slate-100">
             <div className="h-full bg-indigo-500 shadow-sm" style={{ width: `${(stats.currentCash/stats.total)*100 || 0}%` }}></div>
          </div>
          <p className="text-[6px] text-slate-400 mt-1 uppercase font-black tracking-tight">Cash: {Math.round((stats.currentCash/stats.total)*100 || 0)}%</p>
        </div>

        <div className="col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-[32px] shadow-2xl relative overflow-hidden">
           <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
           <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">TÀI SẢN RÒNG</p>
           <h3 className="text-3xl font-black text-white tracking-tighter my-2">{formatCurrency(stats.total)}</h3>
           <div className="flex justify-between border-t border-white/5 pt-4">
              <div><p className="text-[7px] font-black text-slate-400 uppercase">Dự kiến sống</p><p className="text-sm font-black text-indigo-400">{stats.survivalDays} <span className="text-[7px] font-bold">Ngày</span></p></div>
              <div className="text-right"><p className="text-[7px] font-black text-slate-400 uppercase">Chi hôm nay</p><p className="text-sm font-black text-rose-400">{formatCurrency(stats.todayExpense)}</p></div>
           </div>
        </div>
      </div>

      {/* Biểu đồ xu hướng */}
      <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
        <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4">XU HƯỚNG THU / CHI</h3>
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', fontSize: '9px' }} />
              <Bar dataKey="income" fill="#10b981" radius={[2, 2, 0, 0]} barSize={6} />
              <Bar dataKey="totalExpense" fill="#f43f5e" radius={[2, 2, 0, 0]} barSize={6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-2">
           <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-500"></div><span className="text-[7px] text-slate-400 font-black uppercase">Thu</span></div>
           <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-rose-500"></div><span className="text-[7px] text-slate-400 font-black uppercase">Chi</span></div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
        <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4">KỶ LUẬT CHI TIÊU HÀNG NGÀY</h3>
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', fontSize: '9px' }} />
              <Area type="monotone" dataKey="target" fill="rgba(79, 70, 229, 0.05)" stroke="none" />
              <Bar dataKey="expense" fill="#f43f5e" radius={[3, 3, 0, 0]} barSize={8} />
              <Line type="monotone" dataKey="target" stroke="#4f46e5" strokeWidth={1} strokeDasharray="3 3" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      <style>{`@keyframes wave { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-wave-slow { animation: wave 8s linear infinite; }`}</style>
    </div>
  );
};

export default Dashboard;
