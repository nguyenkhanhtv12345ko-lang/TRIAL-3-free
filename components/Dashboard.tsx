
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FinancialStats, Transaction, TransactionType } from '../types';

interface Props {
  stats: FinancialStats;
  transactions: Transaction[];
}

const Dashboard: React.FC<Props> = ({ stats, transactions }) => {
  const chartData = useMemo(() => {
    const data = [...transactions]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .reduce((acc: any[], t) => {
        const date = new Date(t.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        const existing = acc.find(item => item.date === date);
        if (existing) {
          if (t.type === TransactionType.INCOME) existing.income += t.amount;
          else existing.expense += t.amount;
        } else {
          acc.push({ 
            date, 
            income: t.type === TransactionType.INCOME ? t.amount : 0, 
            expense: t.type === TransactionType.EXPENSE ? t.amount : 0 
          });
        }
        return acc;
      }, [])
      .slice(-7);
    return data;
  }, [transactions]);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiền mặt</p>
            <p className="text-xl font-black text-slate-800 mt-1">{stats.currentCash.toLocaleString()}</p>
          </div>
          <i className="fas fa-money-bill-wave absolute -right-2 -bottom-2 text-5xl text-emerald-50 opacity-50 transform rotate-12"></i>
          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 self-start px-2 py-0.5 rounded-full">Khả dụng</span>
        </div>
        
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tài khoản</p>
            <p className="text-xl font-black text-slate-800 mt-1">{stats.currentBank.toLocaleString()}</p>
          </div>
          <i className="fas fa-university absolute -right-2 -bottom-2 text-5xl text-blue-50 opacity-50 transform -rotate-12"></i>
          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 self-start px-2 py-0.5 rounded-full">An toàn</span>
        </div>

        <div className="col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-3xl shadow-xl shadow-indigo-100 text-white relative overflow-hidden h-40 flex flex-col justify-center">
          <div className="z-10">
            <p className="text-indigo-100 text-[11px] font-black uppercase tracking-widest opacity-80">Tổng tài sản ròng</p>
            <p className="text-4xl font-black mt-2 tracking-tighter">{stats.total.toLocaleString()} <span className="text-sm font-medium opacity-60">đ</span></p>
            <div className="mt-4 flex items-center gap-4">
               <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-indigo-200">SINH TỒN</span>
                  <span className="text-lg font-black">{stats.survivalDays} <span className="text-[10px] font-normal">Ngày</span></span>
               </div>
               <div className="w-[1px] h-8 bg-white/20"></div>
               <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-indigo-200">SỨC KHỎE VỐN</span>
                  <span className="text-lg font-black">{stats.totalIncome > stats.totalExpense ? 'TỐT' : 'CẢNH BÁO'}</span>
               </div>
            </div>
          </div>
          <i className="fas fa-chart-line absolute -right-6 top-0 text-[140px] text-white/5 pointer-events-none"></i>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-widest flex items-center gap-2">
          <i className="fas fa-wave-square text-indigo-500"></i> Dòng tiền 7 ngày
        </h3>
        <div className="h-48 w-full">
          {transactions.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 700}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorInc)" strokeWidth={3} name="Thu" />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExp)" strokeWidth={3} name="Chi" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
               <i className="fas fa-chart-bar text-3xl opacity-20"></i>
               <p className="text-[10px] font-bold uppercase tracking-widest">Chưa đủ dữ liệu biểu đồ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const useMemo = React.useMemo;

export default Dashboard;
