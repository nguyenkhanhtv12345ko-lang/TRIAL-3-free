
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

  const [displayInitialCash, setDisplayInitialCash] = useState('');
  const [displayInitialBank, setDisplayInitialBank] = useState('');
  const [displayDailyCost, setDisplayDailyCost] = useState('');

  // Load dữ liệu khi đăng nhập
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        setIsSyncing(true);
        const data = await storageService.getData(user.username);
        setSettings(data.settings);
        setTransactions(data.transactions);
        
        setDisplayInitialCash(data.settings.initialCash > 0 ? data.settings.initialCash.toLocaleString('vi-VN') : '');
        setDisplayInitialBank(data.settings.initialBank > 0 ? data.settings.initialBank.toLocaleString('vi-VN') : '');
        setDisplayDailyCost(data.settings.dailyCost > 0 ? data.settings.dailyCost.toLocaleString('vi-VN') : '');
        
        localStorage.setItem('cashflow_current_user', JSON.stringify(user));
        setIsSyncing(false);
      } else {
        setSettings({ userId: '', initialCash: 0, initialBank: 0, dailyCost: 0 });
        setTransactions([]);
        setActiveTab('dashboard');
      }
    };
    loadData();
  }, [user]);

  // Tự động đồng bộ khi có thay đổi (Auto-Sync to "Server")
  useEffect(() => {
    if (user && transactions.length >= 0) {
      const sync = async () => {
        setIsSyncing(true);
        await storageService.syncData(user.username, transactions, settings);
        setTimeout(() => setIsSyncing(false), 500);
      };
      const debounceSync = setTimeout(sync, 1000); // Đợi 1s sau thay đổi cuối cùng để sync
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

  const handleResetSettings = () => {
    if (window.confirm("Bạn muốn reset các thiết lập mục tiêu về 0?")) {
      setSettings(prev => ({ ...prev, initialCash: 0, initialBank: 0, dailyCost: 0 }));
      setDisplayInitialCash('');
      setDisplayInitialBank('');
      setDisplayDailyCost('');
    }
  };

  const handleLogout = useCallback(() => {
    if (window.confirm("Xác nhận đăng xuất? Dữ liệu của bạn đã được lưu an toàn trên hệ thống.")) {
      geminiService.resetSession();
      localStorage.removeItem('cashflow_current_user');
      setUser(null);
    }
  }, []);

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
      <header className="flex-none bg-white border-b border-slate-100 px-5 pt-[env(safe-area-inset-top,1rem)] h-[calc(4.5rem+env(safe-area-inset-top,0px))] flex items-center justify-between z-50 glass-effect">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <i className="fas fa-wallet text-white text-sm"></i>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tighter leading-none">CASHFLOW</h1>
            <div className="flex items-center gap-1 mt-1">
              <i className={`fas ${isSyncing ? 'fa-sync fa-spin text-indigo-500' : 'fa-cloud text-emerald-500'} text-[8px]`}></i>
              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                {isSyncing ? 'Đang đồng bộ...' : 'Đã lưu trên Server'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {user.role === UserRole.ADMIN && (
            <button 
              onClick={() => setActiveTab('admin')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeTab === 'admin' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}
            >
              <i className="fas fa-users-cog text-xs"></i>
            </button>
          )}
          <button 
            onClick={handleLogout}
            className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center active:scale-90 border border-slate-100 hover:text-rose-500 transition-all shadow-sm"
          >
            <i className="fas fa-power-off text-xs"></i>
          </button>
        </div>
      </header>

      <main className={`flex-1 overflow-y-auto ${activeTab === 'ai' || activeTab === 'admin' ? 'overflow-hidden' : 'p-4'}`}>
        <div className={`max-w-xl mx-auto h-full ${(activeTab === 'ai' || activeTab === 'admin') ? '' : 'space-y-6 pb-24'}`}>
          {activeTab === 'dashboard' && (
            <>
               <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       THIẾT LẬP MỤC TIÊU
                    </p>
                    <button onClick={handleResetSettings} className="text-[10px] font-black text-rose-400 uppercase tracking-widest hover:text-rose-600 transition-colors">RESET</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-black ml-1 uppercase">TIỀN MẶT</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        placeholder="0"
                        value={displayInitialCash} 
                        onChange={e => handleFormatInput(e.target.value, setDisplayInitialCash, 'initialCash')} 
                        className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-black outline-none border border-transparent focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-black ml-1 uppercase">TÀI KHOẢN</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        placeholder="0"
                        value={displayInitialBank} 
                        onChange={e => handleFormatInput(e.target.value, setDisplayInitialBank, 'initialBank')} 
                        className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-black outline-none border border-transparent focus:bg-white transition-all"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <div className="flex justify-between px-1">
                        <label className="text-[10px] text-slate-400 font-black uppercase">HẠN MỨC / NGÀY</label>
                        <span className="text-[10px] font-black text-indigo-500">{settings.dailyCost.toLocaleString('vi-VN')}đ</span>
                      </div>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        placeholder="VD: 80000" 
                        value={displayDailyCost} 
                        onChange={e => handleFormatInput(e.target.value, setDisplayDailyCost, 'dailyCost')} 
                        className="w-full bg-slate-50 p-5 rounded-2xl text-xl font-black text-slate-700 outline-none border border-transparent focus:bg-white transition-all"
                      />
                    </div>
                  </div>
               </div>
               <Dashboard stats={stats} transactions={transactions} settings={settings} user={user} onLogout={handleLogout} />
            </>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-4">
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
                  if (window.confirm('Xóa giao dịch này?')) setTransactions(transactions.filter(t => t.id !== id));
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
            <div className="h-full p-4 overflow-hidden">
               <AdminPanel onClose={() => setActiveTab('dashboard')} />
            </div>
          )}
        </div>
      </main>

      <nav className="flex-none bg-white border-t border-slate-100 flex justify-around items-center px-6 pb-[env(safe-area-inset-bottom,1.5rem)] h-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-50 glass-effect">
        {[
          { id: 'dashboard', icon: 'fa-chart-pie', label: 'TỔNG QUAN' },
          { id: 'transactions', icon: 'fa-exchange-alt', label: 'GIAO DỊCH' },
          { id: 'ai', icon: 'fa-pen-nib', label: 'TRỢ LÝ AI' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative group ${
              activeTab === tab.id ? 'text-indigo-600 scale-110' : 'text-slate-400'
            }`}
          >
            {activeTab === tab.id && <span className="absolute -top-4 w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>}
            <i className={`fas ${tab.icon} text-lg`}></i>
            <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
