
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
    <div className="min-h-screen bg-tech-900 flex items-center justify-center p-4">
      {/* UI 2.1: Lớp container chính với bóng đổ cực sâu */}
      <div className="w-full max-w-[240px] animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-tech-cyan rounded-[22px] flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(6,182,212,0.4)] mx-auto mb-3 transform rotate-3 ring-4 ring-tech-900">
            <i className="fas fa-vault text-tech-900 text-xl"></i>
          </div>
          <h1 className="text-xl font-black text-white tracking-tighter leading-none">CASH<span className="text-tech-cyan">FLOW</span></h1>
          <p className="text-tech-muted/80 text-[7px] font-black uppercase tracking-[0.4em] mt-1.5">Version 2.1 Depth</p>
        </div>

        <div className="bg-tech-800 border border-tech-border p-5 rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] ring-1 ring-black/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
          
          <div className="flex bg-tech-700/50 p-1.5 rounded-2xl mb-6 shadow-inner">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all ${isLogin ? 'bg-tech-800 text-tech-cyan shadow-md ring-1 ring-black/5' : 'text-tech-muted/80'}`}
            >
              Đăng nhập
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all ${!isLogin ? 'bg-tech-800 text-tech-cyan shadow-md ring-1 ring-black/5' : 'text-tech-muted/80'}`}
            >
              Đăng ký
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[7px] font-black text-tech-muted/80 uppercase tracking-widest ml-1">Họ tên</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-tech-900 border border-tech-border rounded-xl px-4 py-2.5 text-white text-[10px] font-bold outline-none focus:ring-2 focus:ring-tech-cyan/20 focus:border-tech-cyan/50 transition-all" placeholder="Tên..." />
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-[7px] font-black text-tech-muted/80 uppercase tracking-widest ml-1">Tài khoản</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-tech-900 border border-tech-border rounded-xl px-4 py-2.5 text-white text-[10px] font-mono outline-none focus:ring-2 focus:ring-tech-cyan/20 focus:border-tech-cyan/50 transition-all" placeholder="user..." />
            </div>

            <div className="space-y-1">
              <label className="text-[7px] font-black text-tech-muted/80 uppercase tracking-widest ml-1">Mật khẩu</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-tech-900 border border-tech-border rounded-xl px-4 py-2.5 text-white text-[10px] font-bold outline-none focus:ring-2 focus:ring-tech-cyan/20 focus:border-tech-cyan/50 transition-all" placeholder="••••" />
            </div>

            {error && (
              <p className="text-rose-500 text-[7px] font-black text-center uppercase py-1">{error}</p>
            )}

            <button type="submit" className="w-full bg-tech-cyan hover:bg-tech-accent text-tech-900 font-black py-3.5 rounded-2xl shadow-[0_15px_30px_-5px_rgba(6,182,212,0.3)] active:scale-95 transition-all uppercase tracking-[0.2em] text-[10px] mt-2 border-b-4 border-tech-accent">
              {isLogin ? 'Vào hệ thống' : 'Tạo tài khoản'}
            </button>
          </form>
        </div>
        
        <p className="text-center mt-6 text-tech-muted/80 text-[6px] font-black uppercase tracking-[0.4em] opacity-60">© 2025 Deep Flow Architecture</p>
      </div>
    </div>
  );
};

export default Auth;
