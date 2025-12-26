
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

  useEffect(() => {
    localStorage.setItem('cashflow_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('cashflow_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const stats = useMemo((): FinancialStats => {
    const calc = (type: TransactionType, source: PaymentSource) => 
      transactions.filter(t => t.type === type && t.source === source).reduce((sum, t) => sum + t.amount, 0);

    const currentCash = settings.initialCash + calc(TransactionType.INCOME, PaymentSource.CASH) - calc(TransactionType.EXPENSE, PaymentSource.CASH);
    const currentBank = settings.initialBank + calc(TransactionType.INCOME, PaymentSource.BANK) - calc(TransactionType.EXPENSE, PaymentSource.BANK);
    const total = currentCash + currentBank;
    const survivalDays = settings.dailyCost > 0 ? Math.floor(total / settings.dailyCost) : 0;

    return {
      currentCash, currentBank, total, survivalDays,
      totalIncome: transactions.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0),
      totalExpense: transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0)
    };
  }, [transactions, settings]);

  const handleAddTransaction = (t: Omit<Transaction, 'id'>) => {
    setTransactions([{...t, id: Date.now().toString()}, ...transactions]);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Header - Mobile Optimized */}
      <header className="flex-none h-14 bg-white border-b flex items-center justify-between px-4 sticky top-0 z-50">
        <h1 className="text-lg font-black text-indigo-900 flex items-center gap-2">
          <i className="fas fa-wallet text-yellow-500"></i> CASHFLOW
        </h1>
        <div className="flex items-center gap-2">
           {!isOnline && <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-1 rounded-full font-bold">OFFLINE</span>}
           <button 
             onClick={() => exportToCSV(transactions, settings)} 
             className="text-indigo-600 font-bold text-xs bg-indigo-50 px-3 py-1.5 rounded-lg active-scale"
           >
             XUẤT SAO KÊ
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {activeTab === 'dashboard' && (
          <div className="max-w-md mx-auto space-y-4">
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Thiết lập nguồn vốn</p>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Tiền mặt" value={settings.initialCash || ''} onChange={e => setSettings({...settings, initialCash: +e.target.value})} className="bg-slate-50 p-3 rounded-xl text-sm font-bold outline-none border border-slate-100"/>
                  <input type="number" placeholder="Tài khoản" value={settings.initialBank || ''} onChange={e => setSettings({...settings, initialBank: +e.target.value})} className="bg-slate-50 p-3 rounded-xl text-sm font-bold outline-none border border-slate-100"/>
                  <div className="col-span-2">
                    <input type="number" placeholder="Chi phí mỗi ngày" value={settings.dailyCost || ''} onChange={e => setSettings({...settings, dailyCost: +e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold outline-none border border-slate-100"/>
                  </div>
                </div>
             </div>
             <Dashboard stats={stats} transactions={transactions} />
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="max-w-md mx-auto space-y-4">
            <TransactionForm onAdd={handleAddTransaction} />
            <TransactionList 
              transactions={transactions} 
              settings={settings}
              onDelete={id => setTransactions(transactions.filter(t => t.id !== id))} 
            />
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="h-full max-w-md mx-auto">
            {isOnline ? (
              <AIChat 
                transactions={transactions} 
                stats={stats} 
                onAddTransaction={handleAddTransaction} 
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4">
                <i className="fas fa-wifi-slash text-5xl text-slate-300"></i>
                <h3 className="font-bold text-slate-700">Trợ lý AI cần Internet</h3>
                <p className="text-sm text-slate-500">Các tính năng quản lý thu chi vẫn hoạt động bình thường, nhưng để chat với AI bạn cần kết nối mạng.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Navigation - Bottom bar style */}
      <nav className="fixed bottom-0 inset-x-0 h-16 bg-indigo-900 flex justify-around items-center safe-area-bottom shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
        {[
          { id: 'dashboard', icon: 'fa-chart-pie', label: 'Hệ thống' },
          { id: 'transactions', icon: 'fa-plus-circle', label: 'Giao dịch' },
          { id: 'ai', icon: 'fa-robot', label: 'Trợ lý AI' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-white scale-110' : 'text-indigo-400 opacity-60'}`}
          >
            <i className={`fas ${tab.icon} text-xl`}></i>
            <span className="text-[10px] font-bold">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
