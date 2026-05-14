
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
    <div className={`p-8 rounded-2xl border border-tech-border transition-all shadow-md ${editingTransaction ? 'bg-amber-500/10 border-amber-500/30' : 'bg-tech-800'}`}>
      <div className="flex justify-between items-center mb-7 px-1">
        <h3 className="text-[17px] font-black flex items-center gap-4 text-white uppercase tracking-widest">
          <i className={`fas ${editingTransaction ? 'fa-edit text-amber-500' : 'fa-plus-circle text-tech-cyan'} text-[20px]`}></i>
          {editingTransaction ? 'Sửa giao dịch' : 'Ghi nhận mới'}
        </h3>
        {editingTransaction && <button onClick={onCancelEdit} className="text-[13px] font-black text-rose-500 uppercase tracking-widest">Hủy</button>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-5">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-tech-900 border border-tech-border rounded-xl p-5 text-[17px] font-mono font-black outline-none focus:ring-2 focus:ring-tech-cyan/50 text-white" />
          <div className="relative">
            <input type="text" value={content} onFocus={() => setShowSuggestions(true)} onChange={e => { setContent(e.target.value); setShowSuggestions(true); }} placeholder="Nội dung..." className="w-full bg-tech-900 border border-tech-border rounded-xl p-5 text-[17px] font-black outline-none focus:ring-2 focus:ring-tech-cyan/50 text-white" />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 top-full mt-4 w-full flex gap-3 overflow-x-auto pb-4 z-50 no-scrollbar">
                {suggestions.map((s, i) => (
                  <button key={i} type="button" onClick={() => handleSuggestionClick(s)} className="bg-tech-cyan text-tech-900 text-[13px] font-black px-5 py-3 rounded-2xl whitespace-nowrap shadow-lg">{s}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-tech-900 p-2 rounded-xl flex gap-2 border border-tech-border">
            {[TransactionType.EXPENSE, TransactionType.INCOME].map(t => (
              <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 py-4 text-[13px] font-black rounded-2xl transition-all ${type === t ? 'bg-tech-800 text-tech-cyan shadow-md' : 'text-tech-muted/80'}`}>{t.toUpperCase()}</button>
            ))}
          </div>
          <div className="bg-tech-900 p-2 rounded-xl flex gap-2 border border-tech-border">
            {[PaymentSource.CASH, PaymentSource.BANK].map(s => (
              <button 
                key={s} 
                type="button" 
                onClick={() => setSource(s)} 
                className={`flex-1 py-4 text-[13px] font-black rounded-2xl transition-all ${source === s ? 'bg-tech-800 text-tech-cyan shadow-md' : 'text-tech-muted/80'}`}
              >
                {s === PaymentSource.CASH ? 'TIỀN' : 'ATM'}
              </button>
            ))}
          </div>
        </div>

        {type === TransactionType.EXPENSE && (
          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button" 
              onClick={() => setIsExcluded(!isExcluded)}
              className={`flex items-center justify-center gap-4 py-4 rounded-xl text-[13px] font-black transition-all border ${isExcluded ? 'bg-amber-100 border-amber-500/30 text-amber-700 shadow-inner' : 'bg-tech-900 border-tech-border text-tech-muted/80 opacity-60'}`}
            >
              <i className={`fas fa-star ${isExcluded ? 'text-[16px] text-amber-500' : 'text-[13px]'}`}></i>
              ĐẶC BIỆT
            </button>
            <button 
              type="button" 
              onClick={() => setIsFromSavings(!isFromSavings)}
              className={`flex items-center justify-center gap-4 py-4 rounded-xl text-[13px] font-black transition-all border ${isFromSavings ? 'bg-tech-cyan/20 border-tech-cyan/30 text-tech-cyan shadow-inner' : 'bg-tech-900 border-tech-border text-tech-muted/80 opacity-60'}`}
            >
              <i className={`fas fa-tint ${isFromSavings ? 'text-[16px] text-tech-cyan' : 'text-[13px]'}`}></i>
              DỰ TRỮ
            </button>
          </div>
        )}

        <input type="text" inputMode="numeric" value={displayAmount} onChange={handleAmountChange} placeholder="0đ" className={`w-full text-[40px] font-mono font-black text-center py-5 bg-tech-900 rounded-2xl border border-tech-border outline-none focus:ring-2 focus:ring-tech-cyan/50 transition-all ${type === TransactionType.INCOME ? 'text-emerald-500' : 'text-rose-500'}`} />

        <button type="submit" className="w-full py-6 bg-tech-cyan text-tech-900 font-black rounded-2xl text-[17px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
          {editingTransaction ? 'Lưu thay đổi' : 'Ghi nhận ngay'}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
