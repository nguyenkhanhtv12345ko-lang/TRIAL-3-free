
import React, { useState, useRef, useEffect } from 'react';
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
    { role: 'ai', text: 'Chào bạn! Tôi đã sẵn sàng. Bạn có thể nhập: "Ăn sáng 35k" hoặc "Lương về 10 triệu" để tôi ghi lại giúp nhé!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    geminiService.initChat(transactions, stats);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const messageToSend = input.trim();
    if (!messageToSend || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: messageToSend }]);
    setLoading(true);
    setMessages(prev => [...prev, { role: 'ai', text: '' }]);

    try {
      let fullResponse = '';
      const stream = geminiService.askAIStream(messageToSend);
      
      for await (const chunk of stream) {
        if (chunk.type === 'function_call') {
          const call = chunk.call;
          if (call.name === 'add_transaction') {
            const args = call.args as any;
            
            onAddTransaction({
              date: args.date || new Date().toISOString().split('T')[0],
              content: args.content,
              amount: args.amount,
              type: args.transaction_type === 'Thu' ? TransactionType.INCOME : TransactionType.EXPENSE,
              source: args.source === 'Tài khoản' ? PaymentSource.BANK : PaymentSource.CASH
            });

            await geminiService.sendFunctionResponse(call.id, call.name, { status: "success" });
            
            // Cập nhật dòng thông báo theo yêu cầu người dùng
            setMessages(prev => [...prev, { 
              role: 'system', 
              text: `Đã cập nhật thành công: "${args.content}" - ${args.amount.toLocaleString()}đ vào hệ thống.` 
            }]);
          }
        }

        if (chunk.type === 'text') {
          fullResponse += chunk.text;
          setMessages(prev => {
            const newMessages = [...prev];
            const last = newMessages[newMessages.length - 1];
            if (last && last.role === 'ai') {
              newMessages[newMessages.length - 1] = { role: 'ai', text: fullResponse };
            }
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'ai') {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'ai', text: 'Có lỗi xảy ra khi xử lý. Hãy thử lại!' };
          return newMessages;
        }
        return prev;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    await geminiService.speakText(text);
    setIsSpeaking(false);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
               <i className="fas fa-robot text-lg"></i>
            </div>
            <div>
               <h3 className="font-bold text-sm tracking-wide">Trợ lý FinAssist</h3>
               <div className="flex items-center gap-1.5 text-[10px]">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="font-bold text-indigo-100 uppercase">Sẵn sàng</span>
               </div>
            </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : m.role === 'system' ? 'justify-center' : 'justify-start'}`}>
            {m.role === 'system' ? (
              <div className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-4 py-2 rounded-xl border border-emerald-200 shadow-sm flex items-center gap-2 animate-bounce">
                 <i className="fas fa-check-circle"></i> {m.text}
              </div>
            ) : (
              <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm relative group ${
                m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text || (loading && i === messages.length - 1 ? '...' : '')}</p>
                {m.role === 'ai' && m.text && (
                  <button onClick={() => handleSpeak(m.text)} className="absolute -right-8 bottom-0 p-2 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all scale-75">
                    <i className={`fas ${isSpeaking ? 'fa-circle-notch fa-spin' : 'fa-volume-up'}`}></i>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="flex gap-2">
          <input 
            type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={loading}
            placeholder="Nhập giao dịch..."
            className="flex-1 px-4 py-3 bg-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <button type="submit" disabled={!input.trim() || loading} className="bg-indigo-600 text-white w-12 h-12 rounded-2xl shadow-lg active:scale-90">
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
