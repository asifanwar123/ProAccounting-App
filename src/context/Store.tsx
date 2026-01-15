import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Account, Transaction, AppSettings, User, AccountType, Permission, Notification } from '../types';
import { INITIAL_ACCOUNTS, INITIAL_SETTINGS, INITIAL_USERS, ADMIN_PERMISSIONS, VIEWER_PERMISSIONS } from '../constants';
import { createClient } from '@supabase/supabase-js';

declare const gapi: any;

interface StoreContextType {
  accounts: Account[];
  transactions: Transaction[];
  settings: AppSettings;
  users: User[];
  currentUser: User | null;
  notifications: Notification[];
  syncStatus: string;
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
  loadDemoData: () => void;
  saveToCloud: () => Promise<boolean>;
  loadFromCloud: () => Promise<boolean>;
  syncWithSupabase: (direction: 'push' | 'pull') => Promise<{ success: boolean; message: string }>;
  isSyncing: boolean;
  hasPermission: (permission: Permission) => boolean;
  markNotificationRead: (id: string) => void;
  generateNotifications: () => void;
  forceGoogleSheetSync: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[0]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [syncStatus, setSyncStatus] = useState('');
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Load from local storage on mount
  useEffect(() => {
    const storedData = localStorage.getItem('proAccountingData');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (parsed.accounts) setAccounts(parsed.accounts);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.settings) setSettings({ ...INITIAL_SETTINGS, ...parsed.settings });
        if (parsed.users) {
           const updatedUsers = parsed.users.map((u: User) => ({
             ...u,
             permissions: u.permissions || (u.role === 'admin' ? ADMIN_PERMISSIONS : VIEWER_PERMISSIONS)
           }));
           setUsers(updatedUsers);
           if (updatedUsers.length > 0) setCurrentUser(updatedUsers[0]);
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

  // Google Sheets Auto-Sync Logic
  const syncToGoogleSheet = useCallback(async () => {
    if (!settings.enableSheetSync || !settings.googleSheetId) return;
    if (typeof gapi === 'undefined' || !gapi.client || !gapi.client.sheets) {
        setSyncStatus('Google API not ready');
        return;
    }

    const authInstance = gapi.auth2?.getAuthInstance();
    if (!authInstance?.isSignedIn.get()) {
        setSyncStatus('Not signed in to Google');
        return;
    }

    setSyncStatus('Syncing to Sheets...');
    try {
        const spreadsheetId = settings.googleSheetId;

        // Prepare Data Arrays
        // Sheet 1: Transactions
        const txHeader = ['ID', 'Date', 'Description', 'Total Amount', 'Currency', 'Exchange Rate', 'Account', 'Debit', 'Credit'];
        const txData = transactions.flatMap(t => {
            const total = t.lines.reduce((s, l) => s + l.debit, 0);
            return t.lines.map(l => {
                const acc = accounts.find(a => a.id === l.accountId);
                return [
                    t.id, 
                    t.date, 
                    t.description, 
                    total, 
                    t.currency || 'USD', 
                    t.exchangeRate || 1, 
                    acc ? `${acc.code} - ${acc.name}` : l.accountId, 
                    l.debit, 
                    l.credit
                ];
            });
        });

        // Sheet 2: Accounts
        const accHeader = ['ID', 'Code', 'Name', 'Type', 'Opening Balance', 'Current Balance (Calc)'];
        const accData = accounts.map(a => {
            let balance = a.openingBalance || 0;
            const isDebitNormal = a.type === AccountType.ASSET || a.type === AccountType.EXPENSE;
            transactions.forEach(t => {
                t.lines.forEach(l => {
                    if (l.accountId === a.id) {
                        balance += isDebitNormal ? (l.debit - l.credit) : (l.credit - l.debit);
                    }
                });
            });
            return [a.id, a.code, a.name, a.type, a.openingBalance || 0, balance];
        });

        const bodyTx = { values: [txHeader, ...txData] };
        const bodyAcc = { values: [accHeader, ...accData] };

        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Transactions!A1', 
            valueInputOption: 'USER_ENTERED',
            resource: bodyTx
        }).then(null, async (err: any) => {
            if (err.result && err.result.error && err.result.error.code === 400) {
                 await gapi.client.sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: 'Sheet1!A1',
                    valueInputOption: 'USER_ENTERED',
                    resource: bodyTx
                });
            } else {
                throw err;
            }
        });

        try {
             await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Accounts!A1',
                valueInputOption: 'USER_ENTERED',
                resource: bodyAcc
            });
        } catch (e) {
            console.warn("Could not write Accounts sheet. Make sure a sheet named 'Accounts' exists.");
        }

        setSyncStatus(`Synced at ${new Date().toLocaleTimeString()}`);
    } catch (error: any) {
        console.error("Sheet Sync Error", error);
        setSyncStatus('Sync Failed: ' + (error.result?.error?.message || error.message));
    }
  }, [accounts, transactions, settings.googleSheetId, settings.enableSheetSync]);

  // Debounced Sync Effect
  useEffect(() => {
      if (settings.enableSheetSync) {
          if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
          setSyncStatus('Waiting to sync...');
          syncTimeoutRef.current = setTimeout(() => {
              syncToGoogleSheet();
          }, 5000); // 5 second debounce
      } else {
          setSyncStatus('');
      }
      return () => {
          if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      }
  }, [transactions, accounts, settings.enableSheetSync, syncToGoogleSheet]);


  // Notifications Logic
  const generateNotifications = useCallback(() => {
    const newNotifs: Notification[] = [];
    const today = new Date();

    // 1. Check Due Dates
    transactions.forEach(t => {
       if (t.dueDate) {
           const due = new Date(t.dueDate);
           const diffTime = due.getTime() - today.getTime();
           const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
           
           if (diffDays >= 0 && diffDays <= 3) {
               newNotifs.push({
                   id: `due-${t.id}`,
                   type: 'warning',
                   message: `Bill due soon: ${t.description} (${t.dueDate})`,
                   date: today.toISOString(),
                   read: false
               });
           }
       }
    });

    // 2. Low Stock (Simulated based on Inventory Asset Balance)
    const inventoryAcc = accounts.find(a => a.name.toLowerCase().includes('inventory'));
    if (inventoryAcc) {
        let balance = inventoryAcc.openingBalance || 0;
        transactions.forEach(t => {
            t.lines.forEach(l => {
                if(l.accountId === inventoryAcc.id) {
                    balance += (l.debit - l.credit);
                }
            });
        });

        const threshold = settings.lowStockThreshold || 1000;
        if (balance < threshold) {
            newNotifs.push({
                id: `stock-${today.getDate()}`,
                type: 'warning',
                message: `Low Inventory Value: ${settings.currencySign}${balance} (Threshold: ${threshold})`,
                date: today.toISOString(),
                read: false
            });
        }
    }

    setNotifications(prev => {
        // Merge without duplicates based on ID
        const combined = [...prev];
        newNotifs.forEach(n => {
            if(!combined.find(c => c.id === n.id)) combined.push(n);
        });
        return combined;
    });
  }, [accounts, transactions, settings]);

  useEffect(() => {
      generateNotifications();
  }, [transactions, accounts, generateNotifications]);


  const hasPermission = (permission: Permission): boolean => {
      if (!currentUser) return false;
      return currentUser.permissions.includes(permission);
  };

  const saveToCloud = async (): Promise<boolean> => {
    if (!settings.remoteStorageUrl) return false;
    setIsSyncing(true);
    try {
        const data = { accounts, transactions, settings, users };
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
        const BACKUP_ID = 'pro_accounting_backup'; 

        if (direction === 'push') {
            const backupData = { accounts, transactions, settings, users };
            const { error } = await supabase
                .from('app_storage')
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

  useEffect(() => {
    if (settings.autoCloudSave) {
        const timer = setTimeout(() => {
            if(!isSyncing) {
                if (settings.supabaseUrl && settings.supabaseKey) {
                    syncWithSupabase('push').catch(e => console.error(e));
                } else if (settings.remoteStorageUrl) {
                    saveToCloud().catch(e => console.error(e));
                }
            }
        }, 5000); 
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

  const loadDemoData = () => {
    const demoAccounts = [...INITIAL_ACCOUNTS];
    const getAccId = (namePart: string) => demoAccounts.find(a => a.name.toLowerCase().includes(namePart.toLowerCase()))?.id || '';
    const bankId = getAccId('Bank');
    const equityId = getAccId('Owner\'s Equity');
    
    const transactions: Transaction[] = [];
    transactions.push({
        id: `demo-init-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        description: "Initial Owner Investment",
        lines: [
            { accountId: bankId, debit: 150000, credit: 0 },
            { accountId: equityId, debit: 0, credit: 150000 }
        ]
    });
    
    setAccounts(demoAccounts);
    setTransactions(transactions);
    setSettings({ ...INITIAL_SETTINGS, companyName: "ACC Demo", plan: 'pro' });
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
      setSettings({ ...INITIAL_SETTINGS, ...parsed.settings });
      setUsers(parsed.users || INITIAL_USERS);
      return true;
    } catch (e) {
      return false;
    }
  };

  const markNotificationRead = (id: string) => {
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <StoreContext.Provider value={{
      accounts,
      transactions,
      settings,
      users,
      currentUser,
      notifications,
      syncStatus,
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
      loadDemoData,
      saveToCloud,
      loadFromCloud,
      syncWithSupabase,
      isSyncing,
      hasPermission,
      markNotificationRead,
      generateNotifications,
      forceGoogleSheetSync: syncToGoogleSheet
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