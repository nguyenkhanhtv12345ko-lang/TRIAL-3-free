
import React, { useState } from 'react';
import { Transaction, TransactionType, PaymentSource } from '../types';

interface Props {
  onAdd: (t: Omit<Transaction, 'id'>) => void;
}

const TransactionForm: React.FC<Props> = ({ onAdd }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [source, setSource] = useState<PaymentSource>(PaymentSource.CASH);
  const [displayAmount, setDisplayAmount] = useState(''); // State lưu chuỗi hiển thị có dấu phân cách

  // Hàm định dạng số khi người dùng nhập
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Chỉ giữ lại các chữ số
    const rawValue = e.target.value.replace(/\D/g, '');
    
    // Loại bỏ số 0 ở đầu nếu có nhiều hơn 1 chữ số
    const cleanValue = rawValue.replace(/^0+/, '');

    if (cleanValue === '') {
      setDisplayAmount('');
      return;
    }

    // Định dạng có dấu chấm phân cách phần nghìn (VND style)
    const formattedValue = Number(cleanValue).toLocaleString('vi-VN');
    setDisplayAmount(formattedValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(displayAmount.replace(/\./g, ''));
    
    if (!content || numericAmount <= 0) return;
    
    onAdd({
      date,
      content,
      type,
      source,
      amount: numericAmount
    });

    setContent('');
    setDisplayAmount('');
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
         <i className="fas fa-plus-circle text-indigo-500"></i>
         Thêm giao dịch mới
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Ngày</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nội dung</label>
          <input 
            type="text" 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ví dụ: Ăn trưa, Tiền lương..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Phân loại</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value as TransactionType)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={TransactionType.INCOME}>Thu</option>
              <option value={TransactionType.EXPENSE}>Chi</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nguồn tiền</label>
            <select 
              value={source} 
              onChange={(e) => setSource(e.target.value as PaymentSource)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={PaymentSource.CASH}>Tiền mặt</option>
              <option value={PaymentSource.BANK}>Tài khoản</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Số tiền (VND)</label>
          <div className="relative">
            <input 
              type="text" 
              inputMode="numeric"
              value={displayAmount}
              onChange={handleAmountChange}
              placeholder="0"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-2xl font-black text-indigo-900 placeholder-slate-300"
            />
            {displayAmount && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">VND</span>
            )}
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg active:scale-95 flex items-center justify-center gap-2"
        >
          <i className="fas fa-check-circle"></i>
          Xác nhận giao dịch
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
