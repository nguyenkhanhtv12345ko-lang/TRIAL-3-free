
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Transaction, FinancialStats, TransactionType, PaymentSource } from '../types';
import { geminiService } from '../services/geminiService';

interface Message {
  role: 'user' | 'ai' | 'system';
  text: string;
}

interface Props {
  transactions: Transaction[];
  stats: FinancialStats;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
}

const AIChat: React.FC<Props> = ({ transactions, stats, onAddTransaction }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Chào bạn! FinAssist đã sẵn sàng. Hãy nói ví dụ: "Vừa nhận lương 15tr" hoặc "Ăn tối hết 200k tiền mặt" để tôi lưu lại giúp nhé! 🚀' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    geminiService.initChat(transactions, stats);
  }, [transactions.length]);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const userQuery = input.trim();
    if (!userQuery || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userQuery }]);
    setLoading(true);

    try {
      let fullTextResponse = '';
      const stream = geminiService.askAIStream(userQuery);
      setMessages(prev => [...prev, { role: 'ai', text: '' }]);

      for await (const chunk of stream) {
        if (chunk.type === 'function_call') {
          const { call } = chunk;
          if (call.name === 'add_transaction') {
            const args = call.args as any;
            const amount = Number(args.amount);
            if (!isNaN(amount) && amount > 0) {
              onAddTransaction({
                date: args.date || new Date().toISOString().split('T')[0],
                content: args.content || "Giao dịch AI",
                amount: amount,
                type: (args.transaction_type === 'Thu' || args.transaction_type?.toLowerCase().includes('thu')) ? TransactionType.INCOME : TransactionType.EXPENSE,
                source: (args.source === 'Tài khoản' || args.source?.toLowerCase().includes('khoản')) ? PaymentSource.BANK : PaymentSource.CASH
              });
              await geminiService.sendFunctionResponse(call.id, call.name, { status: "success", message: "Đã ghi nhận vào sổ thu chi." });
              setMessages(prev => [...prev, { role: 'system', text: `✅ Đã lưu: ${args.content} (${amount.toLocaleString()}đ)` }]);
            }
          }
        }
        if (chunk.type === 'text') {
          fullTextResponse += chunk.text;
          setMessages(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (updated[lastIdx].role === 'ai') updated[lastIdx] = { ...updated[lastIdx], text: fullTextResponse };
            return updated;
          });
        }
      }
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'ai', text: 'Rất tiếc, tôi gặp chút sự cố đường truyền. Bạn thử lại nhé!' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = async (text: string) => {
    if (isSpeaking || !text) return;
    setIsSpeaking(true);
    try {
      await geminiService.speakText(text);
    } finally {
      setIsSpeaking(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Header AI */}
      <div className="flex-none p-4 bg-white border-b border-slate-100 flex items-center justify-between z-10">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
               <i className="fas fa-robot text-white text-sm"></i>
            </div>
            <div>
               <h3 className="font-black text-sm text-slate-800 tracking-tight">FinAssist AI</h3>
               <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Online</span>
               </div>
            </div>
         </div>
      </div>

      {/* Tin nhắn - Area scrollable duy nhất trong tab AI */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : m.role === 'system' ? 'justify-center' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            {m.role === 'system' ? (
              <div className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-4 py-2 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-2">
                 <i className="fas fa-check-double"></i> {m.text}
              </div>
            ) : (
              <div className={`group relative max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${
                m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none font-medium' 
                : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 font-medium'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                {m.role === 'ai' && m.text && (
                  <button 
                    onClick={() => handleSpeak(m.text)} 
                    className={`p-2 text-indigo-400 active:scale-75 ${isSpeaking ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                  >
                    <i className={`fas ${isSpeaking ? 'fa-waveform fa-beat-fade' : 'fa-volume-up'}`}></i>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none flex gap-1.5">
              <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} className="h-4" />
      </div>

      {/* Input - Area cố định phía dưới tab AI */}
      <div className="flex-none p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="flex gap-2 max-w-xl mx-auto">
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            disabled={loading}
            placeholder="Nhập giao dịch hoặc hỏi tư vấn..."
            className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm font-medium transition-all"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading} 
            className="bg-indigo-600 text-white w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center active-scale disabled:opacity-50 transition-all"
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
