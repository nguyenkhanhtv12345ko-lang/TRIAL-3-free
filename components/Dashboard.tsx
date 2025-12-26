
import React, { useMemo } from 'react';
import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ReferenceLine } from 'recharts';
import { FinancialStats, Transaction, TransactionType, Settings } from '../types';

interface Props {
  stats: FinancialStats;
  transactions: Transaction[];
  settings: Settings;
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
      const expense = dayTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);
      const income = dayTransactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        date: date.split('-').slice(1).reverse().join('/'),
        expense,
        income,
        target: settings.dailyCost,
        saving: settings.dailyCost - expense
      };
    });
  }, [transactions, settings.dailyCost]);

  const formatCurrency = (val: number) => val.toLocaleString('vi-VN') + 'đ';

  const todaySaving = settings.dailyCost - stats.todayExpense;

  const savingAdvice = () => {
    if (settings.dailyCost === 0) return "Hãy thiết lập mục tiêu chi tiêu mỗi ngày!";
    if (stats.cumulativeSaving > 0) return "Bạn đang quản lý kỷ luật cực tốt! Tổng tích lũy vẫn dương. 🚀";
    if (stats.cumulativeSaving === 0) return "Hết ngân sách tích lũy! Đừng tiêu thêm nhé. ⚖️";
    return "NGUY HIỂM: Bạn đang chi vượt hạn mức cộng dồn. Cần thắt chặt chi tiêu! 🛑";
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* KHOẢN NHO NHỎ CARD */}
      <div className={`p-6 rounded-3xl shadow-lg border-2 transition-all duration-500 relative overflow-hidden ${
        stats.cumulativeSaving >= 0 
          ? 'bg-emerald-50 border-emerald-200' 
          : 'bg-rose-50 border-rose-300 animate-[shake_0.5s_ease-in-out_infinite]'
      }`}>
        <div className="flex justify-between items-start z-10 relative">
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${stats.cumulativeSaving >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              Khoản Nho Nhỏ (Tích lũy)
            </p>
            <h2 className={`text-3xl font-black mt-1 ${stats.cumulativeSaving >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {stats.cumulativeSaving > 0 ? '+' : ''}{formatCurrency(stats.cumulativeSaving)}
            </h2>
            <div className={`mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border ${
              todaySaving >= 0 
                ? 'bg-emerald-500 text-white border-transparent' 
                : 'bg-rose-500 text-white border-transparent'
            }`}>
               <i className={`fas ${todaySaving >= 0 ? 'fa-plus-circle' : 'fa-minus-circle'}`}></i>
               Hôm nay: {todaySaving > 0 ? '+' : ''}{formatCurrency(todaySaving)}
            </div>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg ${
            stats.cumulativeSaving >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
          }`}>
            <i className={`fas ${stats.cumulativeSaving >= 0 ? 'fa-piggy-bank' : 'fa-triangle-exclamation'}`}></i>
          </div>
        </div>
        
        <p className={`text-[11px] font-bold mt-5 leading-relaxed z-10 relative ${stats.cumulativeSaving >= 0 ? 'text-emerald-600/80' : 'text-rose-600/80'}`}>
          {savingAdvice()}
        </p>
        
        <i className={`fas ${stats.cumulativeSaving >= 0 ? 'fa-chart-area' : 'fa-fire'} absolute -right-4 -bottom-4 text-8xl opacity-5`}></i>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden flex flex-col justify-center min-h-[100px]">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest z-10">Vốn Tiền mặt</p>
          <p className="text-xl font-black text-slate-800 mt-1 z-10">{formatCurrency(stats.currentCash)}</p>
          <i className="fas fa-wallet absolute -right-3 -bottom-3 text-5xl text-slate-50 opacity-40 transform rotate-12"></i>
        </div>
        
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden flex flex-col justify-center min-h-[100px]">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest z-10">Trong Tài khoản</p>
          <p className="text-xl font-black text-slate-800 mt-1 z-10">{formatCurrency(stats.currentBank)}</p>
          <i className="fas fa-credit-card absolute -right-3 -bottom-3 text-5xl text-slate-50 opacity-40 transform -rotate-12"></i>
        </div>

        <div className="col-span-2 bg-slate-900 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
          <div className="z-10 relative">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Tài sản ròng hiện có</p>
            <p className="text-4xl font-black mt-1 tracking-tighter">{formatCurrency(stats.total)}</p>
            <div className="mt-5 flex items-center gap-6">
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-500 uppercase">Khả năng Sinh tồn</span>
                  <span className="text-lg font-black text-indigo-400">{stats.survivalDays} <span className="text-[10px] text-white/40">Ngày</span></span>
               </div>
               <div className="w-[1px] h-8 bg-white/10"></div>
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-500 uppercase">Chi hôm nay</span>
                  <span className="text-lg font-black text-rose-400">{formatCurrency(stats.todayExpense)}</span>
               </div>
            </div>
          </div>
          <i className="fas fa-gem absolute -right-6 -bottom-6 text-[120px] text-white/5 pointer-events-none"></i>
        </div>
      </div>

      {/* Biểu đồ Kỷ luật */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <i className="fas fa-chart-line text-indigo-500"></i> Kỷ luật 7 ngày
          </h3>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Chi</span>
             </div>
             <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-200"></span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Hạn mức</span>
             </div>
          </div>
        </div>
        <div className="h-56 w-full">
          {transactions.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 700}} dy={10} />
                <YAxis hide domain={[0, 'auto']} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 700 }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Area type="monotone" dataKey="target" fill="#f5f3ff" stroke="none" fillOpacity={1} />
                <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} />
                <Line type="monotone" dataKey="target" stroke="#818cf8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <ReferenceLine y={0} stroke="#000" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
               <i className="fas fa-chart-bar text-3xl opacity-20"></i>
               <p className="text-[10px] font-bold uppercase tracking-widest">Chưa có dữ liệu kỷ luật</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
