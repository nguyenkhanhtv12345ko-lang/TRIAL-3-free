
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

    return {
      currentCash, currentBank, total, survivalDays,
      totalIncome: transactions.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0),
      totalExpense: transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0)
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
    if (window.confirm('Xóa giao dịch này khỏi hệ thống?')) {
      setTransactions(transactions.filter(t => t.id !== id));
      if (editingTransaction?.id === id) setEditingTransaction(null);
    }
  };

  const handleResetData = () => {
    if (window.confirm('CẢNH BÁO: Hành động này sẽ xóa toàn bộ lịch sử giao dịch và thiết lập ban đầu. Bạn có chắc chắn?')) {
      setTransactions([]);
      setSettings({ initialCash: 0, initialBank: 0, dailyCost: 0 });
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
      {/* Header chuẩn app di động */}
      <header className="flex-none h-16 bg-white border-b border-slate-100 flex items-center justify-between px-5 sticky top-0 z-50 glass-effect">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
            <i className="fas fa-wallet text-white text-sm"></i>
          </div>
          <h1 className="text-lg font-black tracking-tight text-slate-800">
            CASH<span className="text-indigo-600">FLOW</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {!isOnline && (
            <div className="flex items-center gap-1.5 bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full text-[10px] font-black border border-rose-100 animate-pulse">
              <i className="fas fa-plane"></i> OFFLINE
            </div>
          )}
          <button 
            onClick={() => exportToCSV(transactions, settings)} 
            className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all active-scale"
            title="Xuất dữ liệu"
          >
            <i className="fas fa-file-export"></i>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-5 pb-24 scroll-smooth">
        {activeTab === 'dashboard' && (
          <div className="max-w-xl mx-auto space-y-5">
             {/* Wallet Settings Card */}
             <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nguồn vốn hiện có</p>
                  <button onClick={handleResetData} className="text-[10px] text-rose-400 font-bold hover:text-rose-600">LÀM MỚI DỮ LIỆU</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold ml-1">TIỀN MẶT</label>
                    <input type="number" placeholder="0" value={settings.initialCash || ''} onChange={e => setSettings({...settings, initialCash: +e.target.value})} className="w-full bg-slate-50 p-3.5 rounded-2xl text-base font-bold outline-none border border-transparent focus:border-indigo-100 focus:bg-white transition-all"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold ml-1">TÀI KHOẢN</label>
                    <input type="number" placeholder="0" value={settings.initialBank || ''} onChange={e => setSettings({...settings, initialBank: +e.target.value})} className="w-full bg-slate-50 p-3.5 rounded-2xl text-base font-bold outline-none border border-transparent focus:border-indigo-100 focus:bg-white transition-all"/>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold ml-1">CHI PHÍ SINH HOẠT MỤC TIÊU / NGÀY</label>
                    <input type="number" placeholder="Dùng để tính số ngày duy trì..." value={settings.dailyCost || ''} onChange={e => setSettings({...settings, dailyCost: +e.target.value})} className="w-full bg-slate-50 p-3.5 rounded-2xl text-base font-bold outline-none border border-transparent focus:border-indigo-100 focus:bg-white transition-all"/>
                  </div>
                </div>
             </div>
             <Dashboard stats={stats} transactions={transactions} />
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="max-w-xl mx-auto space-y-5">
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
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="h-full max-w-xl mx-auto">
            {isOnline ? (
              <AIChat 
                transactions={transactions} 
                stats={stats} 
                onAddTransaction={handleAddTransaction} 
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-wifi-slash text-4xl text-slate-300"></i>
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-800">Cần kết nối mạng</h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">Tính năng trợ lý AI yêu cầu Internet để xử lý giọng nói và tư vấn tài chính.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Navigation Bottom chuẩn Mobile App */}
      <nav className="fixed bottom-0 inset-x-0 h-20 bg-white border-t border-slate-100 flex justify-around items-center px-6 pb-4 glass-effect shadow-[0_-10px_25px_rgba(0,0,0,0.03)]">
        {[
          { id: 'dashboard', icon: 'fa-chart-pie', label: 'Tổng quan' },
          { id: 'transactions', icon: 'fa-exchange-alt', label: 'Thu Chi' },
          { id: 'ai', icon: 'fa-magic', label: 'AI Trợ Lý' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative ${
              activeTab === tab.id 
                ? 'text-indigo-600 scale-110' 
                : 'text-slate-400'
            }`}
          >
            {activeTab === tab.id && (
              <span className="absolute -top-3 w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
            )}
            <i className={`fas ${tab.icon} text-xl`}></i>
            <span className="text-[10px] font-black uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
