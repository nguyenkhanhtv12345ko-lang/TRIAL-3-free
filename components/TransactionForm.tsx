
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

  // Logic tiên đoán: Chỉ dự đoán kí tự đầu tiên hoặc kí tự <phím cách>kí tự đầu
  const suggestions = useMemo(() => {
    if (!content) return [];
    const lowerInput = content.toLowerCase();
    
    return PREDEFINED_KEYWORDS.filter(kw => {
      const kwLower = kw.toLowerCase();
      // Khớp từ đầu hoặc khớp sau dấu cách (đầu mỗi từ trong cụm từ)
      return kwLower.startsWith(lowerInput) || kwLower.includes(" " + lowerInput);
    });
  }, [content]);

  const handleSuggestionClick = (val: string) => {
    setContent(val);
    setShowSuggestions(false);
  };

  return (
    <div className={`p-5 rounded-[32px] border border-slate-100 transition-all shadow-sm ${editingTransaction ? 'bg-amber-50 border-amber-200' : 'bg-white'}`}>
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-xs font-black flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white ${editingTransaction ? 'bg-amber-500' : 'bg-indigo-600 shadow-lg shadow-indigo-100'}`}><i className={`fas ${editingTransaction ? 'fa-edit' : 'fa-plus'} text-[8px]`}></i></div>
          <span className="text-slate-700 tracking-tight uppercase">{editingTransaction ? 'CẬP NHẬT' : 'GIAO DỊCH MỚI'}</span>
        </h3>
        {editingTransaction && <button onClick={onCancelEdit} className="text-[8px] font-black text-rose-500 uppercase tracking-widest hover:underline">Hủy sửa</button>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <i className="fas fa-calendar absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[9px]"></i>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-400 focus:bg-white transition-all" />
          </div>
          
          <div className="relative group">
            <i className="fas fa-pen absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[9px]"></i>
            <input 
              type="text" 
              value={content} 
              onFocus={() => setShowSuggestions(true)}
              onChange={e => { setContent(e.target.value); setShowSuggestions(true); }} 
              placeholder="Nội dung..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-400 focus:bg-white transition-all" 
            />
            
            {/* Thanh đề xuất nhập nhanh */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 bottom-full mb-2 w-full flex gap-1 overflow-x-auto pb-2 custom-scrollbar scroll-smooth no-scrollbar z-30">
                {suggestions.map((s, i) => (
                  <button 
                    key={i} 
                    type="button" 
                    onClick={() => handleSuggestionClick(s)}
                    className="flex-none bg-white text-indigo-600 border border-indigo-100 text-[8px] font-black px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap active:scale-95 transition-transform hover:bg-indigo-600 hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-1 rounded-xl flex gap-1 border border-slate-100">{[TransactionType.EXPENSE, TransactionType.INCOME].map(t => (
            <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 py-2 text-[8px] font-black rounded-lg transition-all ${type === t ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}>{t.toUpperCase()}</button>
          ))}</div>
          <div className="bg-slate-50 p-1 rounded-xl flex gap-1 border border-slate-100">{[PaymentSource.CASH, PaymentSource.BANK].map(s => (
            <button key={s} type="button" onClick={() => setSource(s)} className={`flex-1 py-2 text-[8px] font-black rounded-lg transition-all ${source === s ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}>{s.split(' ')[0].toUpperCase()}</button>
          ))}</div>
        </div>

        {type === TransactionType.EXPENSE && (
          <div className="flex gap-2">
            <button type="button" onClick={() => { setIsExcluded(!isExcluded); if(!isExcluded) setIsFromSavings(false); }} className={`flex-1 p-2 rounded-xl border text-[8px] font-black transition-all ${isExcluded ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}>ĐẶC BIỆT</button>
            <button type="button" onClick={() => { setIsFromSavings(!isFromSavings); if(!isFromSavings) setIsExcluded(false); }} className={`flex-1 p-2 rounded-xl border text-[8px] font-black transition-all ${isFromSavings ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}>TÍCH LŨY</button>
          </div>
        )}

        <div className="relative py-2">
           <input type="text" inputMode="numeric" value={displayAmount} onChange={handleAmountChange} placeholder="0đ" className={`w-full text-2xl font-black text-center py-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-indigo-400 focus:bg-white transition-all ${type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`} />
        </div>
        <button type="submit" className={`w-full py-4 rounded-2xl font-black text-white text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-indigo-100 ${editingTransaction ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
          {editingTransaction ? 'LƯU THAY ĐỔI' : 'XÁC NHẬN GIAO DỊCH'}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
