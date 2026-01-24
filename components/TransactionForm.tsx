
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

  // Logic tiên đoán 2.1: Chỉ dự đoán kí tự đầu tiên hoặc <cách> ký tự đầu (đầu mỗi từ)
  const suggestions = useMemo(() => {
    if (!content) return [];
    const lowerInput = content.toLowerCase();
    
    return PREDEFINED_KEYWORDS.filter(kw => {
      const kwLower = kw.toLowerCase();
      // Khớp từ đầu toàn cụm hoặc khớp ngay sau dấu cách
      return kwLower.startsWith(lowerInput) || kwLower.includes(" " + lowerInput);
    });
  }, [content]);

  const handleSuggestionClick = (val: string) => {
    setContent(val);
    setShowSuggestions(false);
  };

  return (
    <div className={`p-6 rounded-[40px] border border-slate-100 transition-all shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] ${editingTransaction ? 'bg-amber-50 border-amber-200' : 'bg-white'}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-black flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg ${editingTransaction ? 'bg-amber-500 shadow-amber-200' : 'bg-indigo-600 shadow-indigo-200'}`}>
            <i className={`fas ${editingTransaction ? 'fa-edit' : 'fa-plus-circle'} text-[10px]`}></i>
          </div>
          <span className="text-slate-800 tracking-tight uppercase">Thông tin dòng tiền</span>
        </h3>
        {editingTransaction && <button onClick={onCancelEdit} className="text-[9px] font-black text-rose-500 uppercase tracking-widest border-b-2 border-rose-100 pb-0.5">Hủy</button>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Ngày giao dịch</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-[10px] font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all" />
          </div>
          
          <div className="relative">
            <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Nội dung</label>
            <input 
              type="text" 
              value={content} 
              onFocus={() => setShowSuggestions(true)}
              onChange={e => { setContent(e.target.value); setShowSuggestions(true); }} 
              placeholder="Nhập..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-[10px] font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all" 
            />
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 bottom-full mb-3 w-full flex gap-2 overflow-x-auto pb-3 no-scrollbar z-50 animate-in slide-in-from-bottom-2">
                {suggestions.map((s, i) => (
                  <button 
                    key={i} 
                    type="button" 
                    onClick={() => handleSuggestionClick(s)}
                    className="flex-none bg-white text-indigo-600 border border-indigo-100 text-[9px] font-black px-4 py-2 rounded-2xl shadow-[0_10px_20px_-5px_rgba(79,70,229,0.2)] whitespace-nowrap active:scale-95 transition-all hover:bg-indigo-600 hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-1.5 rounded-2xl flex gap-1 border border-slate-200 shadow-inner">
            {[TransactionType.EXPENSE, TransactionType.INCOME].map(t => (
              <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 py-2.5 text-[8px] font-black rounded-xl transition-all ${type === t ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' : 'text-slate-400'}`}>{t.toUpperCase()}</button>
            ))}
          </div>
          <div className="bg-slate-50 p-1.5 rounded-2xl flex gap-1 border border-slate-200 shadow-inner">
            {[PaymentSource.CASH, PaymentSource.BANK].map(s => (
              <button key={s} type="button" onClick={() => setSource(s)} className={`flex-1 py-2.5 text-[8px] font-black rounded-xl transition-all ${source === s ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' : 'text-slate-400'}`}>{s.split(' ')[0].toUpperCase()}</button>
            ))}
          </div>
        </div>

        <div className="relative py-2">
           <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-white px-3 text-[7px] font-black text-slate-400 uppercase tracking-widest z-10 border border-slate-100 rounded-full">Số tiền</div>
           <input type="text" inputMode="numeric" value={displayAmount} onChange={handleAmountChange} placeholder="0đ" className={`w-full text-3xl font-black text-center py-5 bg-slate-50 rounded-3xl border-2 border-slate-100 outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-inner ${type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`} />
        </div>

        <button type="submit" className={`w-full py-4.5 rounded-[22px] font-black text-white text-[11px] uppercase tracking-widest active:scale-[0.98] transition-all shadow-xl ${editingTransaction ? 'bg-amber-500 shadow-amber-100 border-b-4 border-amber-700' : 'bg-indigo-600 shadow-indigo-100 border-b-4 border-indigo-800'}`}>
          {editingTransaction ? 'Lưu thay đổi' : 'Ghi nhận giao dịch'}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
