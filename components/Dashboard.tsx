
import React, { useState, useEffect } from 'react';
import { FinancialStats, Transaction, Settings, User } from '../types';
import { storageService } from '../services/storageService';

interface Props {
  stats: FinancialStats;
  transactions: Transaction[];
  settings: Settings;
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<Props> = ({ stats, transactions, settings, user }) => {
  const [marketData, setMarketData] = useState<any>(null);

  useEffect(() => {
    const fetchMarket = async () => {
      const data = await storageService.getLiveMarketData();
      if (data) setMarketData(data);
    };
    fetchMarket();
    const interval = setInterval(fetchMarket, 60000); // Tự động cập nhật giá thị trường mỗi phút
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (val: number) => val.toLocaleString('vi-VN') + 'đ';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Real-time Market Ticker (Online Proof) */}
      <div className="bg-slate-900 text-white p-4 rounded-[28px] shadow-2xl flex items-center gap-6 overflow-hidden border border-white/5">
         <div className="shrink-0 flex items-center gap-2 border-r border-white/10 pr-4">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Live Rates</span>
         </div>
         <div className="flex gap-8 animate-marquee whitespace-nowrap">
            {marketData ? (
              <>
                <div className="flex items-center gap-2">
                   <i className="fab fa-bitcoin text-amber-500"></i>
                   <span className="text-xs font-black">BTC/VND: {formatCurrency(marketData.bitcoin.vnd)}</span>
                </div>
                <div className="flex items-center gap-2">
                   <i className="fab fa-ethereum text-indigo-400"></i>
                   <span className="text-xs font-black">ETH/VND: {formatCurrency(marketData.ethereum.vnd)}</span>
                </div>
                <div className="flex items-center gap-2">
                   <i className="fas fa-coins text-yellow-500"></i>
                   <span className="text-xs font-black">BNB/VND: {formatCurrency(marketData.binancecoin.vnd)}</span>
                </div>
              </>
            ) : (
              <span className="text-[10px] text-slate-500 italic">Đang đồng bộ dữ liệu thị trường toàn cầu...</span>
            )}
         </div>
      </div>

      {/* Main Asset Card */}
      <div className="p-8 rounded-[48px] bg-gradient-to-br from-indigo-600 to-indigo-900 shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
        <div className="relative z-10">
          <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.3em]">Cloud Consolidated Assets</p>
          <h2 className="text-6xl font-black text-white mt-2 tracking-tighter">
            {formatCurrency(stats.total)}
          </h2>
          <div className="mt-8 flex gap-4">
             <div className="flex-1 bg-black/20 backdrop-blur-xl rounded-3xl p-5 border border-white/5">
                <p className="text-[9px] text-indigo-300 font-black uppercase mb-1">Survival Cap</p>
                <p className="text-2xl font-black text-white">{stats.survivalDays} <span className="text-xs opacity-50">Days</span></p>
             </div>
             <div className="flex-1 bg-black/20 backdrop-blur-xl rounded-3xl p-5 border border-white/5">
                <p className="text-[9px] text-emerald-400 font-black uppercase mb-1">Target Savings</p>
                <p className="text-2xl font-black text-emerald-400">Active</p>
             </div>
          </div>
        </div>
      </div>

      {/* Wallet Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-md transition-all">
           <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4"><i className="fas fa-wallet"></i></div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Physical Cash</p>
           <p className="text-xl font-black text-slate-800 mt-1">{formatCurrency(stats.currentCash)}</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-md transition-all">
           <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4"><i className="fas fa-university"></i></div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Bank</p>
           <p className="text-xl font-black text-slate-800 mt-1">{formatCurrency(stats.currentBank)}</p>
        </div>
      </div>

      {/* User Status */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black">{user.name.charAt(0)}</div>
            <div>
               <p className="text-sm font-black text-slate-800">{user.name}</p>
               <p className="text-[10px] text-slate-400 font-mono mt-0.5">@{user.username} • SYNC_AUTO_V5</p>
            </div>
         </div>
         <div className="text-right">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Cloud ID Verified</p>
            <div className="flex gap-1 justify-end">
               {[1,2,3].map(i => <div key={i} className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>)}
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
