
import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { User } from '../types';

interface Props {
  user: User;
  onClose: () => void;
  onSyncSuccess: () => void;
}

const CloudSyncModal: React.FC<Props> = ({ user, onClose, onSyncSuccess }) => {
  const [syncCode, setSyncCode] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const myCode = storageService.generateSyncPackage(user.username);

  const handleCopy = () => {
    navigator.clipboard.writeText(myCode);
    alert("Đã sao chép mã đồng bộ! Hãy gửi mã này sang thiết bị khác.");
  };

  const handleImport = async () => {
    if (!syncCode.trim()) return;
    setIsImporting(true);
    const success = await storageService.importSyncPackage(syncCode);
    if (success) {
      alert("Đồng bộ thành công! Dữ liệu từ thiết bị khác đã được nạp.");
      onSyncSuccess();
    } else {
      alert("Mã đồng bộ không hợp lệ hoặc đã hết hạn.");
    }
    setIsImporting(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[300] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        <div className="p-8 bg-indigo-600 text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all">
            <i className="fas fa-times"></i>
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
            <i className="fas fa-tower-broadcast text-2xl"></i>
          </div>
          <h2 className="text-3xl font-black tracking-tighter">CLOUD SYNC</h2>
          <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Đồng bộ đa thiết bị</p>
        </div>

        <div className="p-8 space-y-8">
          {/* Export section */}
          <section className="space-y-3">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Thiết bị hiện tại (Source)</h3>
             <div className="p-5 bg-slate-50 border border-slate-100 rounded-[32px] space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Sử dụng mã này để đăng nhập và lấy dữ liệu trên điện thoại hoặc máy tính khác.
                </p>
                <div className="relative group">
                   <div className={`p-4 bg-white border border-slate-200 rounded-2xl font-mono text-[8px] break-all overflow-hidden ${showCode ? 'h-auto' : 'h-12'}`}>
                      {myCode}
                   </div>
                   {!showCode && <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent"></div>}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowCode(!showCode)}
                    className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    {showCode ? 'Ẩn mã' : 'Hiện mã'}
                  </button>
                  <button 
                    onClick={handleCopy}
                    className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100"
                  >
                    Sao chép mã Cloud
                  </button>
                </div>
             </div>
          </section>

          <div className="flex items-center gap-4">
             <div className="h-px bg-slate-100 flex-1"></div>
             <span className="text-[10px] font-black text-slate-300 uppercase">Hoặc</span>
             <div className="h-px bg-slate-100 flex-1"></div>
          </div>

          {/* Import section */}
          <section className="space-y-3">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Kết nối thiết bị mới (Target)</h3>
             <div className="space-y-4">
                <textarea 
                  value={syncCode}
                  onChange={(e) => setSyncCode(e.target.value)}
                  placeholder="Dán mã đồng bộ từ thiết bị khác vào đây..."
                  className="w-full h-24 bg-slate-50 border border-slate-100 rounded-[32px] p-5 text-xs outline-none focus:border-indigo-500 transition-all resize-none font-medium"
                />
                <button 
                  onClick={handleImport}
                  disabled={isImporting}
                  className="w-full py-5 bg-slate-900 text-white rounded-[32px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  {isImporting ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-link"></i>}
                  Xác nhận liên kết Cloud
                </button>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CloudSyncModal;
