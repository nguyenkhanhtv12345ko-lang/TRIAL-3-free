
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, TransactionType, PaymentSource, Settings, FinancialStats, User, UserRole } from './types';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import AIChat from './components/AIChat';
import Auth from './components/Auth';
import AdminPanel from './components/AdminPanel';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  // Trạng thái người dùng - khởi tạo từ localStorage
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

  // States hỗ trợ hiển thị format số trong input
  const [displayInitialCash, setDisplayInitialCash] = useState('');
  const [displayInitialBank, setDisplayInitialBank] = useState('');
  const [displayDailyCost, setDisplayDailyCost] = useState('');

  // Xử lý khi người dùng thay đổi (Đăng nhập/Đăng xuất)
  useEffect(() => {
    if (user) {
      const savedSettings = localStorage.getItem(`cashflow_settings_${user.username}`);
      const savedTrans = localStorage.getItem(`cashflow_transactions_${user.username}`);
      
      const loadedSettings = savedSettings ? JSON.parse(savedSettings) : { userId: user.username, initialCash: 0, initialBank: 0, dailyCost: 0 };
      setSettings(loadedSettings);
      setTransactions(savedTrans ? JSON.parse(savedTrans) : []);
      
      setDisplayInitialCash(loadedSettings.initialCash?.toLocaleString('vi-VN') || '');
      setDisplayInitialBank(loadedSettings.initialBank?.toLocaleString('vi-VN') || '');
      setDisplayDailyCost(loadedSettings.dailyCost?.toLocaleString('vi-VN') || '');
      
      localStorage.setItem('cashflow_current_user', JSON.stringify(user));
    } else {
      // Khi logout: Reset toàn bộ state về mặc định
      setSettings({ userId: '', initialCash: 0, initialBank: 0, dailyCost: 0 });
      setTransactions([]);
      setActiveTab('dashboard');
      setDisplayInitialCash('');
      setDisplayInitialBank('');
      setDisplayDailyCost('');
    }
  }, [user]);

  // Lưu dữ liệu vào localStorage khi có thay đổi
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

  // Hàm đăng xuất được tối ưu hóa
  const handleLogout = useCallback(() => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?");
    if (confirmed) {
      // 1. Dọn dẹp session AI
      geminiService.resetSession();
      // 2. Xóa khỏi localStorage ngay lập tức
      localStorage.removeItem('cashflow_current_user');
      // 3. Cập nhật state để React re-render và hiển thị màn hình Auth
      setUser(null);
    }
  }, []);

  // Nếu không có user, hiển thị màn hình Auth (Đăng nhập/Đăng ký)
  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
      <header className="flex-none bg-white border-b border-slate-100 px-5 pt-[env(safe-area-inset-top,1rem)] h-[calc(4.5rem+env(safe-area-inset-top,0px))] flex items-center justify-between z-50 glass-effect">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all ${user.role === UserRole.ADMIN ? 'bg-amber-500 shadow-amber-100' : 'bg-indigo-600 shadow-indigo-100'}`}>
            <i className={`fas ${user.role === UserRole.ADMIN ? 'fa-user-shield' : 'fa-wallet'} text-white text-sm`}></i>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[13px] font-black text-slate-800 uppercase tracking-tight truncate max-w-[140px] leading-tight mb-0.5">{user.name}</h1>
            <span className={`text-[8px] w-fit font-black uppercase px-1.5 py-0.5 rounded-md ${user.role === UserRole.ADMIN ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {user.role === UserRole.ADMIN ? 'Quản trị viên' : 'Thành viên'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {user.role === UserRole.ADMIN && (
            <button 
              onClick={() => setActiveTab('admin')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeTab === 'admin' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100'}`}
            >
              <i className="fas fa-users-cog text-xs"></i>
            </button>
          )}
          <button 
            onClick={handleLogout}
            className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center active:scale-90 border border-rose-100 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
            title="Đăng xuất nhanh"
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
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                     <i className="fas fa-coins text-indigo-500"></i> Khởi tạo tài chính (Vốn đầu kỳ)
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-black ml-1 uppercase">Tiền mặt hiện có</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          inputMode="numeric"
                          placeholder="0"
                          value={displayInitialCash} 
                          onChange={e => handleFormatInput(e.target.value, setDisplayInitialCash, 'initialCash')} 
                          className="w-full bg-slate-50 p-4 pr-12 rounded-2xl text-sm font-black outline-none border border-transparent focus:border-amber-200 focus:bg-white transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">đ</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-black ml-1 uppercase">Tiền trong thẻ/ATM</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          inputMode="numeric"
                          placeholder="0"
                          value={displayInitialBank} 
                          onChange={e => handleFormatInput(e.target.value, setDisplayInitialBank, 'initialBank')} 
                          className="w-full bg-slate-50 p-4 pr-12 rounded-2xl text-sm font-black outline-none border border-transparent focus:border-indigo-200 focus:bg-white transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">đ</span>
                      </div>
                    </div>
                    <div className="col-span-2 space-y-2 mt-2 pt-4 border-t border-slate-50">
                      <label className="text-[10px] text-slate-400 font-black uppercase text-center block w-full tracking-widest">Hạn mức chi tiêu mục tiêu mỗi ngày</label>
                      <div className="relative max-w-[280px] mx-auto">
                        <input 
                          type="text" 
                          inputMode="numeric"
                          placeholder="Nhập số tiền..." 
                          value={displayDailyCost} 
                          onChange={e => handleFormatInput(e.target.value, setDisplayDailyCost, 'dailyCost')} 
                          className="w-full bg-indigo-50/50 p-5 rounded-2xl text-2xl font-black text-indigo-700 outline-none border border-indigo-100 focus:bg-white transition-all text-center"
                        />
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase">VND / Ngày</div>
                      </div>
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
          { id: 'dashboard', icon: 'fa-th-large', label: 'Ví của tôi' },
          { id: 'transactions', icon: 'fa-exchange-alt', label: 'Lịch sử' },
          { id: 'ai', icon: 'fa-robot', label: 'Hỏi AI' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative group ${
              activeTab === tab.id ? 'text-indigo-600 scale-110' : 'text-slate-400'
            }`}
          >
            {activeTab === tab.id && <span className="absolute -top-4 w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></span>}
            <i className={`fas ${tab.icon} text-lg`}></i>
            <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
