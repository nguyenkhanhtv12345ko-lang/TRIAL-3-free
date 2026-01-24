
export enum TransactionType {
  INCOME = 'Thu',
  EXPENSE = 'Chi'
}

export enum PaymentSource {
  CASH = 'Tiền mặt',
  BANK = 'Tài khoản'
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export interface User {
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  createdAt?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  date: string;
  content: string;
  type: TransactionType;
  source: PaymentSource;
  amount: number;
  isExcluded?: boolean; // Không tính vào hạn mức chi tiêu hàng ngày
  isFromSavings?: boolean; // Chi trực tiếp từ khoản tích lũy (Khoản nho nhỏ)
}

export interface Settings {
  userId: string;
  initialCash: number;
  initialBank: number;
  dailyCost: number;
}

export interface FinancialStats {
  currentCash: number;
  currentBank: number;
  total: number;
  survivalDays: number;
  totalIncome: number;
  totalExpense: number;
  todayExpense: number;
  cumulativeSaving: number;
}
