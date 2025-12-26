
import React from 'react';
import { Transaction, TransactionType, PaymentSource, Settings } from '../types';
import { exportToCSV } from '../services/exportService';

interface Props {
  transactions: Transaction[];
  settings: Settings;
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

const TransactionList: React.FC<Props> = ({ transactions, settings, onDelete, onEdit }) => {
  // Hàm định dạng tiền tệ chuẩn VN
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10 glass-effect">
        <div>
          <h3 className="text-lg font-black text-slate-800">Lịch sử giao dịch</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{transactions.length} bản ghi</p>
        </div>
        <button 
          onClick={() => exportToCSV(transactions, settings)}
          className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl active-scale border border-indigo-100 flex items-center gap-2 hover:bg-indigo-100 transition-colors"
        >
          <i className="fas fa-file-export text-sm"></i>
          <span className="text-xs font-bold hidden sm:inline">Xuất CSV</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Số tiền</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tác vụ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {transactions.length === 0 ? (
               <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                      <i className="fas fa-receipt text-5xl"></i>
                      <p className="text-sm font-black uppercase tracking-widest">Chưa có giao dịch</p>
                    </div>
                  </td>
               </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="text-[11px] font-black text-slate-400">
                      {new Date(t.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    </div>
                    <div className="text-[9px] font-bold text-slate-300 mt-0.5">{new Date(t.date).getFullYear()}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-700 text-sm leading-tight">{t.content}</div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase border ${
                        t.type === TransactionType.INCOME 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {t.type}
                      </span>
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase bg-slate-100 text-slate-500 border border-slate-200">
                        {t.source}
                      </span>
                    </div>
                  </td>
                  <td className={`px-6 py-5 text-right font-black text-sm whitespace-nowrap ${
                    t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                  <td className="px-6 py-5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => onEdit(t)}
                        className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white transition-all active:scale-90 flex items-center justify-center border border-amber-100 sm:opacity-0 group-hover:opacity-100"
                        title="Sửa"
                      >
                        <i className="fas fa-edit text-xs"></i>
                      </button>
                      <button 
                        onClick={() => onDelete(t.id)}
                        className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition-all active:scale-90 flex items-center justify-center border border-rose-100 sm:opacity-0 group-hover:opacity-100"
                        title="Xóa"
                      >
                        <i className="fas fa-trash-alt text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList;
