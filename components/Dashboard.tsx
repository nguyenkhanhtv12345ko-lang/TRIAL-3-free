
import React, { useMemo } from 'react';
import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ReferenceLine } from 'recharts';
import { FinancialStats, Transaction, TransactionType, Settings, User, UserRole } from '../types';

interface Props {
  stats: FinancialStats;
  transactions: Transaction[];
  settings: Settings;
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<Props> = ({ stats, transactions, settings, user, onLogout }) => {
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
    return "Sẵn sàng quản lý chi tiêu kỷ luật hôm nay!";
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* KHOẢN NHO NHỎ (TÍCH LŨY) */}
      <div className="p-6 rounded-[32px] bg-[#f0fff4] border border-emerald-100 shadow-sm transition-all duration-500 relative overflow-hidden">
        <div className="flex justify-between items-start z-10 relative">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
              KHOẢN NHO NHỎ (TÍCH LŨY)
            </p>
            <h2 className="text-4xl font-black mt-1 text-emerald-800">
              {formatCurrency(stats.cumulativeSaving)}
            </h2>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-700">
               <i className="fas fa-plus-circle"></i>
               Hôm nay: {formatCurrency(todaySaving)}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-xl text-white shadow-lg shadow-emerald-100">
            <i className="fas fa-piggy-bank"></i>
          </div>
        </div>
        
        <p className="text-[11px] font-bold mt-5 text-emerald-600 leading-relaxed z-10 relative">
          {savingAdvice()}
        </p>
      </div>

      {/* Vốn và tài sản */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100 relative overflow-hidden">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VỐN TIỀN MẶT</p>
          <p className="text-xl font-black text-slate-800 mt-1">{formatCurrency(stats.currentCash)}</p>
        </div>
        
        <div className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100 relative overflow-hidden">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TRONG TÀI KHOẢN</p>
          <p className="text-xl font-black text-slate-800 mt-1">{formatCurrency(stats.currentBank)}</p>
        </div>

        <div className="col-span-2 bg-[#0c1222] p-6 rounded-[32px] shadow-xl text-white relative overflow-hidden">
          <div className="z-10 relative">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">TÀI SẢN RÒNG HIỆN CÓ</p>
            <p className="text-5xl font-black mt-2 tracking-tighter">{formatCurrency(stats.total)}</p>
            <div className="mt-8 flex items-center gap-10">
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">KHẢ NĂNG SINH TỒN</span>
                  <span className="text-lg font-black text-indigo-400">{stats.survivalDays} <span className="text-[10px] text-white/40 uppercase">Ngày</span></span>
               </div>
               <div className="w-[1px] h-8 bg-white/10"></div>
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">CHI HÔM NAY</span>
                  <span className="text-lg font-black text-rose-400">{formatCurrency(stats.todayExpense)}</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phân tích biểu đồ */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">BIỂU ĐỒ CHI TIÊU KỶ LUẬT</h3>
        <div className="h-48 w-full">
          {transactions.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#94a3b8', fontWeight: 800}} dy={10} />
                <YAxis hide domain={[0, 'auto']} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 800 }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Area type="monotone" dataKey="target" fill="#f5f3ff" stroke="none" fillOpacity={0.5} />
                <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={10} />
                <Line type="monotone" dataKey="target" stroke="#818cf8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2 opacity-30">
               <i className="fas fa-chart-line text-2xl"></i>
               <p className="text-[9px] font-black uppercase">Chưa có dữ liệu</p>
            </div>
          )}
        </div>
      </div>

      {/* HỒ SƠ TÀI KHOẢN */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">HỒ SƠ TÀI KHOẢN</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 text-white rounded-[20px] flex items-center justify-center text-xl font-black shadow-lg ${user.role === UserRole.ADMIN ? 'bg-amber-500' : 'bg-indigo-600'}`}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-slate-800">{user.name}</h4>
                {user.role === UserRole.ADMIN && <i className="fas fa-shield-alt text-amber-500 text-[10px]"></i>}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                @{user.username} • <span className={user.role === UserRole.ADMIN ? 'text-amber-500' : 'text-indigo-500'}>{user.role === UserRole.ADMIN ? 'QUẢN TRỊ VIÊN' : 'THÀNH VIÊN'}</span>
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onLogout}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center border border-rose-100 group-hover:bg-rose-500 group-hover:text-white transition-all">
              <i className="fas fa-power-off text-sm"></i>
            </div>
            <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">ĐĂNG XUẤT</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
