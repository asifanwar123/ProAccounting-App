export enum AccountType {
  ASSET = 'Asset',
  LIABILITY = 'Liability',
  EQUITY = 'Equity',
  INCOME = 'Income',
  EXPENSE = 'Expense'
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  description?: string;
}

export interface JournalEntryLine {
  accountId: string;
  debit: number;
  credit: number;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  lines: JournalEntryLine[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  mobile?: string;
  address?: string;
  role: 'admin' | 'viewer';
}

export interface AppSettings {
  language: string;
  currency: string;
  currencySign: string;
  showCurrencySign: boolean;
  theme: 'light' | 'dark';
  companyName: string;
  companyLogo?: string;
  taxRate: number;
}

export interface FinancialSummary {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
}
