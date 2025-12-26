
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { storageService } from '../services/storageService';

interface Props {
  onClose: () => void;
}

const AdminPanel: React.FC<Props> = ({ onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sysConfig, setSysConfig] = useState({ aiActive: false, serverStatus: 'online' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const savedUsers = await storageService.getUsers();
    setUsers(savedUsers);
    setSysConfig(storageService.getGlobalConfig());
  };

  const toggleAI = () => {
    const newConfig = { ...sysConfig, aiActive: !sysConfig.aiActive };
    setSysConfig(newConfig);
    storageService.setGlobalConfig(newConfig);
  };

  const handleRestartServer = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    window.location.reload();
  };

  const handleWipeSystem = async () => {
    if (window.confirm("CẢNH BÁO: Xóa toàn bộ Database Cloud?")) {
      const pin = prompt("Nhập 'ERASE' để xác nhận:");
      if (pin === 'ERASE') {
        setIsProcessing(true);
        await storageService.wipeAllData();
        window.location.reload();
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white rounded-[40px] shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in duration-300">
      {isProcessing && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Executing Command...</p>
        </div>
      )}

      {/* Header */}
      <div className="p-8 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-white/5">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-black tracking-tighter">CLOUD <span className="text-indigo-500">ROOT</span></h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">System Management Console</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-500 transition-all">
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Quick Actions */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">System Controls</h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={toggleAI}
              className={`p-5 rounded-3xl border transition-all flex flex-col gap-3 ${sysConfig.aiActive ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-800 border-white/5'}`}
            >
              <i className={`fas fa-robot text-xl ${sysConfig.aiActive ? 'text-indigo-400' : 'text-slate-500'}`}></i>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Service</p>
                <p className={`text-xs font-bold ${sysConfig.aiActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                  {sysConfig.aiActive ? 'LIVE & ACTIVE' : 'MAINTENANCE'}
                </p>
              </div>
            </button>
            <button 
              onClick={handleRestartServer}
              className="p-5 rounded-3xl bg-slate-800 border border-white/5 hover:bg-slate-700 transition-all flex flex-col gap-3"
            >
              <i className="fas fa-sync text-xl text-emerald-400"></i>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Server Status</p>
                <p className="text-xs font-bold text-emerald-400">RESTART ENGINE</p>
              </div>
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-rose-500/60 uppercase tracking-[0.2em] ml-2">Danger Zone</h3>
          <button 
            onClick={handleWipeSystem}
            className="w-full p-5 bg-rose-500/5 border border-rose-500/20 rounded-3xl flex items-center justify-between group hover:bg-rose-500/10 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center text-rose-500">
                <i className="fas fa-trash-alt"></i>
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-rose-400 uppercase tracking-tighter">Wipe Cloud Database</p>
                <p className="text-[9px] text-rose-500/60 font-bold uppercase">This action cannot be undone</p>
              </div>
            </div>
            <i className="fas fa-chevron-right text-rose-500/30 group-hover:translate-x-1 transition-transform"></i>
          </button>
        </section>

        {/* Users List */}
        <section className="space-y-4 pb-10">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Registered Accounts ({users.length})</h3>
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.username} className="bg-white/5 border border-white/5 p-4 rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-black">
                     {u.name.charAt(0)}
                   </div>
                   <div>
                     <p className="text-sm font-bold">{u.name}</p>
                     <p className="text-[10px] text-slate-500 font-mono">@{u.username}</p>
                   </div>
                </div>
                <div className="flex gap-2">
                   <span className="bg-emerald-500/10 text-emerald-500 text-[8px] px-2 py-1 rounded uppercase font-black tracking-widest">Active</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminPanel;
