
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, PaymentSource } from '../types';

interface Props {
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  editingTransaction?: Transaction | null;
  onUpdate?: (t: Transaction) => void;
  onCancelEdit?: () => void;
}

const TransactionForm: React.FC<Props> = ({ onAdd, editingTransaction, onUpdate, onCancelEdit }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [source, setSource] = useState<PaymentSource>(PaymentSource.CASH);
  const [displayAmount, setDisplayAmount] = useState('');

  useEffect(() => {
    if (editingTransaction) {
      setDate(editingTransaction.date);
      setContent(editingTransaction.content);
      setType(editingTransaction.type);
      setSource(editingTransaction.source);
      setDisplayAmount(editingTransaction.amount.toLocaleString('vi-VN'));
    } else {
      resetForm();
    }
  }, [editingTransaction]);

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setContent('');
    setType(TransactionType.EXPENSE);
    setSource(PaymentSource.CASH);
    setDisplayAmount('');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const cleanValue = rawValue.replace(/^0+/, '');
    if (cleanValue === '') {
      setDisplayAmount('');
      return;
    }
    const formattedValue = Number(cleanValue).toLocaleString('vi-VN');
    setDisplayAmount(formattedValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(displayAmount.replace(/\./g, ''));
    if (!content || numericAmount <= 0) {
      alert("Vui lòng nhập đầy đủ nội dung và số tiền!");
      return;
    }
    
    if (editingTransaction && onUpdate) {
      onUpdate({
        ...editingTransaction,
        date,
        content,
        type,
        source,
        amount: numericAmount
      });
    } else {
      onAdd({
        date,
        content,
        type,
        source,
        amount: numericAmount
      });
    }
    resetForm();
  };

  return (
    <div className={`p-6 rounded-3xl shadow-xl border transition-all duration-300 ${
      editingTransaction 
        ? 'bg-amber-50 border-amber-300 ring-4 ring-amber-100' 
        : 'bg-white border-slate-100'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <i className={`fas ${editingTransaction ? 'fa-pen-to-square text-amber-500' : 'fa-plus-circle text-indigo-600'}`}></i>
          {editingTransaction ? 'CẬP NHẬT GIAO DỊCH' : 'THÊM MỚI'}
        </h3>
        {editingTransaction && (
          <button 
            onClick={onCancelEdit}
            className="text-[10px] font-black bg-rose-100 text-rose-600 px-3 py-1.5 rounded-full hover:bg-rose-200 transition-colors uppercase tracking-widest"
          >
            Hủy Sửa
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Ngày tháng</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Nội dung</label>
            <input 
              type="text" 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Mua sắm, ăn uống..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Loại</label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                type="button"
                onClick={() => setType(TransactionType.EXPENSE)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === TransactionType.EXPENSE ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500'}`}
              >
                Chi tiêu
              </button>
              <button 
                type="button"
                onClick={() => setType(TransactionType.INCOME)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === TransactionType.INCOME ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
              >
                Thu nhập
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Nguồn</label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                type="button"
                onClick={() => setSource(PaymentSource.CASH)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${source === PaymentSource.CASH ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500'}`}
              >
                Tiền mặt
              </button>
              <button 
                type="button"
                onClick={() => setSource(PaymentSource.BANK)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${source === PaymentSource.BANK ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
              >
                ATM
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Số tiền (VND)</label>
          <input 
            type="text" 
            inputMode="numeric"
            value={displayAmount}
            onChange={handleAmountChange}
            placeholder="0"
            className={`w-full text-3xl font-black text-center py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}
          />
        </div>

        <button 
          type="submit"
          className={`w-full py-4 rounded-2xl font-black text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 ${
            editingTransaction ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          <i className={`fas ${editingTransaction ? 'fa-save' : 'fa-check-double'}`}></i>
          {editingTransaction ? 'LƯU THAY ĐỔI' : 'XÁC NHẬN GIAO DỊCH'}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
