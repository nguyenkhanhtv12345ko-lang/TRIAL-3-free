
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface Props {
  onClose: () => void;
}

const AdminPanel: React.FC<Props> = ({ onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const savedUsers = JSON.parse(localStorage.getItem('cashflow_users') || '[]');
    setUsers(savedUsers);
  };

  const togglePassword = (username: string) => {
    setShowPasswordMap(prev => ({ ...prev, [username]: !prev[username] }));
  };

  const deleteUser = (username: string) => {
    if (username === 'admin') return alert("Tài khoản Root Admin không thể bị xóa!");
    if (window.confirm(`XÁC NHẬN: Xóa vĩnh viễn tài khoản @${username}? Thao tác này sẽ xóa toàn bộ dữ liệu giao dịch của họ.`)) {
      const updated = users.filter(u => u.username !== username);
      localStorage.setItem('cashflow_users', JSON.stringify(updated));
      localStorage.removeItem(`cashflow_transactions_${username}`);
      localStorage.removeItem(`cashflow_settings_${username}`);
      setUsers(updated);
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setNewName(user.name);
    setNewPassword(user.password || '');
  };

  const saveEdit = () => {
    if (!editingUser) return;
    if (!newName.trim()) return alert("Tên hiển thị không được để trống!");
    
    const updatedUsers = users.map(u => {
      if (u.username === editingUser.username) {
        return { ...u, name: newName, password: newPassword };
      }
      return u;
    });
    localStorage.setItem('cashflow_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setEditingUser(null);
    alert("Cập nhật thông tin thành viên thành công!");
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-tech-800 rounded-2xl shadow-2xl border border-tech-border overflow-hidden flex flex-col h-full animate-in fade-in zoom-in duration-300">
      {/* Admin Header */}
      <div className="p-6 bg-tech-900 text-white flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
            <i className="fas fa-unlock-alt text-amber-400"></i>
            Trung Tâm Quản Trị
          </h2>
          <p className="text-[10px] font-bold text-tech-muted/80 uppercase tracking-widest mt-1">
            Quản lý {users.length} tài khoản trong hệ thống
          </p>
        </div>
        <button onClick={onClose} className="w-10 h-10 bg-tech-800/10 rounded-xl flex items-center justify-center hover:bg-rose-500/100 transition-all">
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-tech-900 border-b border-tech-border">
        <div className="relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-tech-muted/80 text-xs"></i>
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-tech-800 border border-tech-border rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-tech-cyan/50 transition-all"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
        {filteredUsers.length === 0 ? (
          <div className="py-20 text-center text-tech-muted/60">
            <i className="fas fa-user-slash text-4xl mb-4 opacity-20"></i>
            <p className="text-xs font-bold uppercase tracking-widest">Không tìm thấy thành viên</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-tech-800 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-tech-muted/80 uppercase tracking-widest">Thành viên</th>
                <th className="px-6 py-4 text-[10px] font-black text-tech-muted/80 uppercase tracking-widest text-right">Tác vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tech-border/50">
              {filteredUsers.map(u => (
                <tr key={u.username} className="hover:bg-tech-900/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${u.role === UserRole.ADMIN ? 'bg-amber-100 text-amber-600' : 'bg-tech-cyan/20 text-tech-cyan'}`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          {u.name}
                          {u.role === UserRole.ADMIN && <span className="bg-amber-400 text-[8px] text-white px-1 rounded uppercase">Admin</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-tech-muted/80 font-mono">@{u.username}</span>
                          <span className="text-tech-muted/40">•</span>
                          <div className="flex items-center gap-1 group cursor-pointer" onClick={() => togglePassword(u.username)}>
                             <span className="text-[10px] text-tech-muted/80 font-mono">
                               {showPasswordMap[u.username] ? u.password : '••••••••'}
                             </span>
                             <i className={`fas ${showPasswordMap[u.username] ? 'fa-eye-slash' : 'fa-eye'} text-[8px] text-tech-muted/60 group-hover:text-tech-cyan`}></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => startEdit(u)}
                        className="w-9 h-9 rounded-xl bg-tech-cyan/10 text-tech-cyan hover:bg-tech-cyan hover:text-tech-900 transition-all flex items-center justify-center shadow-sm"
                        title="Chỉnh sửa hồ sơ"
                      >
                        <i className="fas fa-edit text-[10px]"></i>
                      </button>
                      {u.username !== 'admin' && (
                        <button 
                          onClick={() => deleteUser(u.username)}
                          className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                          title="Xóa tài khoản"
                        >
                          <i className="fas fa-user-minus text-[10px]"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-tech-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-tech-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
            <div className="p-6 bg-tech-900 text-white">
              <h4 className="font-black uppercase tracking-tighter">Cập nhật hồ sơ</h4>
              <p className="text-[10px] opacity-70 font-bold uppercase mt-1 tracking-widest">Tài khoản: @{editingUser.username}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-tech-muted/80 uppercase tracking-widest ml-1 block">Tên hiển thị mới</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-tech-900 border border-tech-border rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-tech-cyan/50 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-tech-muted/80 uppercase tracking-widest ml-1 block">Mật khẩu mới</label>
                <input 
                  type="text" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-tech-900 border border-tech-border rounded-2xl px-4 py-3 text-sm font-mono text-white outline-none focus:ring-2 focus:ring-tech-cyan/50 transition-all"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-4 bg-tech-700 text-tech-muted rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                >
                  Đóng
                </button>
                <button 
                  onClick={saveEdit}
                  className="flex-2 py-4 bg-tech-cyan text-tech-900 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-tech-cyan/20"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
