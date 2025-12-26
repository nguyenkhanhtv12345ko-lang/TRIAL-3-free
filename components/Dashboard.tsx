
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { FinancialStats, Transaction, TransactionType } from '../types';

interface Props {
  stats: FinancialStats;
  transactions: Transaction[];
}

const Dashboard: React.FC<Props> = ({ stats, transactions }) => {
  // Prepare data for line chart (Trend)
  const chartData = [...transactions]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce((acc: any[], t) => {
      const date = new Date(t.date).toLocaleDateString('vi-VN');
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
    .slice(-10); // Last 10 days with activity

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-sm font-medium">Tiền mặt hiện tại</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.currentCash.toLocaleString()} <span className="text-xs text-slate-400 font-normal">VND</span></p>
          <div className="mt-2 text-xs flex items-center gap-1 text-emerald-500">
             <i className="fas fa-money-bill"></i> Realtime
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-sm font-medium">Trong tài khoản</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.currentBank.toLocaleString()} <span className="text-xs text-slate-400 font-normal">VND</span></p>
          <div className="mt-2 text-xs flex items-center gap-1 text-blue-500">
             <i className="fas fa-university"></i> Banked
          </div>
        </div>

        <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg border border-indigo-700 text-white">
          <p className="text-indigo-100 text-sm font-medium">Tổng tài sản</p>
          <p className="text-2xl font-bold mt-1">{stats.total.toLocaleString()} <span className="text-xs text-indigo-300 font-normal">VND</span></p>
          <div className="mt-2 text-xs flex items-center gap-1 text-yellow-300">
             <i className="fas fa-crown"></i> Net Worth
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-sm font-medium">Khả năng duy trì</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.survivalDays} <span className="text-xs text-slate-400 font-normal">Ngày</span></p>
          <div className="mt-2 text-xs flex items-center gap-1 text-slate-400">
             <i className="fas fa-hourglass-half"></i> Forecast
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Xu hướng dòng tiền</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} name="Thu" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} name="Chi" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Tổng quan kỳ này</h3>
          <div className="space-y-4">
             <div>
                <div className="flex justify-between text-sm mb-1">
                   <span className="text-slate-500">Tổng thu</span>
                   <span className="text-emerald-600 font-bold">{stats.totalIncome.toLocaleString()} đ</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                   <div className="bg-emerald-500 h-full" style={{ width: stats.totalIncome > 0 ? '100%' : '0%' }}></div>
                </div>
             </div>

             <div>
                <div className="flex justify-between text-sm mb-1">
                   <span className="text-slate-500">Tổng chi</span>
                   <span className="text-rose-600 font-bold">{stats.totalExpense.toLocaleString()} đ</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                   <div className="bg-rose-500 h-full" style={{ width: stats.totalIncome > 0 ? `${(stats.totalExpense / stats.totalIncome) * 100}%` : '100%' }}></div>
                </div>
             </div>
             
             <div className="pt-4 border-t border-slate-50">
                <p className="text-xs text-slate-400 text-center italic">"Quản lý dòng tiền tốt là chìa khóa của sự tự do tài chính."</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
