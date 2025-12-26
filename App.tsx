
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, PaymentSource, Settings, FinancialStats } from './types';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import AIChat from './components/AIChat';
import { exportToCSV } from './services/exportService';

const App: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('cashflow_settings');
    return saved ? JSON.parse(saved) : { initialCash: 0, initialBank: 0, dailyCost: 0 };
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('cashflow_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'ai'>('dashboard');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    localStorage.setItem('cashflow_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('cashflow_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

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
      const timeDiff = end.getTime() - start.getTime();
      const diffDays = Math.max(1, Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1);
      const totalBudget = diffDays * settings.dailyCost;
      const totalSpent = transactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);
      cumulativeSaving = totalBudget - totalSpent;
    }

    return {
      currentCash, currentBank, total, survivalDays,
      totalIncome: transactions.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0),
      totalExpense: transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0),
      todayExpense,
      cumulativeSaving
    };
  }, [transactions, settings]);

  const handleAddTransaction = (t: Omit<Transaction, 'id'>) => {
    setTransactions([{...t, id: Date.now().toString()}, ...transactions]);
    if (activeTab !== 'transactions') setActiveTab('transactions');
  };

  const handleUpdateTransaction = (updated: Transaction) => {
    setTransactions(transactions.map(t => t.id === updated.id ? updated : t));
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Xóa giao dịch này?')) {
      setTransactions(transactions.filter(t => t.id !== id));
      if (editingTransaction?.id === id) setEditingTransaction(null);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Xóa toàn bộ dữ liệu?')) {
      setTransactions([]);
      setSettings({ initialCash: 0, initialBank: 0, dailyCost: 0 });
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
      {/* Header - Fixed Height & Safe Area aware */}
      <header className="flex-none bg-white border-b border-slate-100 px-5 pt-[env(safe-area-inset-top,1rem)] h-[calc(4rem+env(safe-area-inset-top,0px))] flex items-center justify-between z-50 glass-effect">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
            <i className="fas fa-wallet text-white text-xs"></i>
          </div>
          <h1 className="text-lg font-black tracking-tight text-slate-800 uppercase">
            Cash<span className="text-indigo-600">Flow</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {!isOnline && (
            <div className="bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full text-[10px] font-black border border-rose-100 animate-pulse">
              OFFLINE
            </div>
          )}
          <button 
            onClick={() => exportToCSV(transactions, settings)} 
            className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center justify-center active-scale"
          >
            <i className="fas fa-file-export text-sm"></i>
          </button>
        </div>
      </header>

      {/* Main Content Area - Scrollable */}
      <main className={`flex-1 overflow-y-auto ${activeTab === 'ai' ? 'overflow-hidden' : 'p-4'}`}>
        <div className={`max-w-xl mx-auto h-full ${activeTab === 'ai' ? '' : 'space-y-5 pb-8'}`}>
          {activeTab === 'dashboard' && (
            <>
               <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Thiết lập mục tiêu</p>
                    <button onClick={handleResetData} className="text-[10px] text-rose-400 font-bold hover:text-rose-600">RESET</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold ml-1">TIỀN MẶT</label>
                      <input type="number" placeholder="0" value={settings.initialCash || ''} onChange={e => setSettings({...settings, initialCash: +e.target.value})} className="w-full bg-slate-50 p-3 rounded-2xl text-sm font-bold outline-none border border-transparent focus:border-indigo-100 focus:bg-white transition-all"/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold ml-1">TÀI KHOẢN</label>
                      <input type="number" placeholder="0" value={settings.initialBank || ''} onChange={e => setSettings({...settings, initialBank: +e.target.value})} className="w-full bg-slate-50 p-3 rounded-2xl text-sm font-bold outline-none border border-transparent focus:border-indigo-100 focus:bg-white transition-all"/>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold ml-1 flex justify-between">
                        <span>HẠN MỨC / NGÀY</span>
                        <span className="text-indigo-600 font-black">{settings.dailyCost.toLocaleString()}đ</span>
                      </label>
                      <input type="number" placeholder="VD: 80000" value={settings.dailyCost || ''} onChange={e => setSettings({...settings, dailyCost: +e.target.value})} className="w-full bg-indigo-50/50 p-3.5 rounded-2xl text-base font-black text-indigo-700 outline-none border border-indigo-100 focus:bg-white transition-all"/>
                    </div>
                  </div>
               </div>
               <Dashboard stats={stats} transactions={transactions} settings={settings} />
            </>
          )}

          {activeTab === 'transactions' && (
            <>
              <TransactionForm 
                onAdd={handleAddTransaction} 
                editingTransaction={editingTransaction}
                onUpdate={handleUpdateTransaction}
                onCancelEdit={() => setEditingTransaction(null)}
              />
              <TransactionList 
                transactions={transactions} 
                settings={settings}
                onDelete={handleDeleteTransaction}
                onEdit={(t) => {
                  setEditingTransaction(t);
                  document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </>
          )}

          {activeTab === 'ai' && (
            <div className="h-full">
              {isOnline ? (
                <AIChat 
                  transactions={transactions} 
                  stats={stats} 
                  onAddTransaction={handleAddTransaction} 
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-wifi-slash text-3xl text-slate-300"></i>
                  </div>
                  <h3 className="font-black text-slate-800">Cần kết nối mạng</h3>
                  <p className="text-xs text-slate-400">Trợ lý AI cần Internet để tư vấn tài chính.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Navigation - Fixed Height & Safe Area aware */}
      <nav className="flex-none bg-white border-t border-slate-100 flex justify-around items-center px-6 pb-[env(safe-area-inset-bottom,1.5rem)] h-[calc(5rem+env(safe-area-inset-bottom,0px))] z-50 glass-effect shadow-[0_-10px_25px_rgba(0,0,0,0.02)]">
        {[
          { id: 'dashboard', icon: 'fa-chart-pie', label: 'Tổng quan' },
          { id: 'transactions', icon: 'fa-exchange-alt', label: 'Giao dịch' },
          { id: 'ai', icon: 'fa-magic', label: 'Trợ lý AI' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 min-w-[4.5rem] ${
              activeTab === tab.id ? 'text-indigo-600 scale-110' : 'text-slate-400'
            }`}
          >
            <i className={`fas ${tab.icon} text-lg`}></i>
            <span className="text-[10px] font-black uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
