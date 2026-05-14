
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, TransactionType, PaymentSource, Settings, FinancialStats, User, UserRole } from './types';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Auth from './components/Auth';
import AdminPanel from './components/AdminPanel';

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'admin'>('dashboard');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (user) {
      const savedSettings = localStorage.getItem(`cashflow_settings_${user.username}`);
      const savedTrans = localStorage.getItem(`cashflow_transactions_${user.username}`);
      
      const loadedSettings = savedSettings ? JSON.parse(savedSettings) : { userId: user.username, initialCash: 0, initialBank: 0, dailyCost: 0 };
      setSettings(loadedSettings);
      setTransactions(savedTrans ? JSON.parse(savedTrans) : []);
      
      localStorage.setItem('cashflow_current_user', JSON.stringify(user));
    } else {
      setSettings({ userId: '', initialCash: 0, initialBank: 0, dailyCost: 0 });
      setTransactions([]);
      setActiveTab('dashboard');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`cashflow_settings_${user.username}`, JSON.stringify(settings));
      localStorage.setItem(`cashflow_transactions_${user.username}`, JSON.stringify(transactions));
    }
  }, [settings, transactions, user]);

  const stats = useMemo((): FinancialStats => {
    const calc = (type: TransactionType, source: PaymentSource) => 
      transactions.filter(t => t.type === type && t.source === source).reduce((sum, t) => sum + t.amount, 0);

    const currentCash = settings.initialCash + calc(TransactionType.INCOME, PaymentSource.CASH) - calc(TransactionType.EXPENSE, PaymentSource.CASH);
    const currentBank = settings.initialBank + calc(TransactionType.INCOME, PaymentSource.BANK) - calc(TransactionType.EXPENSE, PaymentSource.BANK);
    const total = currentCash + currentBank;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todayExpense = transactions
      .filter(t => t.date === todayStr && t.type === TransactionType.EXPENSE && !t.isExcluded && !t.isFromSavings)
      .reduce((sum, t) => sum + t.amount, 0);

    let cumulativeSaving = 0;
    if (settings.dailyCost > 0) {
      const firstDateStr = transactions.length > 0 
        ? transactions.reduce((min, t) => t.date < min ? t.date : min, todayStr)
        : todayStr;
      const start = new Date(firstDateStr);
      const end = new Date(todayStr);
      const diffDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      
      const normalExpenses = transactions
        .filter(t => t.type === TransactionType.EXPENSE && !t.isExcluded && !t.isFromSavings)
        .reduce((s, t) => s + t.amount, 0);
      
      const spentFromSavings = transactions
        .filter(t => t.type === TransactionType.EXPENSE && t.isFromSavings)
        .reduce((s, t) => s + t.amount, 0);

      cumulativeSaving = (diffDays * settings.dailyCost) - normalExpenses - spentFromSavings;
    }

    const survivalDays = settings.dailyCost > 0 ? Math.floor(total / settings.dailyCost) : 0;

    return {
      currentCash, currentBank, total, survivalDays,
      totalIncome: transactions.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0),
      totalExpense: transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0),
      todayExpense,
      cumulativeSaving
    };
  }, [transactions, settings]);

  const handleLogout = useCallback(() => {
    if (window.confirm("Thoát phiên làm việc an toàn?")) {
      localStorage.removeItem('cashflow_current_user');
      setUser(null);
    }
  }, []);

  const handleAmountInput = (value: string, key: keyof Settings) => {
    const numeric = Number(value.replace(/\D/g, ''));
    setSettings(prev => ({ ...prev, [key]: numeric }));
  };

  if (!user) return <Auth onLogin={setUser} />;

  return (
    <div className="h-screen flex flex-col bg-tech-900 text-tech-text font-sans overflow-hidden">
      <header className="flex-none bg-tech-800/80 backdrop-blur-2xl border-b border-tech-border px-5 h-20 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-tech-accent rounded-2xl flex items-center justify-center shadow-lg shadow-tech-accent/20 rotate-3 ring-2 ring-tech-900">
            <i className="fas fa-layer-group text-tech-900 text-[16px]"></i>
          </div>
          <div>
            <h1 className="text-[24px] font-black text-white tracking-tighter leading-none">CASH<span className="text-tech-cyan">FLOW</span></h1>
            <p className="text-[12px] font-black text-tech-muted uppercase tracking-widest">v2.1 SuperSize</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {user.role === UserRole.ADMIN && (
            <button 
              onClick={() => setActiveTab('admin')}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeTab === 'admin' ? 'bg-tech-cyan text-tech-900 shadow-lg shadow-tech-cyan/20' : 'bg-tech-700 text-tech-muted border border-tech-border'}`}
            >
              <i className="fas fa-cog text-[16px]"></i>
            </button>
          )}
          <button onClick={handleLogout} className="w-12 h-12 bg-tech-700 text-tech-muted rounded-2xl flex items-center justify-center border border-tech-border"><i className="fas fa-power-off text-[16px]"></i></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        <div className="max-w-sm mx-auto space-y-7 pb-28">
          {activeTab === 'dashboard' && (
            <>
               <div className="bg-tech-800 p-7 rounded-[40px] shadow-sm border border-tech-border/50 animate-in fade-in slide-in-from-top-2 duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-tech-cyan/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="flex justify-between items-center mb-6 px-1 relative z-10">
                    <p className="text-[13px] font-black text-tech-cyan uppercase tracking-[0.2em]">THIẾT LẬP MỤC TIÊU</p>
                    <button onClick={() => setSettings(p => ({...p, initialCash:0, initialBank:0, dailyCost:0}))} className="text-[12px] font-black text-rose-400 uppercase tracking-widest hover:text-rose-300">RESET</button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="space-y-3">
                      <label className="text-[12px] text-tech-muted font-black uppercase tracking-widest ml-1">TIỀN MẶT</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={settings.initialCash.toLocaleString('vi-VN')} 
                        onChange={e => handleAmountInput(e.target.value, 'initialCash')} 
                        className="w-full bg-tech-900 p-4 rounded-3xl text-[17px] font-mono font-bold text-center border border-tech-border outline-none focus:ring-2 focus:ring-tech-cyan/50 text-white"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[12px] text-tech-muted font-black uppercase tracking-widest ml-1">TÀI KHOẢN</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={settings.initialBank.toLocaleString('vi-VN')} 
                        onChange={e => handleAmountInput(e.target.value, 'initialBank')} 
                        className="w-full bg-tech-900 p-4 rounded-3xl text-[17px] font-mono font-bold text-center border border-tech-border outline-none focus:ring-2 focus:ring-tech-cyan/50 text-white"
                      />
                    </div>
                    <div className="col-span-2 mt-3 space-y-3">
                      <label className="text-[12px] text-tech-muted font-black uppercase tracking-widest text-center block">HẠN MỨC / NGÀY</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={settings.dailyCost.toLocaleString('vi-VN')} 
                        onChange={e => handleAmountInput(e.target.value, 'dailyCost')} 
                        className="w-full bg-tech-cyan/10 p-5 rounded-3xl text-[30px] font-mono font-black text-tech-cyan text-center border border-tech-cyan/20 focus:bg-tech-900 outline-none transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                      />
                    </div>
                  </div>
               </div>

               <Dashboard stats={stats} transactions={transactions} settings={settings} user={user} onLogout={handleLogout} />
            </>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-7">
              <TransactionForm 
                onAdd={(t) => setTransactions([{...t, id: Date.now().toString(), userId: user.username}, ...transactions])} 
                editingTransaction={editingTransaction}
                onUpdate={(updated) => { setTransactions(transactions.map(t => t.id === updated.id ? updated : t)); setEditingTransaction(null); }}
                onCancelEdit={() => setEditingTransaction(null)}
              />
              <TransactionList 
                transactions={transactions} 
                settings={settings}
                onDelete={(id) => { if (window.confirm('Xác nhận xóa giao dịch?')) setTransactions(transactions.filter(t => t.id !== id)); }}
                onEdit={(t) => { setEditingTransaction(t); document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }); }}
                onUpdateStates={(id, updates) => setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))}
              />
            </div>
          )}

          {activeTab === 'admin' && user.role === UserRole.ADMIN && (
            <AdminPanel onClose={() => setActiveTab('dashboard')} />
          )}
        </div>
      </main>

      <nav className="flex-none bg-tech-800 border-t border-tech-border flex justify-around items-center h-24 z-50">
        {[
          { id: 'dashboard', icon: 'fa-th-large', label: 'TỔNG QUAN' },
          { id: 'transactions', icon: 'fa-server', label: 'GIAO DỊCH' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center transition-all ${activeTab === tab.id ? 'text-tech-cyan' : 'text-tech-muted hover:text-white'}`}
          >
            <div className={`w-16 h-14 flex items-center justify-center rounded-2xl transition-all duration-300 ${activeTab === tab.id ? 'bg-tech-cyan text-tech-900 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-tech-900 border border-tech-border/50'}`}>
               <i className={`fas ${tab.icon} text-[20px]`}></i>
            </div>
            <span className="text-[12px] font-black mt-3 uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
