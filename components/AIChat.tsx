
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
    { role: 'ai', text: 'Chào bạn! Tôi là FinAssist. Tôi có thể giúp bạn ghi nhanh giao dịch. Hãy nhập thử: "Vừa ăn sáng 30k" xem sao!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Khởi tạo chat session khi mount
  useEffect(() => {
    geminiService.initChat(transactions, stats);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent, directText?: string) => {
    e?.preventDefault();
    const messageToSend = directText || input.trim();
    if (!messageToSend || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: messageToSend }]);
    setLoading(true);

    // Placeholder cho tin nhắn AI đang stream
    setMessages(prev => [...prev, { role: 'ai', text: '' }]);

    try {
      let fullResponse = '';
      const stream = geminiService.askAIStream(messageToSend);
      
      for await (const chunk of stream) {
        // Xử lý lệnh gọi hàm từ AI
        if (chunk.type === 'function_call') {
          const call = chunk.call;
          if (call.name === 'add_transaction') {
            const args = call.args as any;
            
            // Thực hiện thêm giao dịch vào App
            onAddTransaction({
              date: args.date || new Date().toISOString().split('T')[0],
              content: args.content,
              amount: args.amount,
              type: args.transaction_type === 'Thu' ? TransactionType.INCOME : TransactionType.EXPENSE,
              source: args.source === 'Tài khoản' ? PaymentSource.BANK : PaymentSource.CASH
            });

            // Gửi kết quả lại cho AI để nó biết đã thành công
            await geminiService.sendFunctionResponse(call.id, call.name, { status: "success", message: "Giao dịch đã được lưu." });
            
            setMessages(prev => [...prev, { 
              role: 'system', 
              text: `Đã tự động thêm: ${args.transaction_type} ${args.amount.toLocaleString()}đ - ${args.content}` 
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
        const newMessages = [...prev];
        const last = newMessages[newMessages.length - 1];
        if (last && last.role === 'ai') {
          newMessages[newMessages.length - 1] = { role: 'ai', text: 'Tôi gặp chút vấn đề khi xử lý yêu cầu.' };
        }
        return newMessages;
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
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
               <i className="fas fa-magic text-lg"></i>
            </div>
            <div>
               <h3 className="font-bold text-sm tracking-wide">FinAssist Smart AI</h3>
               <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold text-indigo-100 uppercase">Auto-Extractor ON</span>
               </div>
            </div>
         </div>
         <div className="text-[10px] bg-black/20 px-2 py-1 rounded-full text-indigo-200">v2.2</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : m.role === 'system' ? 'justify-center' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
            {m.role === 'system' ? (
              <div className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-4 py-1.5 rounded-full border border-indigo-100 uppercase tracking-tighter">
                 <i className="fas fa-check-double mr-1"></i> {m.text}
              </div>
            ) : (
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm relative group ${
                m.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text || (loading && i === messages.length - 1 ? '...' : '')}</p>
                {m.role === 'ai' && m.text && (
                  <button 
                    onClick={() => handleSpeak(m.text)}
                    disabled={isSpeaking}
                    className="absolute -right-8 bottom-0 p-2 text-indigo-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all scale-75 md:scale-100"
                  >
                    <i className={`fas ${isSpeaking ? 'fa-circle-notch fa-spin' : 'fa-volume-up'}`}></i>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="flex gap-2 items-center">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Nhập: 'Vừa tiêu 50k mua phở'..."
            className="flex-1 px-4 py-3 bg-slate-100 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
          />
          
          <button 
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-indigo-600 disabled:bg-slate-300 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all active:scale-90"
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
          </button>
        </form>
        <p className="text-[10px] text-center text-slate-400 mt-2 font-medium italic">
          Gõ mô tả giao dịch của bạn, AI sẽ tự động cập nhật vào hệ thống.
        </p>
      </div>
    </div>
  );
};

export default AIChat;
