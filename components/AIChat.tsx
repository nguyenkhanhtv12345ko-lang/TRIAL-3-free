
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
  onAddTransaction: (t: Omit<Transaction, 'id' | 'userId'>) => void;
  onClose: () => void; // Thêm prop để quay lại dashboard
}

const AIChat: React.FC<Props> = ({ transactions, stats, onAddTransaction, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Chào bạn! Tôi là FinAssist. Hãy nhập chi tiêu hoặc hỏi tôi bất cứ điều gì về tài chính nhé! 🚀' }
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

  // Hàm xử lý thoát và dọn dẹp
  const handleExit = () => {
    geminiService.resetSession();
    onClose();
  };

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
                type: (args.transaction_type?.includes('Thu')) ? TransactionType.INCOME : TransactionType.EXPENSE,
                source: (args.source?.includes('khoản')) ? PaymentSource.BANK : PaymentSource.CASH
              });
              await geminiService.sendFunctionResponse(call.id, call.name, { status: "success" });
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
      setMessages(prev => [...prev, { role: 'ai', text: 'Kết nối bị gián đoạn. Tôi đã reset lại hệ thống, bạn vui lòng nhập lại nhé!' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-tech-900 relative animate-in fade-in duration-300">
      {/* Header AI với nút X thoát */}
      <div className="flex-none p-4 bg-tech-800 border-b border-tech-border flex items-center justify-between z-10 shadow-sm">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-tech-cyan text-tech-900 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
               <i className="fas fa-robot text-tech-900 text-sm"></i>
            </div>
            <div>
               <h3 className="font-black text-sm text-white tracking-tight">FinAssist AI</h3>
               <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500/100"></span>
                  </span>
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
               </div>
            </div>
         </div>
         <button 
           onClick={handleExit}
           className="w-10 h-10 bg-tech-700 text-tech-muted rounded-xl flex items-center justify-center active:scale-90 hover:bg-rose-500/10 hover:text-rose-500 transition-all border border-tech-border"
           title="Thoát Chat"
         >
           <i className="fas fa-times text-lg"></i>
         </button>
      </div>

      {/* Tin nhắn */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : m.role === 'system' ? 'justify-center' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
            {m.role === 'system' ? (
              <div className="bg-tech-cyan/10 text-tech-cyan text-[10px] font-black px-4 py-2 rounded-2xl border border-tech-cyan/30 shadow-sm">
                 {m.text}
              </div>
            ) : (
              <div className={`group relative max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${
                m.role === 'user' ? 'bg-tech-cyan text-tech-900 rounded-tr-none' : 'bg-tech-800 text-white rounded-tl-none border border-tech-border'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{m.text}</p>
                {m.role === 'ai' && m.text && (
                  <button onClick={() => geminiService.speakText(m.text)} className="mt-2 text-tech-cyan p-1 active:scale-75 transition-transform">
                    <i className="fas fa-volume-up"></i>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-tech-800 border border-tech-border p-4 rounded-2xl rounded-tl-none flex gap-1.5">
              <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-tech-cyan rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} className="h-4" />
      </div>

      {/* Input */}
      <div className="flex-none p-4 bg-tech-800 border-t border-tech-border">
        <form onSubmit={handleSend} className="flex gap-2 max-w-xl mx-auto">
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            disabled={loading}
            placeholder={loading ? "AI đang trả lời..." : "Nhập câu hỏi tại đây..."}
            className="flex-1 px-5 py-4 bg-tech-900 border border-tech-border rounded-2xl outline-none focus:ring-2 focus:ring-tech-cyan/50 focus:bg-tech-800 text-sm font-medium transition-all text-white"
          />
          <button 
            type={loading ? "button" : "submit"} 
            onClick={loading ? () => window.location.reload() : undefined}
            className={`${loading ? 'bg-rose-500 text-white' : 'bg-tech-cyan text-tech-900'} w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center active-scale transition-all`}
          >
            {loading ? <i className="fas fa-redo-alt animate-spin-slow"></i> : <i className="fas fa-paper-plane"></i>}
          </button>
        </form>
        {loading && <p className="text-[10px] text-center text-tech-muted/80 mt-2 font-bold uppercase tracking-widest">Nếu bị treo quá lâu, hãy nhấn nút đỏ để tải lại</p>}
      </div>
    </div>
  );
};

export default AIChat;
