
import React, { useState } from 'react';
import { Transaction, TransactionType, PaymentSource, Settings } from '../types';
import { exportToCSV } from '../services/exportService';

interface Props {
  transactions: Transaction[];
  settings: Settings;
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  onUpdateStates: (id: string, updates: Partial<Transaction>) => void;
}

const TransactionList: React.FC<Props> = ({ transactions, settings, onDelete, onEdit, onUpdateStates }) => {
  const [activeActions, setActiveActions] = useState<string | null>(null);
  
  const formatCurrency = (amount: number) => amount.toLocaleString('vi-VN') + 'đ';

  const toggleActions = (id: string) => {
    setActiveActions(activeActions === id ? null : id);
  };

  return (
    <div className="bg-tech-800 rounded-2xl border border-tech-border overflow-hidden shadow-sm">
      <div className="p-6 border-b border-tech-border/50 flex justify-between items-center sticky top-0 bg-tech-800 z-20">
        <div>
          <h3 className="text-[13px] font-black tracking-widest uppercase text-white">Lịch sử dữ liệu</h3>
          <p className="text-[10px] font-bold text-tech-muted/80 uppercase mt-1">{transactions.length} Giao dịch</p>
        </div>
        <button onClick={() => exportToCSV(transactions, settings)} className="w-12 h-12 bg-tech-cyan/10 text-tech-cyan rounded-2xl border border-tech-cyan/20 flex items-center justify-center active:scale-90 transition-all"><i className="fas fa-download text-[14px]"></i></button>
      </div>

      <div className="divide-y divide-slate-50">
        {transactions.length === 0 ? (
          <div className="py-20 text-center opacity-20 flex flex-col items-center gap-3 text-tech-muted/80"><i className="fas fa-database text-3xl"></i><p className="text-[11px] font-black uppercase tracking-widest">Không có dữ liệu</p></div>
        ) : (
          transactions.map((t) => (
            <div 
              key={t.id} 
              className={`transition-all duration-300 relative group overflow-hidden ${activeActions === t.id ? 'bg-tech-cyan/10' : 'hover:bg-tech-900'}`}
            >
              <div 
                className={`p-6 transition-transform duration-300 ${activeActions === t.id ? 'translate-x-[-150px]' : ''}`}
                onClick={() => toggleActions(t.id)}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] font-black text-tech-muted/80 font-mono tracking-tighter">{new Date(t.date).toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit'})}</span>
                      <h4 className="font-bold text-white text-[13px] tracking-tight truncate max-w-[160px]">{t.content}</h4>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-xl border uppercase tracking-wider ${t.type === TransactionType.INCOME ? 'text-emerald-600 border-emerald-500/30 bg-emerald-500/10' : 'text-rose-600 border-rose-500/30 bg-rose-500/10'}`}>{t.type}</span>
                      <span className="text-[9px] font-bold text-tech-muted/80 uppercase">
                        {t.source === PaymentSource.CASH ? 'Tiền' : 'ATM'}
                      </span>
                      {t.type === TransactionType.EXPENSE && (
                        <div className="flex items-center gap-2 ml-2">
                           {t.isExcluded && <i className="fas fa-star text-[10px] text-amber-500"></i>}
                           {t.isFromSavings && <i className="fas fa-tint text-[10px] text-tech-cyan"></i>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className={`font-black text-[14px] tracking-tighter ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount)}
                    </div>
                    <div className="flex gap-3 mt-3">
                       <button onClick={(e) => {e.stopPropagation(); onEdit(t)}} className="text-tech-muted/60 hover:text-tech-cyan p-1"><i className="fas fa-pen text-[10px]"></i></button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Overlay */}
              <div className={`absolute top-0 right-0 h-full flex transition-transform duration-300 border-l border-tech-cyan/20 bg-tech-800 shadow-[-15px_0_30px_rgba(0,0,0,0.05)] ${activeActions === t.id ? 'translate-x-0' : 'translate-x-full'}`}>
                 <button 
                   onClick={() => { onUpdateStates(t.id, { isExcluded: !t.isExcluded }); setActiveActions(null); }}
                   className={`w-18 px-4 flex flex-col items-center justify-center gap-1.5 transition-colors ${t.isExcluded ? 'bg-amber-500/100 text-white' : 'bg-tech-900 text-tech-muted/80'}`}
                 >
                   <i className="fas fa-star text-[14px]"></i>
                   <span className="text-[8px] font-black uppercase">Sao</span>
                 </button>
                 <button 
                   onClick={() => { onUpdateStates(t.id, { isFromSavings: !t.isFromSavings }); setActiveActions(null); }}
                   className={`w-18 px-4 flex flex-col items-center justify-center gap-1.5 transition-colors ${t.isFromSavings ? 'bg-tech-cyan text-tech-900' : 'bg-tech-900 text-tech-muted/80 border-l border-tech-border'}`}
                 >
                   <i className="fas fa-tint text-[14px]"></i>
                   <span className="text-[8px] font-black uppercase">Quỹ</span>
                 </button>
                 <button 
                   onClick={() => onDelete(t.id)}
                   className="w-18 px-4 bg-rose-500/100 text-white flex flex-col items-center justify-center gap-1.5"
                 >
                   <i className="fas fa-trash text-[14px]"></i>
                   <span className="text-[8px] font-black uppercase">Xóa</span>
                 </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionList;
