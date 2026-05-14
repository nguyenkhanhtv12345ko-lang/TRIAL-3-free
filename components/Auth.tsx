
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { loginWithGoogle } from '../firebase';

interface Props {
  onLogin: (user: User) => void;
}

const Auth: React.FC<Props> = ({ onLogin }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setIsLoading(true);
      const userResult = await loginWithGoogle();
      
      const user: User = {
        username: userResult.uid,
        name: userResult.displayName || 'Người dùng',
        role: UserRole.USER,
        createdAt: new Date().toISOString()
      };
      
      onLogin(user);
    } catch (err: any) {
      console.error(err);
      setError('Đăng nhập thất bại. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-tech-900 flex items-center justify-center p-4">
      <div className="w-full max-w-[240px] animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-tech-cyan rounded-[22px] flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(6,182,212,0.4)] mx-auto mb-3 transform rotate-3 ring-4 ring-tech-900">
            <i className="fas fa-vault text-tech-900 text-xl"></i>
          </div>
          <h1 className="text-xl font-black text-white tracking-tighter leading-none">CASH<span className="text-tech-cyan">FLOW</span></h1>
          <p className="text-tech-muted/80 text-[7px] font-black uppercase tracking-[0.4em] mt-1.5">Version 2.1 Depth</p>
        </div>

        <div className="bg-tech-800 border border-tech-border p-5 rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] ring-1 ring-black/5 relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-tech-cyan/20 to-transparent"></div>
          
          <i className="fab fa-google text-4xl text-tech-cyan mb-4 mt-2"></i>
          <p className="text-[10px] text-tech-muted/80 mb-6 px-2 font-bold leading-relaxed">
            Dữ liệu của bạn sẽ được đồng bộ và sao lưu an toàn trên Cloud theo tài khoản Google.
          </p>

          <button 
            onClick={handleGoogleLogin} 
            disabled={isLoading}
            className={`w-full bg-tech-cyan hover:bg-tech-accent text-tech-900 font-black py-4 rounded-2xl shadow-[0_15px_30px_-5px_rgba(6,182,212,0.3)] active:scale-95 transition-all uppercase tracking-[0.2em] text-[10px] border-b-4 border-tech-accent flex items-center justify-center gap-2 ${isLoading ? 'opacity-70' : ''}`}
          >
            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fab fa-google"></i>}
            {isLoading ? 'Đang kết nối...' : 'Đăng nhập Google'}
          </button>
          
          {error && (
            <p className="text-rose-500 text-[8px] font-black mt-4 uppercase tracking-wider">{error}</p>
          )}
        </div>
        
        <p className="text-center mt-6 text-tech-muted/80 text-[6px] font-black uppercase tracking-[0.4em] opacity-60">© 2025 Deep Flow Architecture</p>
      </div>
    </div>
  );
};

export default Auth;

