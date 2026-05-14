
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, TransactionType, PaymentSource, Settings, FinancialStats, User, UserRole } from './types';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Auth from './components/Auth';
import AdminPanel from './components/AdminPanel';
import { auth, db, logout as firebaseLogout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [settings, setSettings] = useState<Settings>({ userId: '', initialCash: 0, initialBank: 0, dailyCost: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'admin'>('dashboard');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Also listen to User profile in firestore to get role
        const unsubUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
             setUser(docSnap.data() as User);
          } else {
             // Create user profile if not exists
             const newUser: User = {
                username: firebaseUser.uid,
                name: firebaseUser.displayName || 'Người dùng',
                role: UserRole.USER,
                createdAt: new Date().toISOString()
             };
             setDoc(doc(db, 'users', firebaseUser.uid), newUser).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`));
             setUser(newUser);
          }
        }, (error) => handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`));
        return () => unsubUser();
      } else {
        setUser(null);
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setSettings({ userId: '', initialCash: 0, initialBank: 0, dailyCost: 0 });
      setTransactions([]);
      setActiveTab('dashboard');
      return;
    }

    // Subscribe to settings
    const unsubSettings = onSnapshot(doc(db, 'users', user.username, 'settings', 'default'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as Settings);
      } else {
        setSettings({ userId: user.username, initialCash: 0, initialBank: 0, dailyCost: 0 });
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.username}/settings/default`));

    // Subscribe to transactions
    const unsubTransactions = onSnapshot(collection(db, 'users', user.username, 'transactions'), (snapshot) => {
      const trans: Transaction[] = [];
      snapshot.forEach(docSnap => {
        trans.push(docSnap.data() as Transaction);
      });
      trans.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
      setTransactions(trans);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.username}/transactions`));

    return () => {
      unsubSettings();
      unsubTransactions();
    };
  }, [user]);

  // Sync settings when they change locally
  const handleSaveSettings = async (newSettings: Settings) => {
    setSettings(newSettings);
    if (user) {
       try {
           await setDoc(doc(db, 'users', user.username, 'settings', 'default'), {
               ...newSettings,
               userId: user.username,
               updatedAt: new Date().toISOString()
           });
       } catch (err) {
           handleFirestoreError(err, OperationType.WRITE, `users/${user.username}/settings/default`);
       }
    }
  };

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

  const handleLogout = useCallback(async () => {
    if (window.confirm("Thoát phiên làm việc an toàn?")) {
      await firebaseLogout();
    }
  }, []);

  const handleAmountInput = (value: string, key: keyof Settings) => {
    const numeric = Number(value.replace(/\D/g, ''));
    handleSaveSettings({...settings, [key]: numeric});
  };

  if (!authReady) return <div className="h-screen bg-tech-900 flex items-center justify-center text-tech-cyan">Loading...</div>;

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
                    <button onClick={() => handleSaveSettings({...settings, initialCash:0, initialBank:0, dailyCost:0})} className="text-[12px] font-black text-rose-400 uppercase tracking-widest hover:text-rose-300">RESET</button>
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
                onAdd={async (t) => {
                  try {
                    const id = Date.now().toString();
                    const newTx = {...t, id, userId: user.username, createdAt: new Date().toISOString()};
                    await setDoc(doc(db, 'users', user.username, 'transactions', id), newTx);
                  } catch (err) {
                    handleFirestoreError(err, OperationType.CREATE, `users/${user.username}/transactions`);
                  }
                }} 
                editingTransaction={editingTransaction}
                onUpdate={async (updated) => { 
                  try {
                    await setDoc(doc(db, 'users', user.username, 'transactions', updated.id), updated);
                    setEditingTransaction(null); 
                  } catch (err) {
                    handleFirestoreError(err, OperationType.UPDATE, `users/${user.username}/transactions/${updated.id}`);
                  }
                }}
                onCancelEdit={() => setEditingTransaction(null)}
              />
              <TransactionList 
                transactions={transactions} 
                settings={settings}
                onDelete={async (id) => { 
                  if (window.confirm('Xác nhận xóa giao dịch?')) {
                    try {
                      await deleteDoc(doc(db, 'users', user.username, 'transactions', id));
                    } catch (err) {
                      handleFirestoreError(err, OperationType.DELETE, `users/${user.username}/transactions/${id}`);
                    }
                  }
                }}
                onEdit={(t) => { setEditingTransaction(t); document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }); }}
                onUpdateStates={async (id, updates) => {
                    const t = transactions.find(x => x.id === id);
                    if (t) {
                      try {
                        await setDoc(doc(db, 'users', user.username, 'transactions', id), {...t, ...updates});
                      } catch (err) {
                        handleFirestoreError(err, OperationType.UPDATE, `users/${user.username}/transactions/${id}`);
                      }
                    }
                }}
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
