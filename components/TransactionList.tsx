
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
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
        <div>
          <h3 className="text-lg font-black text-slate-800">Lịch sử thu chi</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{transactions.length} giao dịch gần đây</p>
        </div>
        <button 
          onClick={() => exportToCSV(transactions, settings)}
          className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl active-scale border border-indigo-100 flex items-center gap-2"
        >
          <i className="fas fa-file-export text-sm"></i>
          <span className="text-xs font-bold hidden sm:inline">Tải CSV</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ghi chú</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Số tiền</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tác vụ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {transactions.length === 0 ? (
               <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <i className="fas fa-inbox text-4xl"></i>
                      <p className="text-sm font-bold">Chưa có dữ liệu</p>
                    </div>
                  </td>
               </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-[11px] font-bold text-slate-400">
                      {new Date(t.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-700 text-sm">{t.content}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {t.type}
                      </span>
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase bg-slate-100 text-slate-500">
                        {t.source}
                      </span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-right font-black text-sm whitespace-nowrap ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === TransactionType.INCOME ? '+' : '-'}{t.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onEdit(t)}
                        className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-500 hover:text-white transition-all active:scale-90 flex items-center justify-center"
                        title="Sửa"
                      >
                        <i className="fas fa-edit text-xs"></i>
                      </button>
                      <button 
                        onClick={() => onDelete(t.id)}
                        className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-90 flex items-center justify-center"
                        title="Xóa"
                      >
                        <i className="fas fa-trash-alt text-xs"></i>
                      </button>
                    </div>
                    {/* Hiển thị icon thao tác trên mobile thay vì group hover */}
                    <div className="sm:hidden flex items-center justify-center gap-3">
                       <button onClick={() => onEdit(t)} className="text-amber-500"><i className="fas fa-edit"></i></button>
                       <button onClick={() => onDelete(t.id)} className="text-rose-500"><i className="fas fa-trash-alt"></i></button>
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
