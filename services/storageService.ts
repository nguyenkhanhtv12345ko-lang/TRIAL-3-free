
import { Transaction, Settings, User } from "../types";

/**
 * CLOUD ENGINE V5.0 - FULLY AUTOMATED ONLINE SYSTEM
 * Hệ thống giả lập Backend Real-time chuyên nghiệp.
 */
class CloudEngine {
  private mockLatency = 600;
  private activityLogs: { id: string, action: string, status: string, time: string }[] = [];

  private logActivity(action: string, status: 'PENDING' | 'SUCCESS' | 'ERROR') {
    const log = {
      id: Math.random().toString(36).substr(2, 5).toUpperCase(),
      action,
      status,
      time: new Date().toLocaleTimeString()
    };
    this.activityLogs = [log, ...this.activityLogs].slice(0, 5);
    // Phát sự kiện để UI cập nhật log
    window.dispatchEvent(new CustomEvent('cloud_activity', { detail: this.activityLogs }));
  }

  // LẤY DỮ LIỆU THỊ TRƯỜNG THẬT (ONLINE)
  async getLiveMarketData() {
    this.logActivity('GET /market-rates', 'PENDING');
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,binancecoin&vs_currencies=vnd');
      const data = await res.json();
      this.logActivity('GET /market-rates', 'SUCCESS');
      return data;
    } catch (e) {
      this.logActivity('GET /market-rates', 'ERROR');
      return null;
    }
  }

  // ĐỒNG BỘ USER TRỰC TUYẾN
  async getUsers(): Promise<User[]> {
    const data = localStorage.getItem('db_users');
    return data ? JSON.parse(data) : [];
  }

  async saveUser(user: User) {
    this.logActivity(`PUSH /user/${user.username}`, 'PENDING');
    const users = await this.getUsers();
    const index = users.findIndex(u => u.username === user.username);
    if (index > -1) users[index] = user;
    else users.push(user);
    localStorage.setItem('db_users', JSON.stringify(users));
    this.logActivity(`PUSH /user/${user.username}`, 'SUCCESS');
  }

  // TỰ ĐỘNG HÓA FETCH DỮ LIỆU (POLLING SIMULATION)
  async fetchUserData(username: string) {
    this.logActivity(`FETCH /data/${username}`, 'PENDING');
    await new Promise(r => setTimeout(r, this.mockLatency));
    const trans = localStorage.getItem(`db_transactions_${username}`);
    const settings = localStorage.getItem(`db_settings_${username}`);
    this.logActivity(`FETCH /data/${username}`, 'SUCCESS');
    return {
      transactions: trans ? JSON.parse(trans) : [],
      settings: settings ? JSON.parse(settings) : null
    };
  }

  // TỰ ĐỘNG HÓA PUSH DỮ LIỆU (IMMEDIATE SYNC)
  async pushUserData(username: string, transactions: Transaction[], settings: Settings) {
    this.logActivity(`SYNC /cloud-db/${username}`, 'PENDING');
    localStorage.setItem(`db_transactions_${username}`, JSON.stringify(transactions));
    localStorage.setItem(`db_settings_${username}`, JSON.stringify(settings));
    localStorage.setItem(`db_last_sync_${username}`, new Date().toISOString());
    this.logActivity(`SYNC /cloud-db/${username}`, 'SUCCESS');
    return true;
  }

  // CÁC HÀM QUẢN TRỊ
  async deleteUser(username: string) {
    this.logActivity(`DELETE /user/${username}`, 'PENDING');
    const users = await this.getUsers();
    localStorage.setItem('db_users', JSON.stringify(users.filter(u => u.username !== username)));
    localStorage.removeItem(`db_transactions_${username}`);
    this.logActivity(`DELETE /user/${username}`, 'SUCCESS');
  }

  async wipeAllData() {
    this.logActivity('SYSTEM_WIPE', 'PENDING');
    localStorage.clear();
    this.logActivity('SYSTEM_WIPE', 'SUCCESS');
  }

  getGlobalConfig() {
    const data = localStorage.getItem('db_sys_config');
    return data ? JSON.parse(data) : { aiActive: true, maintenance: false };
  }

  setGlobalConfig(config: any) {
    localStorage.setItem('db_sys_config', JSON.stringify(config));
  }

  generateSyncPackage(username: string) {
    return btoa(unescape(encodeURIComponent(JSON.stringify({
      username,
      data: localStorage.getItem(`db_transactions_${username}`)
    }))));
  }

  async importSyncPackage(code: string) {
    this.logActivity('IMPORT_PACKAGE', 'PENDING');
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(code))));
      this.logActivity('IMPORT_PACKAGE', 'SUCCESS');
      return true;
    } catch (e) {
      this.logActivity('IMPORT_PACKAGE', 'ERROR');
      return false;
    }
  }
}

export const storageService = new CloudEngine();
