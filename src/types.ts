export enum AccountType {
  ASSET = 'Asset',
  LIABILITY = 'Liability',
  EQUITY = 'Equity',
  INCOME = 'Income',
  EXPENSE = 'Expense'
}

export type Permission = 'manage_settings' | 'manage_users' | 'manage_accounts' | 'manage_transactions' | 'view_reports';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  description?: string;
  openingBalance?: number;
}

export interface JournalEntryLine {
  accountId: string;
  debit: number;
  credit: number;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  description: string;
  lines: JournalEntryLine[];
  contact?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  mobile?: string;
  address?: string;
  role: 'admin' | 'viewer' | 'editor'; 
  permissions: Permission[];
}

export interface ReportConfig {
  showZeroBalance: boolean;
  showAccountCodes: boolean;
  compactView: boolean;
  headerText?: string;
  footerText?: string;
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
  exchangeRate: number;
  plan: 'free' | 'pro';
  billingDate?: string;
  googleClientId?: string;
  googleApiKey?: string;
  remoteStorageUrl?: string;
  remoteStorageApiKey?: string;
  autoCloudSave?: boolean;
  supabaseUrl?: string;
  supabaseKey?: string;
  reportConfig: ReportConfig;
  lowStockThreshold?: number;
  emailNotifications?: boolean;
  notificationEmail?: string;
}

export interface FinancialSummary {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
}

export interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success';
  message: string;
  date: string;
  read: boolean;
}

export interface BackupData {
  appVersion: string;
  exportDate: string;
  accounts: Account[];
  transactions: Transaction[];
  settings: AppSettings;
  users: User[];
}