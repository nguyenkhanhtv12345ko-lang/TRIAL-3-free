
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

  // Khởi tạo tài khoản admin mặc định nếu chưa có
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
      setError('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    const users: User[] = JSON.parse(localStorage.getItem('cashflow_users') || '[]');

    if (isLogin) {
      const user = users.find(u => u.username === cleanUser && u.password === password);
      if (user) {
        onLogin(user);
      } else {
        setError('Sai tài khoản hoặc mật khẩu!');
      }
    } else {
      if (users.find(u => u.username === cleanUser)) {
        setError('Tên đăng nhập đã tồn tại!');
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-indigo-500/50 mx-auto mb-6 transition-transform hover:rotate-12 duration-500">
            <i className="fas fa-vault text-white text-3xl"></i>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            CASH<span className="text-indigo-500">FLOW</span>
          </h1>
          <p className="text-slate-400 text-xs mt-3 font-bold uppercase tracking-widest">Mastering Your Money</p>
        </div>

        <div className="bg-white/10 backdrop-blur-2xl border border-white/10 p-8 rounded-[48px] shadow-2xl relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl"></div>

          <div className="flex bg-white/5 p-1.5 rounded-2xl mb-8 relative z-10">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${isLogin ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Đăng nhập
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${!isLogin ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Đăng ký
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {!isLogin && (
              <div className="space-y-1.5 group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Họ tên người dùng</label>
                <div className="relative">
                  <i className="fas fa-user absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 text-xs group-focus-within:text-indigo-400"></i>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white outline-none focus:border-indigo-500 focus:bg-white/10 transition-all text-sm font-bold"
                    placeholder="Tên của bạn..."
                  />
                </div>
              </div>
            )}
            <div className="space-y-1.5 group">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Tài khoản (Username)</label>
              <div className="relative">
                <i className="fas fa-at absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 text-xs group-focus-within:text-indigo-400"></i>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white outline-none focus:border-indigo-500 focus:bg-white/10 transition-all text-sm font-mono tracking-tighter"
                  placeholder="username..."
                />
              </div>
            </div>
            <div className="space-y-1.5 group">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Mật khẩu</label>
              <div className="relative">
                <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 text-xs group-focus-within:text-indigo-400"></i>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white outline-none focus:border-indigo-500 focus:bg-white/10 transition-all text-sm font-bold"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 justify-center py-2 px-4 bg-rose-500/10 border border-rose-500/20 rounded-xl animate-bounce">
                <i className="fas fa-exclamation-circle text-rose-500 text-[10px]"></i>
                <p className="text-rose-400 text-[10px] font-black uppercase tracking-tight">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-2xl shadow-indigo-600/30 active:scale-[0.98] transition-all uppercase tracking-widest text-[11px] mt-4"
            >
              {isLogin ? 'Vào Hệ Thống' : 'Tạo Tài Khoản Mới'}
            </button>
          </form>

          {isLogin && (
            <div className="mt-8 pt-6 border-t border-white/5 text-center">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Demo Admin Access</p>
               <div className="inline-flex gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                  <span className="text-[10px] text-indigo-400 font-mono">admin</span>
                  <span className="text-white/20">|</span>
                  <span className="text-[10px] text-indigo-400 font-mono">123</span>
               </div>
            </div>
          )}
        </div>
        
        <p className="text-center mt-8 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
          &copy; 2025 CASHFLOW MASTER
        </p>
      </div>
    </div>
  );
};

export default Auth;
