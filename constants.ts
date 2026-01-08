import { Account, AccountType, AppSettings, User } from './types';

export const INITIAL_ACCOUNTS: Account[] = [
  { id: '1', code: '10000', name: 'Cash', type: AccountType.ASSET },
  { id: '2', code: '10100', name: 'Accounts Receivable', type: AccountType.ASSET },
  { id: '3', code: '10200', name: 'Inventory', type: AccountType.ASSET },
  { id: '4', code: '10300', name: 'Bank', type: AccountType.ASSET },
  { id: '5', code: '20000', name: 'Accounts Payable', type: AccountType.LIABILITY },
  { id: '6', code: '20100', name: 'Sales Tax Payable', type: AccountType.LIABILITY },
  { id: '7', code: '30000', name: 'Owner\'s Equity', type: AccountType.EQUITY },
  { id: '8', code: '40000', name: 'Sales Revenue', type: AccountType.INCOME },
  { id: '9', code: '40100', name: 'Service Revenue', type: AccountType.INCOME },
  { id: '10', code: '50000', name: 'Cost of Goods Sold', type: AccountType.EXPENSE },
  { id: '11', code: '50100', name: 'Rent Expense', type: AccountType.EXPENSE },
  { id: '12', code: '50200', name: 'Utilities Expense', type: AccountType.EXPENSE },
  { id: '13', code: '50300', name: 'Salaries Expense', type: AccountType.EXPENSE },
];

export const INITIAL_SETTINGS: AppSettings = {
  language: 'English',
  currency: 'USD',
  currencySign: '$',
  showCurrencySign: true,
  theme: 'light',
  companyName: 'My Company',
  taxRate: 0,
};

export const INITIAL_USERS: User[] = [
  { id: '1', username: 'admin', email: 'admin@example.com', role: 'admin', mobile: '+123456789', address: '123 Admin St' }
];

export const CURRENCIES = [
  { code: 'USD', sign: '$', name: 'US Dollar' },
  { code: 'PKR', sign: 'Rs', name: 'Pakistani Rupee' },
  { code: 'JPY', sign: '¥', name: 'Japanese Yen' },
  { code: 'CNY', sign: '¥', name: 'Chinese Yuan' },
];

export const LANGUAGES = ['English', 'Urdu', 'Hindi', 'Russian'];
