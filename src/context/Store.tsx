import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Account, Transaction, AppSettings, User } from '../types';
import { INITIAL_ACCOUNTS, INITIAL_SETTINGS, INITIAL_USERS } from '../constants';
import { createClient } from '@supabase/supabase-js';

interface StoreContextType {
  accounts: Account[];
  transactions: Transaction[];
  settings: AppSettings;
  users: User[];
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
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
  saveToCloud: () => Promise<boolean>;
  loadFromCloud: () => Promise<boolean>;
  syncWithSupabase: (direction: 'push' | 'pull') => Promise<{ success: boolean; message: string }>;
  isSyncing: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[0]);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Load from local storage on mount
  useEffect(() => {
    const storedData = localStorage.getItem('proAccountingData');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (parsed.accounts) setAccounts(parsed.accounts);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.users) {
           setUsers(parsed.users);
           if (parsed.users.length > 0) setCurrentUser(parsed.users[0]);
        }
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    const data = { accounts, transactions, settings, users };
    localStorage.setItem('proAccountingData', JSON.stringify(data));
    
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [accounts, transactions, settings, users]);

  const saveToCloud = async (): Promise<boolean> => {
    if (!settings.remoteStorageUrl) return false;
    setIsSyncing(true);
    try {
        const data = { accounts, transactions, settings, users };
        // Generic fetch that works with JSONBin (PUT for update) and others
        const response = await fetch(settings.remoteStorageUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(settings.remoteStorageApiKey ? { 
                    'Authorization': `Bearer ${settings.remoteStorageApiKey}`, 
                    'X-Master-Key': settings.remoteStorageApiKey, 
                    'X-Access-Key': settings.remoteStorageApiKey 
                } : {})
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
             // Fallback to POST
             const responsePost = await fetch(settings.remoteStorageUrl, {
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json',
                    ...(settings.remoteStorageApiKey ? { 
                        'Authorization': `Bearer ${settings.remoteStorageApiKey}`, 
                        'X-Master-Key': settings.remoteStorageApiKey,
                        'X-Access-Key': settings.remoteStorageApiKey 
                    } : {})
                },
                body: JSON.stringify(data)
            });
            if (!responsePost.ok) throw new Error("Cloud save failed");
        }
        
        setIsSyncing(false);
        return true;
    } catch (e) {
        console.error("Cloud Save Error:", e);
        setIsSyncing(false);
        return false;
    }
  };

  const syncWithSupabase = async (direction: 'push' | 'pull'): Promise<{ success: boolean; message: string }> => {
    if (!settings.supabaseUrl || !settings.supabaseKey) {
        return { success: false, message: 'Supabase URL and Key are required.' };
    }

    setIsSyncing(true);
    try {
        const supabase = createClient(settings.supabaseUrl, settings.supabaseKey);
        const BACKUP_ID = 'pro_accounting_backup'; // Fixed ID for simplicity in this version

        if (direction === 'push') {
            const backupData = { accounts, transactions, settings, users };
            // Upsert: Insert or Update
            const { error } = await supabase
                .from('app_storage') // Assumes table 'app_storage' exists
                .upsert({ id: BACKUP_ID, data: backupData, updated_at: new Date().toISOString() });

            if (error) throw error;
            setIsSyncing(false);
            return { success: true, message: 'Data saved to Supabase successfully.' };
        } else {
            const { data, error } = await supabase
                .from('app_storage')
                .select('data')
                .eq('id', BACKUP_ID)
                .single();

            if (error) throw error;
            if (!data || !data.data) throw new Error("No backup found.");

            const success = restoreData(JSON.stringify(data.data));
            setIsSyncing(false);
            return { success, message: success ? 'Data loaded from Supabase.' : 'Failed to parse data.' };
        }
    } catch (e: any) {
        console.error("Supabase Sync Error", e);
        setIsSyncing(false);
        if (e.code === '42P01') {
            return { success: false, message: "Table 'app_storage' does not exist in Supabase. Run the SQL setup." };
        }
        return { success: false, message: e.message || 'Supabase sync failed.' };
    }
  };

  // Auto-Save Effect
  useEffect(() => {
    if (settings.autoCloudSave) {
        const timer = setTimeout(() => {
            if(!isSyncing) {
                if (settings.supabaseUrl && settings.supabaseKey) {
                    console.log("Auto-saving to Supabase...");
                    syncWithSupabase('push').catch(e => console.error(e));
                } else if (settings.remoteStorageUrl) {
                    console.log("Auto-saving to Remote URL...");
                    saveToCloud().catch(e => console.error(e));
                }
            }
        }, 5000); // 5 second debounce
        return () => clearTimeout(timer);
    }
  }, [accounts, transactions, users, settings.autoCloudSave, settings.supabaseUrl, settings.supabaseKey, settings.remoteStorageUrl]);

  const loadFromCloud = async (): Promise<boolean> => {
      if (!settings.remoteStorageUrl) return false;
      setIsSyncing(true);
      try {
          const response = await fetch(settings.remoteStorageUrl, {
              method: 'GET',
              headers: {
                  'Content-Type': 'application/json',
                  ...(settings.remoteStorageApiKey ? { 
                      'Authorization': `Bearer ${settings.remoteStorageApiKey}`, 
                      'X-Master-Key': settings.remoteStorageApiKey,
                      'X-Access-Key': settings.remoteStorageApiKey 
                  } : {})
              }
          });
          
          if (!response.ok) throw new Error("Cloud load failed");
          
          const result = await response.json();
          const data = result.record ? result.record : result;
          
          const success = restoreData(JSON.stringify(data));
          setIsSyncing(false);
          return success;
      } catch (e) {
          console.error("Cloud Load Error:", e);
          setIsSyncing(false);
          return false;
      }
  };

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
    setCurrentUser(INITIAL_USERS[0]);
  };

  const restoreData = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed.accounts)) return false;
      setAccounts(parsed.accounts);
      setTransactions(parsed.transactions || []);
      setSettings(parsed.settings || INITIAL_SETTINGS);
      setUsers(parsed.users || INITIAL_USERS);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <StoreContext.Provider value={{
      accounts,
      transactions,
      settings,
      users,
      currentUser,
      setCurrentUser,
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
      restoreData,
      saveToCloud,
      loadFromCloud,
      syncWithSupabase,
      isSyncing
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