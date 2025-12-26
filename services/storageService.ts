
import { Transaction, Settings, User } from "../types";

/**
 * CLOUD STORAGE ENGINE V2.0
 * Mô phỏng một Backend thực thụ với Database tập trung
 */
export const storageService = {
  // Cấu hình giả lập
  config: {
    apiUrl: "https://api.cashflow-master.cloud/v2",
    latency: 1200, // ms
  },

  async simulateNetwork(customLatency?: number) {
    const l = customLatency !== undefined ? customLatency : this.config.latency;
    return new Promise(resolve => setTimeout(resolve, Math.random() * 500 + l));
  },

  // HỆ THỐNG QUẢN TRỊ SERVER (GLOBAL STATE)
  getGlobalConfig() {
    const config = localStorage.getItem('cashflow_system_config');
    return config ? JSON.parse(config) : { aiActive: false, serverStatus: 'online' };
  },

  setGlobalConfig(config: { aiActive: boolean, serverStatus: string }) {
    localStorage.setItem('cashflow_system_config', JSON.stringify(config));
  },

  // QUẢN LÝ TÀI KHOẢN (CENTRAL DB)
  async getUsers(): Promise<User[]> {
    await this.simulateNetwork(500); // Admin load nhanh hơn tí
    const data = localStorage.getItem('cashflow_users');
    return data ? JSON.parse(data) : [];
  },

  async saveUser(user: User) {
    await this.simulateNetwork();
    const users = await this.getUsers();
    users.push(user);
    localStorage.setItem('cashflow_users', JSON.stringify(users));
  },

  async updateUser(updatedUser: User) {
    await this.simulateNetwork(1000);
    const users = await this.getUsers();
    const updated = users.map(u => u.username === updatedUser.username ? updatedUser : u);
    localStorage.setItem('cashflow_users', JSON.stringify(updated));
    return true;
  },

  async deleteUser(username: string) {
    await this.simulateNetwork(1000);
    const users = await this.getUsers();
    const updated = users.filter(u => u.username !== username);
    localStorage.setItem('cashflow_users', JSON.stringify(updated));
    // Dọn dẹp data của user đó luôn
    localStorage.removeItem(`cloud_db_transactions_${username}`);
    localStorage.removeItem(`cloud_db_settings_${username}`);
    localStorage.removeItem(`last_cloud_sync_${username}`);
    return true;
  },

  // QUẢN LÝ DỮ LIỆU CLOUD (DỮ LIỆU ĐI THEO USER_ID TRÊN SERVER)
  async fetchUserData(username: string): Promise<{ transactions: Transaction[], settings: Settings }> {
    console.log(`[CloudAPI] Fetching data for user: ${username}`);
    await this.simulateNetwork();
    
    const trans = localStorage.getItem(`cloud_db_transactions_${username}`);
    const settings = localStorage.getItem(`cloud_db_settings_${username}`);
    
    return {
      transactions: trans ? JSON.parse(trans) : [],
      settings: settings ? JSON.parse(settings) : { userId: username, initialCash: 0, initialBank: 0, dailyCost: 0 }
    };
  },

  async pushUserData(username: string, transactions: Transaction[], settings: Settings) {
    console.log(`[CloudAPI] Pushing update to server for: ${username}`);
    await this.simulateNetwork();
    
    localStorage.setItem(`cloud_db_transactions_${username}`, JSON.stringify(transactions));
    localStorage.setItem(`cloud_db_settings_${username}`, JSON.stringify(settings));
    localStorage.setItem(`last_cloud_sync_${username}`, new Date().toISOString());
    return { status: "success", timestamp: new Date().toISOString() };
  },

  getLastSync(username: string): string {
    return localStorage.getItem(`last_cloud_sync_${username}`) || "Chưa đồng bộ";
  },

  // ADMIN SYSTEM COMMANDS
  async wipeAllData() {
    await this.simulateNetwork(2000);
    const users = await this.getUsers();
    users.forEach(user => {
      localStorage.removeItem(`cloud_db_transactions_${user.username}`);
      localStorage.removeItem(`cloud_db_settings_${user.username}`);
      localStorage.removeItem(`last_cloud_sync_${user.username}`);
    });
    localStorage.removeItem('cashflow_users');
    localStorage.removeItem('cashflow_current_user');
    localStorage.removeItem('cashflow_system_config');
    return true;
  }
};
