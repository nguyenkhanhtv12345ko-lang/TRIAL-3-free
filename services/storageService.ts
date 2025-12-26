
import { Transaction, Settings, User } from "../types";

/**
 * Dịch vụ giả lập Server. 
 * Trong thực tế, bạn sẽ thay các hàm này bằng fetch('https://api.yourserver.com/...')
 */
export const storageService = {
  // Giả lập độ trễ mạng để tăng tính thực tế
  async simulateNetwork() {
    return new Promise(resolve => setTimeout(resolve, 800));
  },

  // QUẢN LÝ TÀI KHOẢN
  async getUsers(): Promise<User[]> {
    const data = localStorage.getItem('cashflow_users');
    return data ? JSON.parse(data) : [];
  },

  async saveUser(user: User) {
    const users = await this.getUsers();
    users.push(user);
    localStorage.setItem('cashflow_users', JSON.stringify(users));
  },

  // QUẢN LÝ DỮ LIỆU THEO TÀI KHOẢN
  async getData(username: string): Promise<{ transactions: Transaction[], settings: Settings }> {
    await this.simulateNetwork();
    const trans = localStorage.getItem(`cashflow_transactions_${username}`);
    const settings = localStorage.getItem(`cashflow_settings_${username}`);
    
    return {
      transactions: trans ? JSON.parse(trans) : [],
      settings: settings ? JSON.parse(settings) : { userId: username, initialCash: 0, initialBank: 0, dailyCost: 0 }
    };
  },

  async syncData(username: string, transactions: Transaction[], settings: Settings) {
    // Đây là nơi bạn sẽ gọi API POST để lưu lên server
    localStorage.setItem(`cashflow_transactions_${username}`, JSON.stringify(transactions));
    localStorage.setItem(`cashflow_settings_${username}`, JSON.stringify(settings));
    localStorage.setItem(`last_sync_${username}`, new Date().toISOString());
    return true;
  },

  getLastSync(username: string): string {
    return localStorage.getItem(`last_sync_${username}`) || "Chưa đồng bộ";
  }
};
