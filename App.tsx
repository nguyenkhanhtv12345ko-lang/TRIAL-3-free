
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
  const [networkLatency, setNetworkLatency] = useState(0);

  const [displayInitialCash, setDisplayInitialCash] = useState('');
  const [displayInitialBank, setDisplayInitialBank] = useState('');
  const [displayDailyCost, setDisplayDailyCost] = useState('');

  // Load dữ liệu từ Cloud
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        setIsSyncing(true);
        const start = Date.now();
        const data = await storageService.fetchUserData(user.username);
        setNetworkLatency(Date.now() - start);
        
        setSettings(data.settings);
        setTransactions(data.transactions);
        
        setDisplayInitialCash(data.settings.initialCash > 0 ? data.settings.initialCash.toLocaleString('vi-VN') : '');
        setDisplayInitialBank(data.settings.initialBank > 0 ? data.settings.initialBank.toLocaleString('vi-VN') : '');
        setDisplayDailyCost(data.settings.dailyCost > 0 ? data.settings.dailyCost.toLocaleString('vi-VN') : '');
        
        localStorage.setItem('cashflow_current_user', JSON.stringify(user));
        setIsSyncing(false);
      }
    };
    loadData();
  }, [user]);

  // Cloud Auto-Sync
  useEffect(() => {
    if (user && transactions.length >= 0) {
      const sync = async () => {
        setIsSyncing(true);
        const start = Date.now();
        await storageService.pushUserData(user.username, transactions, settings);
        setNetworkLatency(Date.now() - start);
        setTimeout(() => setIsSyncing(false), 800);
      };
      const debounceSync = setTimeout(sync, 2000);
      return () => clearTimeout(debounceSync);
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
    const todayExpense = transactions
      .filter(t => t.date === todayStr && t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    let cumulativeSaving = 0;
    if (settings.dailyCost > 0) {
      const firstDateStr = transactions.length > 0 
        ? transactions.reduce((min, t) => t.date < min ? t.date : min, todayStr)
        : todayStr;

      const start = new Date(firstDateStr);
      const end = new Date(todayStr);
      const diffDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      cumulativeSaving = (diffDays * settings.dailyCost) - transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
    }

    return {
      currentCash, currentBank, total, survivalDays,
      totalIncome: transactions.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0),
      totalExpense: transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0),
      todayExpense,
      cumulativeSaving
    };
  }, [transactions, settings]);

  const handleFormatInput = (value: string, setter: (v: string) => void, settingKey: keyof Settings) => {
    const numeric = Number(value.replace(/\D/g, ''));
    setter(numeric === 0 ? '' : numeric.toLocaleString('vi-VN'));
    setSettings(prev => ({ ...prev, [settingKey]: numeric }));
  };

  const handleLogout = useCallback(() => {
    if (window.confirm("Đăng xuất? Mọi dữ liệu đã được lưu trữ an toàn trên Cloud Server.")) {
      geminiService.resetSession();
      localStorage.removeItem('cashflow_current_user');
      setUser(null);
    }
  }, []);

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] font-sans overflow-hidden">
      {/* Cloud Status Bar */}
      <div className="bg-slate-900 text-[8px] font-black text-slate-500 py-1.5 px-5 flex justify-between uppercase tracking-widest z-[100]">
         <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><i className="fas fa-server text-indigo-400"></i> Cloud: Online</span>
            <span className="flex items-center gap-1.5"><i className="fas fa-wifi text-emerald-400"></i> IP: 142.250.190.46</span>
         </div>
         <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-indigo-400">
               <i className="fas fa-bolt"></i> Latency: {networkLatency}ms
            </span>
         </div>
      </div>

      <header className="flex-none bg-white/80 backdrop-blur-xl border-b border-slate-100 px-5 h-20 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200">
            <i className="fas fa-cloud text-white text-base"></i>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tighter leading-none">CASH<span className="text-indigo-600">CLOUD</span></h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <i className={`fas ${isSyncing ? 'fa-circle-notch fa-spin text-indigo-500' : 'fa-check-double text-emerald-500'} text-[8px]`}></i>
              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                {isSyncing ? 'Syncing to Server...' : 'Cloud Synced'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {user.role === UserRole.ADMIN && (
            <button 
              onClick={() => setActiveTab('admin')}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${activeTab === 'admin' ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}
            >
              <i className="fas fa-terminal text-sm"></i>
            </button>
          )}
          <button 
            onClick={handleLogout}
            className="w-11 h-11 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center active:scale-90 border border-rose-100 transition-all shadow-sm"
          >
            <i className="fas fa-power-off text-sm"></i>
          </button>
        </div>
      </header>

      <main className={`flex-1 overflow-y-auto ${activeTab === 'ai' || activeTab === 'admin' ? 'overflow-hidden' : 'p-4'}`}>
        <div className={`max-w-xl mx-auto h-full ${(activeTab === 'ai' || activeTab === 'admin') ? '' : 'space-y-6 pb-28'}`}>
          {activeTab === 'dashboard' && (
            <>
               <div className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       CLOUD SETTINGS
                    </p>
                    <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-black ml-1 uppercase">CASH LIMIT</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        placeholder="0"
                        value={displayInitialCash} 
                        onChange={e => handleFormatInput(e.target.value, setDisplayInitialCash, 'initialCash')} 
                        className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-black outline-none border border-transparent focus:bg-white focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-black ml-1 uppercase">BANK LIMIT</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        placeholder="0"
                        value={displayInitialBank} 
                        onChange={e => handleFormatInput(e.target.value, setDisplayInitialBank, 'initialBank')} 
                        className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-black outline-none border border-transparent focus:bg-white focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-black ml-1 uppercase">DAILY BUDGET TARGET</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        placeholder="VD: 80000" 
                        value={displayDailyCost} 
                        onChange={e => handleFormatInput(e.target.value, setDisplayDailyCost, 'dailyCost')} 
                        className="w-full bg-indigo-50 p-5 rounded-3xl text-2xl font-black text-indigo-700 outline-none border border-indigo-100 focus:bg-white transition-all text-center"
                      />
                    </div>
                  </div>
               </div>
               <Dashboard stats={stats} transactions={transactions} settings={settings} user={user} onLogout={handleLogout} />
            </>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-5">
              <TransactionForm 
                onAdd={(t) => {
                  setTransactions([{...t, id: Date.now().toString(), userId: user.username}, ...transactions]);
                }} 
                editingTransaction={editingTransaction}
                onUpdate={(updated) => {
                  setTransactions(transactions.map(t => t.id === updated.id ? updated : t));
                  setEditingTransaction(null);
                }}
                onCancelEdit={() => setEditingTransaction(null)}
              />
              <TransactionList 
                transactions={transactions} 
                settings={settings}
                onDelete={(id) => {
                  if (window.confirm('Hủy giao dịch này khỏi Server?')) setTransactions(transactions.filter(t => t.id !== id));
                }}
                onEdit={(t) => {
                  setEditingTransaction(t);
                  document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )}

          {activeTab === 'ai' && (
            <AIChat 
              transactions={transactions} 
              stats={stats} 
              onAddTransaction={(t) => {
                setTransactions([{...t, id: Date.now().toString(), userId: user.username}, ...transactions]);
              }} 
              onClose={() => setActiveTab('dashboard')} 
            />
          )}

          {activeTab === 'admin' && user.role === UserRole.ADMIN && (
            <div className="h-full p-4">
               <AdminPanel onClose={() => setActiveTab('dashboard')} />
            </div>
          )}
        </div>
      </main>

      <nav className="flex-none bg-white border-t border-slate-100 flex justify-around items-center px-6 h-24 z-50">
        {[
          { id: 'dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
          { id: 'transactions', icon: 'fa-layer-group', label: 'Cloud DB' },
          { id: 'ai', icon: 'fa-wand-magic-sparkles', label: 'Cloud AI' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${
              activeTab === tab.id ? 'text-indigo-600 scale-105' : 'text-slate-400'
            }`}
          >
            <div className={`w-12 h-8 flex items-center justify-center rounded-2xl transition-all ${activeTab === tab.id ? 'bg-indigo-50' : ''}`}>
              <i className={`fas ${tab.icon} ${activeTab === tab.id ? 'text-lg' : 'text-base'}`}></i>
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
