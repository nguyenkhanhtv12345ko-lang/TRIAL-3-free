
import React, { useMemo, useState, useEffect } from 'react';
import { FinancialStats, Transaction, TransactionType, Settings, User, UserRole } from '../types';
import { storageService } from '../services/storageService';
import CloudSyncModal from './CloudSyncModal';

interface Props {
  stats: FinancialStats;
  transactions: Transaction[];
  settings: Settings;
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<Props> = ({ stats, transactions, settings, user, onLogout }) => {
  const [marketData, setMarketData] = useState<any>(null);
  const [lastSync, setLastSync] = useState('');
  const [showSync, setShowSync] = useState(false);

  useEffect(() => {
    const loadMarket = async () => {
      const data = await storageService.getLiveMarketData();
      setMarketData(data);
    };
    loadMarket();
    
    const interval = setInterval(() => {
      setLastSync(storageService.getLastSync(user.username));
    }, 5000);
    return () => clearInterval(interval);
  }, [user.username]);

  const formatCurrency = (val: number) => val.toLocaleString('vi-VN') + 'đ';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Cloud Connectivity Widget */}
      <div className="bg-slate-900 p-6 rounded-[32px] shadow-2xl relative overflow-hidden group border border-white/5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="flex items-center justify-between relative z-10">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                 <i className="fas fa-network-wired text-indigo-400"></i>
              </div>
              <div>
                 <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Cloud ID: @{user.username}</p>
                 <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[11px] font-bold text-white tracking-tight">Thiết bị đã liên kết: 1</span>
                 </div>
              </div>
           </div>
           <button 
            onClick={() => setShowSync(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
           >
             Đồng bộ
           </button>
        </div>
      </div>

      {/* Real-time Market Data */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex gap-4 overflow-x-auto no-scrollbar">
        <div className="shrink-0 flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-xl border border-slate-100">
           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">LIVE MARKET</span>
        </div>
        {marketData ? (
          <>
            <div className="shrink-0 flex items-center gap-2">
               <i className="fab fa-bitcoin text-amber-500"></i>
               <span className="text-[11px] font-bold">BTC: {formatCurrency(marketData.bitcoin.vnd)}</span>
            </div>
            <div className="shrink-0 flex items-center gap-2">
               <i className="fab fa-ethereum text-indigo-500"></i>
               <span className="text-[11px] font-bold">ETH: {formatCurrency(marketData.ethereum.vnd)}</span>
            </div>
          </>
        ) : (
          <span className="text-[10px] text-slate-400 italic">Đang tải dữ liệu trực tuyến...</span>
        )}
      </div>

      <div className="p-8 rounded-[40px] bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-2xl shadow-indigo-200 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700"></div>
        <div className="z-10 relative">
          <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em]">Tổng Tài Sản Cloud</p>
          <h2 className="text-5xl font-black text-white mt-2 tracking-tighter">
            {formatCurrency(stats.total)}
          </h2>
          <div className="mt-8 flex gap-4">
             <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <p className="text-[9px] text-indigo-100 font-black uppercase">Sinh tồn</p>
                <p className="text-xl font-black text-white">{stats.survivalDays} <span className="text-[10px]">Ngày</span></p>
             </div>
             <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <p className="text-[9px] text-indigo-100 font-black uppercase">Tiết kiệm</p>
                <p className="text-xl font-black text-emerald-300">{formatCurrency(stats.cumulativeSaving)}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
           <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-3">
              <i className="fas fa-wallet"></i>
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiền mặt</p>
           <p className="text-lg font-black text-slate-800 mt-1">{formatCurrency(stats.currentCash)}</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
           <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3">
              <i className="fas fa-university"></i>
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngân hàng</p>
           <p className="text-lg font-black text-slate-800 mt-1">{formatCurrency(stats.currentBank)}</p>
        </div>
      </div>

      {showSync && (
        <CloudSyncModal 
          user={user} 
          onClose={() => setShowSync(false)} 
          onSyncSuccess={() => {
            setShowSync(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
