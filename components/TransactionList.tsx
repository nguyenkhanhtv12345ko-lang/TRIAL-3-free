
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
    <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-50 flex justify-between items-center sticky top-0 bg-white z-20">
        <div>
          <h3 className="text-[10px] font-black tracking-widest uppercase text-slate-700">Lịch sử dữ liệu</h3>
          <p className="text-[7px] font-bold text-slate-400 uppercase mt-0.5">{transactions.length} Giao dịch</p>
        </div>
        <button onClick={() => exportToCSV(transactions, settings)} className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 flex items-center justify-center active:scale-90 transition-all"><i className="fas fa-download text-[10px]"></i></button>
      </div>

      <div className="divide-y divide-slate-50">
        {transactions.length === 0 ? (
          <div className="py-12 text-center opacity-20 flex flex-col items-center gap-2 text-slate-400"><i className="fas fa-database text-xl"></i><p className="text-[8px] font-black uppercase tracking-widest">Trống</p></div>
        ) : (
          transactions.map((t) => (
            <div 
              key={t.id} 
              className={`transition-all duration-300 relative group overflow-hidden ${activeActions === t.id ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}
            >
              <div 
                className={`p-4 transition-transform duration-300 ${activeActions === t.id ? 'translate-x-[-120px]' : ''}`}
                onClick={() => toggleActions(t.id)}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[7px] font-black text-slate-400 font-mono tracking-tighter">{new Date(t.date).toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit'})}</span>
                      <h4 className="font-bold text-slate-700 text-[10px] tracking-tight truncate max-w-[140px]">{t.content}</h4>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[6px] font-black px-1.5 py-0.5 rounded-lg border uppercase tracking-wider ${t.type === TransactionType.INCOME ? 'text-emerald-600 border-emerald-100 bg-emerald-50' : 'text-rose-600 border-rose-100 bg-rose-50'}`}>{t.type}</span>
                      <span className="text-[6px] font-bold text-slate-400 uppercase">
                        {t.source === PaymentSource.CASH ? 'Tiền' : 'ATM'}
                      </span>
                      {t.type === TransactionType.EXPENSE && (
                        <div className="flex items-center gap-1.5 ml-1">
                           {t.isExcluded && <i className="fas fa-star text-[7px] text-amber-500"></i>}
                           {t.isFromSavings && <i className="fas fa-tint text-[7px] text-indigo-500"></i>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className={`font-black text-[11px] tracking-tighter ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount)}
                    </div>
                    <div className="flex gap-2 mt-2">
                       <button onClick={(e) => {e.stopPropagation(); onEdit(t)}} className="text-slate-300 hover:text-indigo-600"><i className="fas fa-pen text-[8px]"></i></button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Overlay khi kéo ra/ấn vào */}
              <div className={`absolute top-0 right-0 h-full flex transition-transform duration-300 border-l border-indigo-100 bg-white shadow-[-10px_0_20px_rgba(0,0,0,0.03)] ${activeActions === t.id ? 'translate-x-0' : 'translate-x-full'}`}>
                 <button 
                   onClick={() => { onUpdateStates(t.id, { isExcluded: !t.isExcluded }); setActiveActions(null); }}
                   className={`w-15 px-3 flex flex-col items-center justify-center gap-1 transition-colors ${t.isExcluded ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-400'}`}
                 >
                   <i className="fas fa-star text-[10px]"></i>
                   <span className="text-[6px] font-black uppercase">Đặc biệt</span>
                 </button>
                 <button 
                   onClick={() => { onUpdateStates(t.id, { isFromSavings: !t.isFromSavings }); setActiveActions(null); }}
                   className={`w-15 px-3 flex flex-col items-center justify-center gap-1 transition-colors ${t.isFromSavings ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 border-l border-slate-100'}`}
                 >
                   <i className="fas fa-tint text-[10px]"></i>
                   <span className="text-[6px] font-black uppercase">Dự trữ</span>
                 </button>
                 <button 
                   onClick={() => onDelete(t.id)}
                   className="w-15 px-3 bg-rose-500 text-white flex flex-col items-center justify-center gap-1"
                 >
                   <i className="fas fa-trash text-[10px]"></i>
                   <span className="text-[6px] font-black uppercase">Xóa</span>
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
