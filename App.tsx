
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, TransactionType, PaymentSource, Settings, FinancialStats, User, UserRole } from './types';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import AIChat from './components/AIChat';
import Auth from './components/Auth';
import AdminPanel from './components/AdminPanel';
import { geminiService } from './services/geminiService';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('cashflow_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [settings, setSettings] = useState<Settings>({ userId: '', initialCash: 0, initialBank: 0, dailyCost: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'ai' | 'admin'>('dashboard');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudLogs, setCloudLogs] = useState<any[]>([]);
  const [uptime, setUptime] = useState(0);

  // Lắng nghe Cloud Activity
  useEffect(() => {
    const handleActivity = (e: any) => setCloudLogs(e.detail);
    window.addEventListener('cloud_activity', handleActivity);
    return () => window.removeEventListener('cloud_activity', handleActivity);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setUptime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // AUTOMATED FETCH: Tự động kéo dữ liệu mỗi khi User đổi hoặc định kỳ
  useEffect(() => {
    if (!user) return;
    const syncWithCloud = async () => {
      setIsSyncing(true);
      const data = await storageService.fetchUserData(user.username);
      if (data.settings) setSettings(data.settings);
      setTransactions(data.transactions);
      setIsSyncing(false);
    };
    syncWithCloud();
    // Giả lập polling: 30 giây tự động refetch để đồng bộ thiết bị khác
    const poll = setInterval(syncWithCloud, 30000);
    return () => clearInterval(poll);
  }, [user]);

  // AUTOMATED PUSH: Tự động đẩy dữ liệu khi có bất kỳ thay đổi nào
  useEffect(() => {
    if (user && (transactions.length > 0 || settings.dailyCost > 0)) {
      const push = async () => {
        setIsSyncing(true);
        await storageService.pushUserData(user.username, transactions, settings);
        setIsSyncing(false);
      };
      const debounce = setTimeout(push, 1000); // Đợi 1s sau khi người dùng ngừng thao tác
      return () => clearTimeout(debounce);
    }
  }, [transactions, settings, user]);

  const stats = useMemo((): FinancialStats => {
    const calc = (type: TransactionType, source: PaymentSource) => 
      transactions.filter(t => t.type === type && t.source === source).reduce((sum, t) => sum + t.amount, 0);

    const currentCash = settings.initialCash + calc(TransactionType.INCOME, PaymentSource.CASH) - calc(TransactionType.EXPENSE, PaymentSource.CASH);
    const currentBank = settings.initialBank + calc(TransactionType.INCOME, PaymentSource.BANK) - calc(TransactionType.EXPENSE, PaymentSource.BANK);
    const total = currentCash + currentBank;
    const survivalDays = settings.dailyCost > 0 ? Math.floor(total / settings.dailyCost) : 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayExpense = transactions.filter(t => t.date === todayStr && t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);

    return {
      currentCash, currentBank, total, survivalDays,
      totalIncome: transactions.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0),
      totalExpense: transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0),
      todayExpense,
      cumulativeSaving: (survivalDays * settings.dailyCost) // Đơn giản hóa cho demo
    };
  }, [transactions, settings]);

  const handleLogout = useCallback(() => {
    if (window.confirm("Thoát phiên làm việc trực tuyến?")) {
      setUser(null);
      localStorage.removeItem('cashflow_current_user');
    }
  }, []);

  if (!user) return <Auth onLogin={setUser} />;

  return (
    <div className="h-screen flex flex-col bg-[#f0f4f8] font-sans overflow-hidden">
      {/* Cloud OS Bar - Pro Version */}
      <div className="bg-indigo-950 text-[9px] font-black text-indigo-300 py-1.5 px-6 flex justify-between uppercase tracking-widest z-[100] border-b border-indigo-900/50">
         <div className="flex items-center gap-5">
            <span className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> SERVER: ONLINE</span>
            <span className="hidden sm:inline">REGION: ASIA-SOUTHEAST</span>
            <span className="flex items-center gap-2 opacity-60"><i className="fas fa-microchip"></i> LOAD: {Math.floor(Math.random()*15)}%</span>
         </div>
         <div className="flex items-center gap-4">
            <span className="text-indigo-400">UPTIME: {Math.floor(uptime/60)}m {uptime%60}s</span>
         </div>
      </div>

      <header className="flex-none bg-white/80 backdrop-blur-2xl border-b border-slate-200 px-6 h-20 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200">
            <i className="fas fa-cloud-bolt text-white text-lg"></i>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tighter leading-none">CASH<span className="text-indigo-600">CLOUD</span></h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Hệ thống tự động hóa V5</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`text-[10px] font-black px-3 py-1.5 rounded-full border transition-all ${isSyncing ? 'bg-indigo-50 text-indigo-600 border-indigo-200 animate-pulse' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
             {isSyncing ? 'CLOUD SYNCING...' : 'CLOUD SECURED'}
          </div>
          <button onClick={handleLogout} className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center active:scale-90 border border-rose-100"><i className="fas fa-power-off"></i></button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col sm:flex-row">
        {/* Left Side: Activity Logs (Tự động hóa hiển thị) */}
        <div className="hidden lg:flex w-64 bg-slate-50 border-r border-slate-200 flex-col p-6">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Cloud Console Log</h3>
           <div className="space-y-4">
              {cloudLogs.map(log => (
                <div key={log.id} className="text-[10px] font-mono p-3 bg-white border border-slate-200 rounded-xl shadow-sm animate-in slide-in-from-left duration-300">
                   <div className="flex justify-between mb-1">
                      <span className="text-indigo-600 font-bold">[{log.id}]</span>
                      <span className={log.status === 'SUCCESS' ? 'text-emerald-500' : 'text-amber-500'}>{log.status}</span>
                   </div>
                   <p className="text-slate-600 truncate">{log.action}</p>
                   <p className="text-slate-300 mt-1">{log.time}</p>
                </div>
              ))}
              {cloudLogs.length === 0 && <p className="text-[10px] text-slate-300 italic">Chờ yêu cầu từ người dùng...</p>}
           </div>
        </div>

        {/* Center: Main Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
           <div className="max-w-2xl mx-auto space-y-6 pb-28">
              {activeTab === 'dashboard' && (
                <>
                   <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                      <div className="flex justify-between items-center mb-6">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-bolt text-amber-500"></i> LIVE SYNC SETTINGS</p>
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] text-slate-400 font-black uppercase ml-1">Vốn mặt</label>
                          <input 
                            type="text" 
                            placeholder="0"
                            value={settings.initialCash.toLocaleString('vi-VN')} 
                            onChange={e => setSettings({...settings, initialCash: Number(e.target.value.replace(/\D/g, ''))})} 
                            className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-black outline-none focus:bg-white border border-transparent focus:border-indigo-500 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] text-slate-400 font-black uppercase ml-1">Vốn Bank</label>
                          <input 
                            type="text" 
                            placeholder="0"
                            value={settings.initialBank.toLocaleString('vi-VN')} 
                            onChange={e => setSettings({...settings, initialBank: Number(e.target.value.replace(/\D/g, ''))})} 
                            className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-black outline-none focus:bg-white border border-transparent focus:border-indigo-500 transition-all"
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <label className="text-[10px] text-slate-400 font-black uppercase ml-1 text-center block">Chi tiêu mục tiêu / ngày</label>
                          <input 
                            type="text" 
                            placeholder="Nhập số tiền..." 
                            value={settings.dailyCost.toLocaleString('vi-VN')} 
                            onChange={e => setSettings({...settings, dailyCost: Number(e.target.value.replace(/\D/g, ''))})} 
                            className="w-full bg-indigo-50 p-6 rounded-[32px] text-3xl font-black text-indigo-700 outline-none border border-indigo-100 focus:bg-white transition-all text-center"
                          />
                        </div>
                      </div>
                   </div>
                   <Dashboard stats={stats} transactions={transactions} settings={settings} user={user} onLogout={handleLogout} />
                </>
              )}

              {activeTab === 'transactions' && (
                <div className="space-y-6">
                  <TransactionForm 
                    onAdd={(t) => setTransactions([{...t, id: Date.now().toString(), userId: user.username}, ...transactions])} 
                    editingTransaction={editingTransaction}
                    onUpdate={(updated) => { setTransactions(transactions.map(t => t.id === updated.id ? updated : t)); setEditingTransaction(null); }}
                    onCancelEdit={() => setEditingTransaction(null)}
                  />
                  <TransactionList transactions={transactions} settings={settings} onDelete={(id) => setTransactions(transactions.filter(t => t.id !== id))} onEdit={setEditingTransaction} />
                </div>
              )}

              {activeTab === 'ai' && (
                <AIChat transactions={transactions} stats={stats} onAddTransaction={(t) => setTransactions([{...t, id: Date.now().toString(), userId: user.username}, ...transactions])} onClose={() => setActiveTab('dashboard')} />
              )}
           </div>
        </div>
      </main>

      <nav className="flex-none bg-white border-t border-slate-200 flex justify-around items-center h-24 z-50 shadow-2xl">
        {[
          { id: 'dashboard', icon: 'fa-gauge-high', label: 'Console' },
          { id: 'transactions', icon: 'fa-cloud-arrow-up', label: 'Cloud DB' },
          { id: 'ai', icon: 'fa-brain', label: 'Cloud AI' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === tab.id ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
            <div className={`w-14 h-10 flex items-center justify-center rounded-2xl ${activeTab === tab.id ? 'bg-indigo-50' : ''}`}><i className={`fas ${tab.icon} text-lg`}></i></div>
            <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
