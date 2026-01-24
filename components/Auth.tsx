
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface Props {
  onLogin: (user: User) => void;
}

const Auth: React.FC<Props> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('cashflow_users') || '[]');
    if (!users.find((u: any) => u.username === 'admin')) {
      users.push({
        username: 'admin',
        password: '123',
        name: 'Quản trị viên',
        role: UserRole.ADMIN,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('cashflow_users', JSON.stringify(users));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser || !password || (!isLogin && !name)) {
      setError('Vui lòng nhập đầy đủ!');
      return;
    }
    const users: User[] = JSON.parse(localStorage.getItem('cashflow_users') || '[]');
    if (isLogin) {
      const user = users.find(u => u.username === cleanUser && u.password === password);
      if (user) onLogin(user);
      else setError('Sai tài khoản hoặc mật khẩu!');
    } else {
      if (users.find(u => u.username === cleanUser)) {
        setError('Tài khoản đã tồn tại!');
        return;
      }
      const newUser: User = { 
        username: cleanUser, 
        password, 
        name, 
        role: UserRole.USER,
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      localStorage.setItem('cashflow_users', JSON.stringify(users));
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 overflow-hidden">
      {/* Container chính thu nhỏ 60% theo yêu cầu */}
      <div className="w-full max-w-[240px] animate-in fade-in zoom-in duration-500 scale-100">
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-indigo-600 rounded-[18px] flex items-center justify-center shadow-xl shadow-indigo-100 mx-auto mb-3 rotate-3">
            <i className="fas fa-vault text-white text-lg"></i>
          </div>
          <h1 className="text-lg font-black text-slate-900 tracking-tighter leading-none">CASH<span className="text-indigo-600">FLOW</span></h1>
          <p className="text-slate-400 text-[6px] font-black uppercase tracking-[0.3em] mt-1">MASTER MINI 6.0</p>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-[28px] shadow-2xl relative">
          {/* Tabs Đăng nhập / Đăng ký */}
          <div className="flex bg-slate-50 p-1 rounded-xl mb-5 border border-slate-100">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-1.5 text-[7px] font-black uppercase tracking-widest rounded-lg transition-all ${isLogin ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400'}`}
            >
              Đăng nhập
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-1.5 text-[7px] font-black uppercase tracking-widest rounded-lg transition-all ${!isLogin ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400'}`}
            >
              Đăng ký
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ tên</label>
                <div className="relative">
                  <i className="fas fa-user absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[8px]"></i>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-900 text-[10px] font-bold outline-none focus:border-indigo-400 focus:bg-white transition-all" placeholder="Họ tên..." />
                </div>
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Tài khoản</label>
              <div className="relative">
                <i className="fas fa-at absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[8px]"></i>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-900 text-[10px] font-mono outline-none focus:border-indigo-400 focus:bg-white transition-all" placeholder="tên đăng nhập..." />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu</label>
              <div className="relative">
                <i className="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[8px]"></i>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-900 text-[10px] font-bold outline-none focus:border-indigo-400 focus:bg-white transition-all" placeholder="••••" />
              </div>
            </div>

            {error && (
              <p className="text-rose-500 text-[7px] font-black text-center uppercase py-0.5">{error}</p>
            )}

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl shadow-xl shadow-indigo-100 active:scale-95 transition-all uppercase tracking-[0.2em] text-[9px] mt-2">
              {isLogin ? 'Đăng nhập' : 'Xác nhận'}
            </button>
          </form>
        </div>
        
        <p className="text-center mt-5 text-slate-400 text-[6px] font-black uppercase tracking-[0.3em] opacity-80 italic">Secure & Simple 2025</p>
      </div>
    </div>
  );
};

export default Auth;
