
import React, { useState, useEffect, useRef } from 'react';
import { Transaction, FinancialStats } from '../types';
import { geminiService } from '../services/geminiService';
import { storageService } from '../services/storageService';

interface Props {
  transactions: Transaction[];
  stats: FinancialStats;
  onAddTransaction: (t: any) => void;
  onClose: () => void;
}

const AIChat: React.FC<Props> = ({ transactions, stats, onAddTransaction, onClose }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sysConfig, setSysConfig] = useState({ aiActive: false, serverStatus: 'online' });
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSysConfig(storageService.getGlobalConfig());
    if (storageService.getGlobalConfig().aiActive) {
      geminiService.initChat(transactions, stats);
      setMessages([{role: 'ai', text: "Chào bạn! Tôi là FinAssist Cloud AI. Tôi đã sẵn sàng phân tích dữ liệu tài chính của bạn từ Server. Bạn cần giúp gì nào? 🚀"}]);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, {role: 'user', text: userMsg}]);
    setIsTyping(true);

    try {
      let aiResponse = '';
      const stream = geminiService.askAIStream(userMsg);
      
      setMessages(prev => [...prev, {role: 'ai', text: ''}]);

      for await (const chunk of stream) {
        if (chunk.type === 'text') {
          aiResponse += chunk.text;
          setMessages(prev => {
            const last = prev[prev.length - 1];
            return [...prev.slice(0, -1), {role: 'ai', text: aiResponse}];
          });
        } else if (chunk.type === 'function_call') {
          const { name, args, id } = chunk.call;
          if (name === 'add_transaction') {
            const newT = {
              content: args.content,
              amount: args.amount,
              type: args.transaction_type,
              source: args.source || 'Tiền mặt',
              date: args.date || new Date().toISOString().split('T')[0]
            };
            onAddTransaction(newT);
            await geminiService.sendFunctionResponse(id, name, { status: 'success' });
          }
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, {role: 'ai', text: "Xin lỗi, kết nối tới Cloud AI bị gián đoạn. Vui lòng thử lại sau! 🛠️"}]);
    } finally {
      setIsTyping(false);
    }
  };

  // NẾU AI ĐANG BẢO TRÌ
  if (!sysConfig.aiActive) {
    return (
      <div className="flex flex-col h-full bg-slate-900 relative animate-in fade-in duration-500 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500 rounded-full blur-[120px]"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-500 rounded-full blur-[120px]"></div>
        </div>

        <div className="flex-none p-6 flex justify-between items-center z-10">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                 <i className="fas fa-robot text-white text-sm"></i>
              </div>
              <h3 className="font-black text-white tracking-tighter">FinAssist Cloud</h3>
           </div>
           <button onClick={onClose} className="w-10 h-10 bg-white/5 text-white rounded-xl flex items-center justify-center hover:bg-rose-500 transition-all">
             <i className="fas fa-times"></i>
           </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 z-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-indigo-500 rounded-[48px] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="w-32 h-32 bg-slate-800 rounded-[48px] border border-white/10 flex items-center justify-center relative animate-pulse">
               <i className="fas fa-face-frown-open text-6xl text-slate-500"></i>
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">AI Đang Bảo Trì Hệ Thống</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-[240px] mx-auto">
              Quản trị viên đã tạm ngắt kết nối Cloud AI để tối ưu hóa thuật toán. Vui lòng quay lại sau!
            </p>
          </div>
          <button 
            onClick={onClose}
            className="px-10 py-5 bg-white text-slate-900 font-black rounded-3xl shadow-xl hover:scale-105 active:scale-95 transition-all text-[11px] uppercase tracking-widest"
          >
            Về Dashboard
          </button>
        </div>
      </div>
    );
  }

  // NẾU AI ĐANG HOẠT ĐỘNG
  return (
    <div className="flex flex-col h-full bg-slate-50 relative animate-in slide-in-from-right duration-500">
      <div className="flex-none p-5 bg-white border-b border-slate-100 flex items-center justify-between z-10 shadow-sm">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
               <i className="fas fa-robot text-white text-sm"></i>
            </div>
            <div>
               <h3 className="font-black text-sm text-slate-800 tracking-tight">FinAssist Cloud AI</h3>
               <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Connected to Cloud</span>
               </div>
            </div>
         </div>
         <button onClick={onClose} className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center active:scale-90 transition-all border border-slate-200">
           <i className="fas fa-times"></i>
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-medium leading-relaxed ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 rounded-tr-none' 
                : 'bg-white border border-slate-100 text-slate-700 shadow-sm rounded-tl-none'
            }`}>
              {m.text || <div className="flex gap-1.5 py-1 px-2"><div className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce delay-100"></div><div className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce delay-200"></div></div>}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="flex-none p-5 bg-white border-t border-slate-100">
        <div className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Hỏi AI về tài chính..."
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-5 pr-14 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            <i className={`fas ${isTyping ? 'fa-circle-notch fa-spin' : 'fa-paper-plane'}`}></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
