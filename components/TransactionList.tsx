
import React from 'react';
import { Transaction, TransactionType, PaymentSource, Settings } from '../types';
import { exportToCSV } from '../services/exportService';

interface Props {
  transactions: Transaction[];
  settings: Settings;
  onDelete: (id: string) => void;
}

const TransactionList: React.FC<Props> = ({ transactions, settings, onDelete }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Danh sách giao dịch</h3>
          <span className="text-xs text-slate-400">{transactions.length} bản ghi</span>
        </div>
        <button 
          onClick={() => exportToCSV(transactions, settings)}
          className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-100"
        >
          <i className="fas fa-file-export"></i>
          <span className="hidden sm:inline">Xuất sao kê</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 md:px-6 py-4">Ngày</th>
              <th className="px-4 md:px-6 py-4">Nội dung</th>
              <th className="px-4 md:px-6 py-4 text-center">Loại</th>
              <th className="px-4 md:px-6 py-4 text-center hidden sm:table-cell">Nguồn</th>
              <th className="px-4 md:px-6 py-4 text-right">Số tiền</th>
              <th className="px-4 md:px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
            {transactions.length === 0 ? (
               <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">Chưa có giao dịch nào.</td>
               </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 md:px-6 py-4 text-slate-500 font-medium">
                    {new Date(t.date).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 md:px-6 py-4 font-semibold text-slate-700">
                    <div className="max-w-[120px] md:max-w-none truncate">{t.content}</div>
                    <div className="sm:hidden text-[10px] text-slate-400 font-normal">{t.source}</div>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-center hidden sm:table-cell">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${t.source === PaymentSource.CASH ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                      {t.source}
                    </span>
                  </td>
                  <td className={`px-4 md:px-6 py-4 text-right font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.amount.toLocaleString()}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right">
                    <button 
                      onClick={() => onDelete(t.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors p-2"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
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
