
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, PaymentSource } from '../types';

interface Props {
  onAdd: (t: Omit<Transaction, 'id' | 'userId'>) => void;
  editingTransaction?: Transaction | null;
  onUpdate?: (t: Transaction) => void;
  onCancelEdit?: () => void;
}

const PREDEFINED_KEYWORDS = [
  'ăn sáng', 'ăn trưa', 'ăn tối', 'đi chợ', 'đi BHX', 
  'tài liệu', 'đi chơi', 'ăn mỳ Cay', 'thanh toán', 
  'mua trà sữa', 'nạp game', 'đổ xăng', 'gửi xe 1k'
];

const TransactionForm: React.FC<Props> = ({ onAdd, editingTransaction, onUpdate, onCancelEdit }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [source, setSource] = useState<PaymentSource>(PaymentSource.CASH);
  const [displayAmount, setDisplayAmount] = useState('');
  const [isExcluded, setIsExcluded] = useState(false);
  const [isFromSavings, setIsFromSavings] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      setDate(editingTransaction.date);
      setContent(editingTransaction.content);
      setType(editingTransaction.type);
      setSource(editingTransaction.source);
      setDisplayAmount(editingTransaction.amount.toLocaleString('vi-VN'));
      setIsExcluded(!!editingTransaction.isExcluded);
      setIsFromSavings(!!editingTransaction.isFromSavings);
    } else { resetForm(); }
  }, [editingTransaction]);

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setContent('');
    setType(TransactionType.EXPENSE);
    setSource(PaymentSource.CASH);
    setDisplayAmount('');
    setIsExcluded(false);
    setIsFromSavings(false);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setDisplayAmount(rawValue ? Number(rawValue).toLocaleString('vi-VN') : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(displayAmount.replace(/\D/g, ''));
    if (!content || numericAmount <= 0) return alert("Vui lòng nhập đầy đủ!");
    const data = { date, content, type, source, amount: numericAmount, isExcluded: type === TransactionType.EXPENSE ? isExcluded : false, isFromSavings: type === TransactionType.EXPENSE ? isFromSavings : false };
    if (editingTransaction && onUpdate) onUpdate({ ...editingTransaction, ...data });
    else onAdd(data);
    resetForm();
  };

  const suggestions = useMemo(() => {
    if (!content) return [];
    const lowerInput = content.toLowerCase();
    return PREDEFINED_KEYWORDS.filter(kw => kw.toLowerCase().startsWith(lowerInput) || kw.toLowerCase().includes(" " + lowerInput));
  }, [content]);

  const handleSuggestionClick = (val: string) => {
    setContent(val);
    setShowSuggestions(false);
  };

  return (
    <div className={`p-5 rounded-[32px] border border-slate-100 transition-all shadow-sm ${editingTransaction ? 'bg-amber-50 border-amber-200' : 'bg-white'}`}>
      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="text-[10px] font-black flex items-center gap-3 text-slate-700 uppercase tracking-widest">
          <i className={`fas ${editingTransaction ? 'fa-edit text-amber-500' : 'fa-plus-circle text-indigo-600'}`}></i>
          {editingTransaction ? 'Sửa giao dịch' : 'Ghi nhận mới'}
        </h3>
        {editingTransaction && <button onClick={onCancelEdit} className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Hủy</button>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-[10px] font-black outline-none focus:bg-white" />
          <div className="relative">
            <input type="text" value={content} onFocus={() => setShowSuggestions(true)} onChange={e => { setContent(e.target.value); setShowSuggestions(true); }} placeholder="Nội dung..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-[10px] font-black outline-none focus:bg-white" />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 top-full mt-2 w-full flex gap-2 overflow-x-auto pb-2 z-50 no-scrollbar">
                {suggestions.map((s, i) => (
                  <button key={i} type="button" onClick={() => handleSuggestionClick(s)} className="bg-indigo-600 text-white text-[8px] font-black px-3 py-1.5 rounded-xl whitespace-nowrap shadow-md">{s}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 p-1 rounded-2xl flex gap-1 border border-slate-100">
            {[TransactionType.EXPENSE, TransactionType.INCOME].map(t => (
              <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 py-2 text-[8px] font-black rounded-xl transition-all ${type === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>{t.toUpperCase()}</button>
            ))}
          </div>
          <div className="bg-slate-50 p-1 rounded-2xl flex gap-1 border border-slate-100">
            {[PaymentSource.CASH, PaymentSource.BANK].map(s => (
              <button 
                key={s} 
                type="button" 
                onClick={() => setSource(s)} 
                className={`flex-1 py-2 text-[8px] font-black rounded-xl transition-all ${source === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                {s === PaymentSource.CASH ? 'TIỀN' : 'ATM'}
              </button>
            ))}
          </div>
        </div>

        {type === TransactionType.EXPENSE && (
          <div className="grid grid-cols-2 gap-2">
            <button 
              type="button" 
              onClick={() => setIsExcluded(!isExcluded)}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[8px] font-black transition-all border ${isExcluded ? 'bg-amber-100 border-amber-200 text-amber-700 shadow-inner' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'}`}
            >
              <i className={`fas fa-star ${isExcluded ? 'text-amber-500' : ''}`}></i>
              ĐẶC BIỆT
            </button>
            <button 
              type="button" 
              onClick={() => setIsFromSavings(!isFromSavings)}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[8px] font-black transition-all border ${isFromSavings ? 'bg-indigo-100 border-indigo-200 text-indigo-700 shadow-inner' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'}`}
            >
              <i className={`fas fa-tint ${isFromSavings ? 'text-indigo-500' : ''}`}></i>
              TỪ TÍCH LŨY
            </button>
          </div>
        )}

        <input type="text" inputMode="numeric" value={displayAmount} onChange={handleAmountChange} placeholder="0đ" className={`w-full text-2xl font-black text-center py-3 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:bg-white transition-all ${type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`} />

        <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-[24px] text-[10px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">
          {editingTransaction ? 'Lưu thay đổi' : 'Ghi nhận'}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
