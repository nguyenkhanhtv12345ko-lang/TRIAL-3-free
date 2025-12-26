
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { storageService } from '../services/storageService';

interface Props {
  onClose: () => void;
}

const AdminPanel: React.FC<Props> = ({ onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sysConfig, setSysConfig] = useState({ aiActive: false, serverStatus: 'online' });
  
  // State cho việc chỉnh sửa
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');

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

  const startEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditPassword(user.password || '');
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    if (!editName.trim()) return alert("Tên không được để trống");

    setIsProcessing(true);
    const updated: User = { ...editingUser, name: editName, password: editPassword };
    await storageService.updateUser(updated);
    await loadData();
    setIsProcessing(false);
    setEditingUser(null);
    alert("Cập nhật thông tin Cloud User thành công!");
  };

  const handleDeleteUser = async (username: string) => {
    if (username === 'admin') return alert("Không thể xóa root admin");
    if (window.confirm(`Xóa vĩnh viễn tài khoản @${username} và mọi dữ liệu liên quan trên Cloud?`)) {
      setIsProcessing(true);
      await storageService.deleteUser(username);
      await loadData();
      setIsProcessing(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white rounded-[40px] shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in duration-300 relative">
      {isProcessing && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[200] flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Processing Cloud Command...</p>
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

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
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

        {/* Users Management */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">User Database ({users.length})</h3>
          </div>
          
          {/* Search */}
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
            <input 
              type="text"
              placeholder="Search user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="space-y-3 pb-10">
            {filteredUsers.map(u => (
              <div key={u.username} className="bg-white/5 border border-white/5 p-5 rounded-[32px] flex items-center justify-between group hover:bg-white/[0.08] transition-all">
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg ${u.role === UserRole.ADMIN ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'}`}>
                     {u.name.charAt(0).toUpperCase()}
                   </div>
                   <div>
                     <p className="text-sm font-black flex items-center gap-2">
                        {u.name}
                        {u.role === UserRole.ADMIN && <span className="bg-amber-500/20 text-amber-500 text-[7px] px-1.5 py-0.5 rounded uppercase font-black">Admin</span>}
                     </p>
                     <p className="text-[10px] text-slate-500 font-mono mt-0.5">@{u.username} • {u.password ? '••••••••' : 'No Pass'}</p>
                   </div>
                </div>
                <div className="flex gap-2">
                   <button 
                     onClick={() => startEdit(u)}
                     className="w-10 h-10 bg-white/5 text-slate-400 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"
                     title="Edit User"
                   >
                     <i className="fas fa-edit text-xs"></i>
                   </button>
                   {u.username !== 'admin' && (
                     <button 
                       onClick={() => handleDeleteUser(u.username)}
                       className="w-10 h-10 bg-white/5 text-slate-400 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all"
                       title="Delete User"
                     >
                       <i className="fas fa-user-minus text-xs"></i>
                     </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* System Info */}
        <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-[32px] space-y-4">
           <div className="flex items-center gap-3 text-rose-500">
              <i className="fas fa-exclamation-triangle"></i>
              <p className="text-[10px] font-black uppercase tracking-widest">Zone Nguy Hiểm</p>
           </div>
           <button 
              onClick={handleWipeSystem}
              className="w-full py-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
            >
              Hủy toàn bộ Database
            </button>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingUser && (
        <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl z-[250] flex items-center justify-center p-6 animate-in fade-in duration-200">
           <div className="w-full max-w-sm space-y-8 animate-in slide-in-from-bottom-8">
              <div className="text-center">
                 <div className="w-20 h-20 bg-indigo-600 rounded-[32px] flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-indigo-500/20">
                    <i className="fas fa-user-pen text-white text-3xl"></i>
                 </div>
                 <h3 className="text-2xl font-black tracking-tighter uppercase">Chỉnh sửa hồ sơ</h3>
                 <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Cloud ID: @{editingUser.username}</p>
              </div>

              <div className="space-y-5">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Tên hiển thị mới</label>
                    <input 
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all font-bold"
                      placeholder="Display Name"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Mật khẩu mới</label>
                    <input 
                      type="text"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all font-mono"
                      placeholder="New Password"
                    />
                 </div>
              </div>

              <div className="flex gap-3">
                 <button 
                   onClick={() => setEditingUser(null)}
                   className="flex-1 py-5 bg-white/5 border border-white/5 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                 >
                    Hủy bỏ
                 </button>
                 <button 
                   onClick={handleUpdateUser}
                   className="flex-[2] py-5 bg-indigo-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 transition-all"
                 >
                    Lưu Thay Đổi
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
