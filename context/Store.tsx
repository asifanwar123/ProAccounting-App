import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Account, Transaction, AppSettings, User } from '../types';
import { INITIAL_ACCOUNTS, INITIAL_SETTINGS, INITIAL_USERS } from '../constants';

interface StoreContextType {
  accounts: Account[];
  transactions: Transaction[];
  settings: AppSettings;
  users: User[];
  addAccount: (account: Account) => void;
  updateAccount: (account: Account) => void;
  deleteAccount: (id: string) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  updateSettings: (settings: AppSettings) => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
  resetData: () => void;
  restoreData: (data: string) => boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);

  // Load from local storage on mount
  useEffect(() => {
    const storedData = localStorage.getItem('proAccountingData');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (parsed.accounts) setAccounts(parsed.accounts);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.users) setUsers(parsed.users);
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    const data = { accounts, transactions, settings, users };
    localStorage.setItem('proAccountingData', JSON.stringify(data));
    
    // Apply theme
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [accounts, transactions, settings, users]);

  const addAccount = (account: Account) => setAccounts([...accounts, account]);
  const updateAccount = (account: Account) => setAccounts(accounts.map(a => a.id === account.id ? account : a));
  const deleteAccount = (id: string) => setAccounts(accounts.filter(a => a.id !== id));

  const addTransaction = (transaction: Transaction) => setTransactions([...transactions, transaction]);
  const updateTransaction = (transaction: Transaction) => setTransactions(transactions.map(t => t.id === transaction.id ? transaction : t));
  const deleteTransaction = (id: string) => setTransactions(transactions.filter(t => t.id !== id));

  const updateSettings = (newSettings: AppSettings) => setSettings(newSettings);

  const addUser = (user: User) => setUsers([...users, user]);
  const updateUser = (user: User) => setUsers(users.map(u => u.id === user.id ? user : u));
  const deleteUser = (id: string) => setUsers(users.filter(u => u.id !== id));

  const resetData = () => {
    setAccounts(INITIAL_ACCOUNTS);
    setTransactions([]);
    setSettings(INITIAL_SETTINGS);
    setUsers(INITIAL_USERS);
  };

  const restoreData = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      // Basic validation
      if (!Array.isArray(parsed.accounts)) return false;
      setAccounts(parsed.accounts);
      setTransactions(parsed.transactions || []);
      setSettings(parsed.settings || INITIAL_SETTINGS);
      setUsers(parsed.users || INITIAL_USERS);
      return true;
    } catch (e) {
      return false;
    }
  }

  return (
    <StoreContext.Provider value={{
      accounts,
      transactions,
      settings,
      users,
      addAccount,
      updateAccount,
      deleteAccount,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      updateSettings,
      addUser,
      updateUser,
      deleteUser,
      resetData,
      restoreData
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};