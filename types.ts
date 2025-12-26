
export enum TransactionType {
  INCOME = 'Thu',
  EXPENSE = 'Chi'
}

export enum PaymentSource {
  CASH = 'Tiền mặt',
  BANK = 'Tài khoản'
}

export interface Transaction {
  id: string;
  date: string;
  content: string;
  type: TransactionType;
  source: PaymentSource;
  amount: number;
}

export interface Settings {
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
}
