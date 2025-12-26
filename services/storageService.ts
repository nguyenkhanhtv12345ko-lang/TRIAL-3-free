
import { Transaction, Settings, User } from "../types";

/**
 * CLOUD API CLIENT V4.0 - MULTI-DEVICE SYNC ENGINE
 * Mô phỏng khả năng đồng bộ xuyên thiết bị.
 */
class CloudAPIClient {
  private mockLatency = 800;

  // LẤY DỮ LIỆU THỊ TRƯỜNG THẬT
  async getLiveMarketData() {
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=vnd');
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  // QUẢN LÝ USER & SESSION
  async getUsers(): Promise<User[]> {
    const data = localStorage.getItem('db_users');
    return data ? JSON.parse(data) : [];
  }

  async saveUser(user: User) {
    const users = await this.getUsers();
    const index = users.findIndex(u => u.username === user.username);
    if (index > -1) users[index] = user;
    else users.push(user);
    localStorage.setItem('db_users', JSON.stringify(users));
  }

  async updateUser(user: User) {
    await this.saveUser(user);
  }

  // TÍNH NĂNG "MULTI-DEVICE" - XUẤT GÓI DỮ LIỆU ĐÁM MÂY
  // Cho phép lấy mã này nhập sang trình duyệt/thiết bị khác
  generateSyncPackage(username: string): string {
    const transactions = localStorage.getItem(`db_transactions_${username}`);
    const settings = localStorage.getItem(`db_settings_${username}`);
    const user = JSON.parse(localStorage.getItem('db_users') || '[]').find((u: any) => u.username === username);
    
    const payload = {
      user,
      transactions: transactions ? JSON.parse(transactions) : [],
      settings: settings ? JSON.parse(settings) : null,
      timestamp: new Date().toISOString()
    };
    
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  }

  // TÍNH NĂNG "MULTI-DEVICE" - NHẬP GÓI DỮ LIỆU TỪ THIẾT BỊ KHÁC
  async importSyncPackage(code: string): Promise<boolean> {
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(code))));
      if (!decoded.user || !decoded.user.username) return false;

      const username = decoded.user.username;
      
      // Lưu user vào danh sách hệ thống máy mới
      await this.saveUser(decoded.user);
      
      // Lưu data đi kèm
      localStorage.setItem(`db_transactions_${username}`, JSON.stringify(decoded.transactions));
      localStorage.setItem(`db_settings_${username}`, JSON.stringify(decoded.settings));
      localStorage.setItem(`db_last_sync_${username}`, new Date().toISOString());
      
      return true;
    } catch (e) {
      console.error("Sync Error:", e);
      return false;
    }
  }

  // QUẢN LÝ DỮ LIỆU CHI TIẾT
  async fetchUserData(username: string) {
    await new Promise(r => setTimeout(r, this.mockLatency));
    const trans = localStorage.getItem(`db_transactions_${username}`);
    const settings = localStorage.getItem(`db_settings_${username}`);
    return {
      transactions: trans ? JSON.parse(trans) : [],
      settings: settings ? JSON.parse(settings) : null
    };
  }

  async pushUserData(username: string, transactions: Transaction[], settings: Settings) {
    localStorage.setItem(`db_transactions_${username}`, JSON.stringify(transactions));
    localStorage.setItem(`db_settings_${username}`, JSON.stringify(settings));
    localStorage.setItem(`db_last_sync_${username}`, new Date().toISOString());
    return true;
  }

  getLastSync(username: string) {
    return localStorage.getItem(`db_last_sync_${username}`) || "Vừa xong";
  }

  getGlobalConfig() {
    const data = localStorage.getItem('db_sys_config');
    return data ? JSON.parse(data) : { aiActive: true, maintenance: false };
  }

  setGlobalConfig(config: any) {
    localStorage.setItem('db_sys_config', JSON.stringify(config));
  }

  // Fix: Added wipeAllData to clear local storage based on app keys
  async wipeAllData() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('db_') || key.startsWith('cashflow_')) {
        localStorage.removeItem(key);
      }
    });
  }

  // Fix: Added deleteUser to remove user and their associated data
  async deleteUser(username: string) {
    const users = await this.getUsers();
    const updatedUsers = users.filter(u => u.username !== username);
    localStorage.setItem('db_users', JSON.stringify(updatedUsers));
    localStorage.removeItem(`db_transactions_${username}`);
    localStorage.removeItem(`db_settings_${username}`);
    localStorage.removeItem(`db_last_sync_${username}`);
  }
}

export const storageService = new CloudAPIClient();
