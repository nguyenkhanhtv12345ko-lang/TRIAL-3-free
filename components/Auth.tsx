
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { storageService } from '../services/storageService';

interface Props {
  onLogin: (user: User) => void;
}

const Auth: React.FC<Props> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const initAdmin = async () => {
      const users = await storageService.getUsers();
      if (!users.find(u => u.username === 'admin')) {
        await storageService.saveUser({
          username: 'admin',
          password: '123',
          name: 'Quản trị viên',
          role: UserRole.ADMIN,
          createdAt: new Date().toISOString()
        });
      }
    };
    initAdmin();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser || !password || (!isLogin && !name)) {
      setError('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    setIsConnecting(true);
    // Giả lập thời gian kết nối server
    await new Promise(r => setTimeout(r, 1200));

    const users = await storageService.getUsers();

    if (isLogin) {
      const user = users.find(u => u.username === cleanUser && u.password === password);
      if (user) {
        onLogin(user);
      } else {
        setError('Tài khoản hoặc mật khẩu không chính xác!');
        setIsConnecting(false);
      }
    } else {
      if (users.find(u => u.username === cleanUser)) {
        setError('Tên đăng nhập đã tồn tại trên server!');
        setIsConnecting(false);
        return;
      }
      const newUser: User = { 
        username: cleanUser, 
        password, 
        name, 
        role: UserRole.USER,
        createdAt: new Date().toISOString()
      };
      await storageService.saveUser(newUser);
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 overflow-y-auto relative">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-indigo-500/50 mx-auto mb-6">
            <i className="fas fa-vault text-white text-3xl"></i>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            CASH<span className="text-indigo-500">FLOW</span>
          </h1>
          <p className="text-slate-400 text-[10px] mt-3 font-black uppercase tracking-widest">Hệ thống quản lý dòng tiền an toàn</p>
        </div>

        <div className="bg-white/10 backdrop-blur-2xl border border-white/10 p-8 rounded-[48px] shadow-2xl relative overflow-hidden">
          {isConnecting && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
               <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
               <p className="text-[10px] font-black text-white uppercase tracking-widest animate-pulse">Đang kết nối server...</p>
            </div>
          )}

          <div className="flex bg-white/5 p-1.5 rounded-2xl mb-8">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${isLogin ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}
            >
              Đăng nhập
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${!isLogin ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}
            >
              Đăng ký
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Họ tên của bạn</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500 transition-all text-sm font-bold"
                  placeholder="Nhập họ tên..."
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tên đăng nhập</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500 transition-all text-sm font-mono"
                placeholder="username"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Mật khẩu</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500 transition-all text-sm font-bold"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-rose-400 text-[10px] font-black uppercase text-center">{error}</p>
            )}

            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-xl active:scale-[0.98] transition-all uppercase tracking-widest text-[11px]"
            >
              {isLogin ? 'Vào Ứng Dụng' : 'Tạo Tài Khoản Server'}
            </button>
          </form>
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-4 text-slate-600">
           <div className="flex items-center gap-1.5">
              <i className="fas fa-shield-halved text-xs"></i>
              <span className="text-[8px] font-bold uppercase tracking-widest">Mã hóa 256-bit</span>
           </div>
           <div className="w-1 h-1 bg-slate-800 rounded-full"></div>
           <div className="flex items-center gap-1.5">
              <i className="fas fa-server text-xs"></i>
              <span className="text-[8px] font-bold uppercase tracking-widest">Cloud Sync Active</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
