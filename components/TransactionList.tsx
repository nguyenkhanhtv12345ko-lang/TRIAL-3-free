
import React from 'react';
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
  const formatCurrency = (amount: number) => amount.toLocaleString('vi-VN') + 'đ';

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-20">
        <div>
          <h3 className="text-xs font-black tracking-tight uppercase text-slate-700">Lịch sử dữ liệu</h3>
          <p className="text-[7px] font-bold text-slate-400 uppercase mt-0.5">{transactions.length} Giao dịch</p>
        </div>
        <button onClick={() => exportToCSV(transactions, settings)} className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 flex items-center justify-center active:scale-90 transition-all"><i className="fas fa-download text-[10px]"></i></button>
      </div>

      <div className="divide-y divide-slate-50">
        {transactions.length === 0 ? (
          <div className="py-12 text-center opacity-20 flex flex-col items-center gap-2 text-slate-400"><i className="fas fa-database text-2xl"></i><p className="text-[8px] font-black uppercase tracking-widest">Chưa có dữ liệu</p></div>
        ) : (
          transactions.map((t) => (
            <div key={t.id} className="p-4 hover:bg-slate-50 transition-all group relative">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[7px] font-black text-slate-400 font-mono tracking-tighter">{new Date(t.date).toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit'})}</span>
                    <h4 className="font-bold text-slate-700 text-xs tracking-tight">{t.content}</h4>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[6px] font-black px-1 py-0.5 rounded border uppercase ${t.type === TransactionType.INCOME ? 'text-emerald-600 border-emerald-100 bg-emerald-50' : 'text-rose-600 border-rose-100 bg-rose-50'}`}>{t.type}</span>
                    {t.type === TransactionType.EXPENSE && (
                      <div className="flex items-center gap-1">
                         {t.isExcluded && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Đặc biệt"></span>}
                         {t.isFromSavings && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" title="Tích lũy"></span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-black text-xs tracking-tighter ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount)}</div>
                  <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => onEdit(t)} className="text-slate-400 hover:text-indigo-600"><i className="fas fa-edit text-[9px]"></i></button>
                    <button onClick={() => onDelete(t.id)} className="text-slate-400 hover:text-rose-500"><i className="fas fa-trash text-[9px]"></i></button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionList;
