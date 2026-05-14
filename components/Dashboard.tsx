
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
      <div className="bg-tech-800/95 backdrop-blur-md p-5 border border-tech-border rounded-xl shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in duration-200 min-w-[200px]">
        <p className="text-[17px] font-black text-white mb-3 border-b border-tech-border/50 pb-2 uppercase tracking-widest">{label}</p>
        <div className="space-y-3">
          {uniqueItems.map((entry: any, index: number) => {
            const isTarget = entry.name === 'target';
            const isExpense = entry.name === 'expense';
            return (
              <div key={index} className="flex items-center justify-between gap-5">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: isTarget ? '#4f46e5' : isExpense ? '#f43f5e' : entry.color || entry.fill }}></div>
                  <span className="text-[13px] font-black text-tech-muted/80 uppercase tracking-widest">
                    {isTarget ? 'HẠN MỨC' : isExpense ? 'CHI' : 'GIÁ TRỊ'}
                  </span>
                </div>
                <span className="text-[16px] font-black text-white">
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
  
  const targetSavingsPool = settings.dailyCost * 30 || 1000000;
  const fillPercentage = Math.min(100, Math.max(0, (stats.cumulativeSaving / targetSavingsPool) * 100));

  return (
    <div className="space-y-7 animate-in fade-in duration-700">
      {/* TANK SECTION */}
      <div className="relative overflow-hidden rounded-2xl border border-white shadow-xl bg-tech-800 ring-1 ring-slate-100">
        <div 
          className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-indigo-500/25 to-indigo-500/45 transition-all duration-[2500ms] ease-out" 
          style={{ height: `${fillPercentage}%` }}
        >
          <div className="absolute top-0 left-0 w-[200%] h-12 -translate-y-1/2 opacity-30 animate-wave-slow fill-indigo-500">
            <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0 10 C 20 15 40 5 60 10 C 80 15 100 5 120 10 V 20 H 0 Z" />
            </svg>
          </div>
        </div>
        <div className="relative z-10 p-8 flex flex-col justify-between min-h-[180px]">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <p className="text-[16px] font-black uppercase tracking-[0.2em] text-indigo-700/70">Khoản nho nhỏ</p>
              <span className="text-[12px] font-bold text-tech-muted/80 uppercase tracking-widest mt-1">Dự trữ khả dụng</span>
            </div>
            <div className="px-5 py-3 rounded-[20px] bg-tech-cyan text-tech-900 text-[16px] font-black shadow-xl shadow-indigo-200 ring-2 ring-white">
              {fillPercentage.toFixed(1)}%
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-[52px] font-black tracking-tighter text-white drop-shadow-sm leading-none">{formatCurrency(stats.cumulativeSaving)}</h2>
            <div className="w-full bg-tech-700/50 h-2.5 rounded-full mt-5 overflow-hidden border border-white/20">
              <div className="h-full bg-tech-cyan" style={{ width: `${fillPercentage}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* ASSET PIE */}
        <div className="bg-tech-800 border border-tech-border/50 p-6 rounded-2xl flex flex-col items-center shadow-sm">
          <p className="text-[12px] font-black text-tech-muted/80 uppercase tracking-widest mb-4 w-full text-center">Cơ cấu tài sản</p>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={assetData} innerRadius={28} outerRadius={48} paddingAngle={6} dataKey="value">
                  {assetData.map((_, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} strokeWidth={3} stroke="#fff" />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-3 mt-4 w-full px-3">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-tech-cyan"></div><span className="text-[11px] text-tech-muted font-black uppercase">Mặt</span></div>
               <span className="text-[12px] font-black text-white">{formatCurrency(stats.currentCash)}</span>
             </div>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500/100"></div><span className="text-[11px] text-tech-muted font-black uppercase">Bank</span></div>
               <span className="text-[12px] font-black text-white">{formatCurrency(stats.currentBank)}</span>
             </div>
          </div>
        </div>

        {/* TOTAL CARD */}
        <div className="bg-tech-800 border border-tech-border/50 p-6 rounded-2xl flex flex-col justify-center shadow-sm">
          <p className="text-[12px] font-black text-tech-muted/80 uppercase tracking-widest mb-3 text-center">Tổng cộng</p>
          <p className="text-[24px] font-black text-white tracking-tight text-center leading-none">{formatCurrency(stats.total)}</p>
          <div className="w-full bg-tech-900 h-3.5 rounded-full mt-6 overflow-hidden border border-tech-border shadow-inner">
             <div className="h-full bg-tech-cyan" style={{ width: `${(stats.currentCash/stats.total)*100 || 0}%` }}></div>
          </div>
          <div className="mt-6 space-y-3">
             <div className="flex justify-between items-center border-b border-tech-border/50 pb-2">
                <span className="text-[11px] font-black text-tech-muted/80 uppercase tracking-widest">Tiền mặt:</span>
                <span className="text-[13px] font-black text-tech-cyan">{formatCurrency(stats.currentCash)}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-[11px] font-black text-tech-muted/80 uppercase tracking-widest">Tài khoản:</span>
                <span className="text-[13px] font-black text-emerald-600">{formatCurrency(stats.currentBank)}</span>
             </div>
          </div>
        </div>

        {/* TOTAL ASSETS DARK CARD */}
        <div className="col-span-2 bg-tech-900 p-8 rounded-2xl shadow-2xl relative overflow-hidden ring-1 ring-white/10">
           <div className="absolute top-0 right-0 w-48 h-48 bg-tech-cyan text-tech-900/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
           <p className="text-[12px] font-black text-tech-muted uppercase tracking-[0.2em]">Tài sản tổng</p>
           <h3 className="text-[50px] font-black text-white tracking-tighter my-4 leading-tight">{formatCurrency(stats.total)}</h3>
           <div className="flex justify-between border-t border-white/5 pt-7 mt-4">
              <div>
                <p className="text-[11px] font-black text-tech-muted uppercase tracking-widest">Khả năng sống sót</p>
                <p className="text-[27px] font-black text-tech-cyan leading-none">{stats.survivalDays} <span className="text-[12px] font-bold">Ngày 💀</span></p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-black text-tech-muted uppercase tracking-widest">Chi tiêu hôm nay</p>
                <p className="text-[27px] font-black text-rose-400 leading-none">{formatCurrency(stats.todayExpense)}</p>
              </div>
           </div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="bg-tech-800 border border-tech-border/50 p-6 rounded-2xl shadow-sm">
        <h3 className="text-[14px] font-black text-tech-muted/80 uppercase tracking-widest mb-7">Biến động 7 ngày</h3>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip cursor={{fill: '#f8fafc', radius: 8}} content={<CustomTooltip />} />
              <Bar dataKey="income" name="income" fill="#10b981" radius={[6, 6, 0, 0]} barSize={14} />
              <Bar dataKey="totalExpense" name="totalExpense" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-10 mt-5">
           <div className="flex items-center gap-3"><div className="w-3.5 h-3.5 rounded-md bg-emerald-500/100"></div><span className="text-[12px] text-tech-muted font-black uppercase">Thu Nhập</span></div>
           <div className="flex items-center gap-3"><div className="w-3.5 h-3.5 rounded-md bg-rose-500/100"></div><span className="text-[12px] text-tech-muted font-black uppercase">Tổng Chi</span></div>
        </div>
      </div>

      <div className="bg-tech-800 border border-tech-border/50 p-6 rounded-2xl shadow-sm">
        <h3 className="text-[14px] font-black text-tech-muted/80 uppercase tracking-widest mb-7">Kỷ luật mục tiêu</h3>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }} content={<CustomTooltip />} isAnimationActive={false} />
              <Area type="monotone" dataKey="target" name="target" fill="rgba(79, 70, 229, 0.04)" stroke="none" />
              <Bar dataKey="expense" name="expense" fill="#f43f5e" radius={[7, 7, 0, 0]} barSize={18} />
              <Line type="monotone" dataKey="target" name="target" stroke="#4f46e5" strokeWidth={3} strokeDasharray="6 6" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-12 mt-7">
           <div className="flex items-center gap-4">
             <div className="w-4 h-4 rounded-full bg-rose-500/100 shadow-md"></div>
             <span className="text-[13px] font-black text-tech-muted uppercase">CHI</span>
           </div>
           <div className="flex items-center gap-4">
             <div className="w-8 h-1 bg-tech-cyan text-tech-900 rounded-full"></div>
             <span className="text-[13px] font-black text-tech-muted uppercase">HẠN MỨC</span>
           </div>
        </div>
      </div>
      
      <style>{`
        @keyframes wave { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } 
        .animate-wave-slow { animation: wave 12s linear infinite; }
      `}</style>
    </div>
  );
};

export default Dashboard;
