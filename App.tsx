import React, { useState, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  PieChart, 
  Settings, 
  HelpCircle, 
  Save, 
  Menu, 
  X, 
  ChevronDown, 
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Users,
  Printer,
  Search,
  Download,
  Upload,
  Info
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { StoreProvider, useStore } from './context/Store';
import { Account, AccountType, Transaction, JournalEntryLine, AppSettings, User } from './types';
import { CURRENCIES, LANGUAGES, INITIAL_ACCOUNTS } from './constants';

// --- Helper Components ---

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string; action?: React.ReactNode }> = ({ title, children, className = "", action }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 ${className}`}>
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
      {action && <div>{action}</div>}
    </div>
    <div className="text-gray-600 dark:text-gray-300">
      {children}
    </div>
  </div>
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }> = ({ children, variant = 'primary', className = "", ...props }) => {
  const baseStyle = "px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = "", ...props }) => (
  <div className="mb-3">
    {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
    <input className={`w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white ${className}`} {...props} />
  </div>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, children, className = "", ...props }) => (
  <div className="mb-3">
    {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
    <select className={`w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white ${className}`} {...props}>
      {children}
    </select>
  </div>
);

const formatCurrency = (amount: number, settings: AppSettings) => {
  const formatted = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  return settings.showCurrencySign ? `${settings.currencySign} ${formatted}` : formatted;
};

// --- Logic Helpers ---

const getAccountBalance = (accountId: string, transactions: Transaction[], startDate?: string, endDate?: string) => {
  let balance = 0;
  transactions.forEach(t => {
    if (startDate && t.date < startDate) return;
    if (endDate && t.date > endDate) return;
    
    t.lines.forEach(line => {
      if (line.accountId === accountId) {
        // Simple Logic: Asset/Expense Debit +, Credit -. Liability/Equity/Income Credit +, Debit -
        // However, for storage we usually store generic value or normalized value.
        // Let's store raw Debit/Credit.
        // When reporting, we adjust sign based on account type.
        // Here we just return Net Debit (Debit - Credit)
        balance += (line.debit - line.credit);
      }
    });
  });
  return balance;
};

const getAccountTypeBalance = (transactions: Transaction[], accounts: Account[], type: AccountType, startDate?: string, endDate?: string) => {
  const typeAccountIds = accounts.filter(a => a.type === type).map(a => a.id);
  let total = 0;
  transactions.forEach(t => {
    if (startDate && t.date < startDate) return;
    if (endDate && t.date > endDate) return;

    t.lines.forEach(l => {
      if (typeAccountIds.includes(l.accountId)) {
         // Normal balances:
         if (type === AccountType.ASSET || type === AccountType.EXPENSE) {
           total += (l.debit - l.credit);
         } else {
           total += (l.credit - l.debit);
         }
      }
    });
  });
  return total;
};

// --- Pages ---

const Dashboard: React.FC = () => {
  const { accounts, transactions, settings, users } = useStore();

  const totalIncome = getAccountTypeBalance(transactions, accounts, AccountType.INCOME);
  const totalExpenses = getAccountTypeBalance(transactions, accounts, AccountType.EXPENSE);
  const netProfit = totalIncome - totalExpenses;
  const totalAssets = getAccountTypeBalance(transactions, accounts, AccountType.ASSET);

  const data = [
    { name: 'Income', value: totalIncome },
    { name: 'Expenses', value: totalExpenses },
  ];

  const COLORS = ['#10b981', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Total Income" className="border-l-4 border-green-500">
          <p className="text-2xl font-bold">{formatCurrency(totalIncome, settings)}</p>
        </Card>
        <Card title="Total Expenses" className="border-l-4 border-red-500">
          <p className="text-2xl font-bold">{formatCurrency(totalExpenses, settings)}</p>
        </Card>
        <Card title="Net Profit" className="border-l-4 border-blue-500">
           <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
             {formatCurrency(netProfit, settings)}
           </p>
        </Card>
        <Card title="Total Assets" className="border-l-4 border-purple-500">
          <p className="text-2xl font-bold">{formatCurrency(totalAssets, settings)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Income vs Expenses">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="name" />
                   <YAxis />
                   <RechartsTooltip formatter={(value: number) => formatCurrency(value, settings)} />
                   <Bar dataKey="value" fill="#8884d8">
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                   </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <div>
           <Card title="Users List">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                 {users.map(u => (
                   <div key={u.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700 rounded">
                      <div className="flex items-center gap-2">
                        <Users size={16} />
                        <div>
                          <p className="font-medium text-sm">{u.username}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{u.role}</p>
                        </div>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                   </div>
                 ))}
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};

const Transactions: React.FC = () => {
  const { accounts, transactions, addTransaction, updateTransaction, deleteTransaction, settings } = useStore();
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lines, setLines] = useState<JournalEntryLine[]>([
    { accountId: '', debit: 0, credit: 0 },
    { accountId: '', debit: 0, credit: 0 },
  ]);

  const handleLineChange = (index: number, field: keyof JournalEntryLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const addLine = () => setLines([...lines, { accountId: '', debit: 0, credit: 0 }]);
  const removeLine = (index: number) => setLines(lines.filter((_, i) => i !== index));

  const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit), 0);
  const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit), 0);

  const handleEdit = (t: Transaction) => {
    setEditingId(t.id);
    setDate(t.date);
    setDescription(t.description);
    // clone lines to avoid reference issues
    setLines(t.lines.map(l => ({ ...l })));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setLines([{ accountId: '', debit: 0, credit: 0 }, { accountId: '', debit: 0, credit: 0 }]);
  };

  const handleSubmit = () => {
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      alert('Debits must equal Credits!');
      return;
    }
    if (lines.some(l => !l.accountId)) {
      alert('Select an account for all lines');
      return;
    }
    if (!description) {
      alert('Description is required');
      return;
    }

    const transactionData: Transaction = {
      id: editingId || Date.now().toString(),
      date,
      description,
      lines: lines.map(l => ({ ...l, debit: Number(l.debit), credit: Number(l.credit) }))
    };

    if (editingId) {
      updateTransaction(transactionData);
    } else {
      addTransaction(transactionData);
    }
    
    // Reset
    cancelEdit();
  };
  
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      deleteTransaction(id);
      if (editingId === id) {
        cancelEdit(); // Reset form if deleting the one being edited
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card title={editingId ? "Edit Transaction" : "New Transaction"}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
           <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
           <Input label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Sold widget" />
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="grid grid-cols-12 gap-2 font-medium text-sm text-gray-500">
             <div className="col-span-5">Account</div>
             <div className="col-span-3">Debit</div>
             <div className="col-span-3">Credit</div>
             <div className="col-span-1"></div>
          </div>
          {lines.map((line, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
               <div className="col-span-5">
                 <Select value={line.accountId} onChange={e => handleLineChange(idx, 'accountId', e.target.value)}>
                    <option value="">Select Account</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                    ))}
                 </Select>
               </div>
               <div className="col-span-3">
                 <Input type="number" value={line.debit} onChange={e => handleLineChange(idx, 'debit', parseFloat(e.target.value))} min={0} step="0.01" />
               </div>
               <div className="col-span-3">
                 <Input type="number" value={line.credit} onChange={e => handleLineChange(idx, 'credit', parseFloat(e.target.value))} min={0} step="0.01" />
               </div>
               <div className="col-span-1 text-center">
                 {lines.length > 2 && (
                   <button onClick={() => removeLine(idx)} className="text-red-500 hover:text-red-700">
                     <Trash2 size={18} />
                   </button>
                 )}
               </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center border-t pt-4 dark:border-slate-700">
           <Button onClick={addLine} variant="secondary" className="flex items-center gap-2">
             <Plus size={16} /> Add Line
           </Button>
           <div className="text-right">
              <p className={`font-bold ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                Difference: {formatCurrency(Math.abs(totalDebit - totalCredit), settings)}
              </p>
              <div className="space-x-2 mt-2 flex justify-end">
                 {editingId && (
                    <Button onClick={cancelEdit} variant="secondary">Cancel</Button>
                 )}
                 <Button onClick={handleSubmit} disabled={Math.abs(totalDebit - totalCredit) > 0.01}>
                   {editingId ? 'Update' : 'Save'} Transaction
                 </Button>
              </div>
           </div>
        </div>
      </Card>

      <Card title="All Transactions">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
               {[...transactions].sort((a, b) => b.date.localeCompare(a.date)).map(t => (
                 <tr key={t.id}>
                   <td className="px-6 py-4 whitespace-nowrap text-sm">{t.date}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm">{t.description}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                     {formatCurrency(t.lines.reduce((s, l) => s + l.debit, 0), settings)}
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-right flex justify-end items-center space-x-2">
                      <button 
                        onClick={() => handleEdit(t)} 
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        title="Edit Transaction"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(t.id)} 
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title="Delete Transaction"
                      >
                        <Trash2 size={18} />
                      </button>
                   </td>
                 </tr>
               ))}
               {transactions.length === 0 && (
                 <tr>
                   <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No transactions yet</td>
                 </tr>
               )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const ChartOfAccounts: React.FC = () => {
  const { accounts, addAccount, deleteAccount, settings } = useStore();
  const [newAccount, setNewAccount] = useState<Partial<Account>>({ type: AccountType.ASSET, name: '', code: '' });

  const handleCreate = () => {
    if (!newAccount.name || !newAccount.code) return;
    addAccount({
      id: Date.now().toString(),
      name: newAccount.name,
      code: newAccount.code,
      type: newAccount.type as AccountType
    });
    setNewAccount({ type: AccountType.ASSET, name: '', code: '' });
  };

  return (
    <div className="space-y-6">
      <Card title="Add New Account">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <Input label="Code" value={newAccount.code} onChange={e => setNewAccount({...newAccount, code: e.target.value})} placeholder="e.g. 10500" />
            <Input label="Name" value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} placeholder="Account Name" />
            <Select label="Type" value={newAccount.type} onChange={e => setNewAccount({...newAccount, type: e.target.value as AccountType})}>
               {Object.values(AccountType).map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            <div className="mb-3">
               <Button onClick={handleCreate} className="w-full">Create Account</Button>
            </div>
         </div>
      </Card>

      <Card title="Chart of Accounts List">
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
               <thead className="bg-gray-50 dark:bg-slate-700">
                 <tr>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID/Code</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {accounts.sort((a,b) => a.code.localeCompare(b.code)).map(acc => (
                    <tr key={acc.id}>
                       <td className="px-6 py-4 text-sm">{acc.code}</td>
                       <td className="px-6 py-4 text-sm font-medium">{acc.name}</td>
                       <td className="px-6 py-4 text-sm">
                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                           ${acc.type === AccountType.ASSET ? 'bg-green-100 text-green-800' : 
                             acc.type === AccountType.LIABILITY ? 'bg-red-100 text-red-800' : 
                             acc.type === AccountType.EQUITY ? 'bg-blue-100 text-blue-800' :
                             acc.type === AccountType.INCOME ? 'bg-purple-100 text-purple-800' : 'bg-yellow-100 text-yellow-800'}`}>
                           {acc.type}
                         </span>
                       </td>
                       <td className="px-6 py-4 text-sm text-right">
                         <button onClick={() => deleteAccount(acc.id)} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </Card>
    </div>
  );
};

const ReportsLedger: React.FC = () => {
  const { accounts, transactions, settings } = useStore();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('all');

  const filteredTransactions = transactions.filter(t => {
     if (fromDate && t.date < fromDate) return false;
     if (toDate && t.date > toDate) return false;
     if (selectedAccount !== 'all' && !t.lines.some(l => l.accountId === selectedAccount)) return false;
     return true;
  });

  return (
     <div className="space-y-6">
        <Card title="Ledger & Activity">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Input label="From Date" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              <Input label="To Date" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
              <Select label="Account" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
                 <option value="all">All Accounts</option>
                 {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
              </Select>
           </div>
           
           <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
                 <thead>
                    <tr className="bg-gray-50 dark:bg-slate-700">
                       <th className="px-4 py-2 text-left">Date</th>
                       <th className="px-4 py-2 text-left">Description</th>
                       <th className="px-4 py-2 text-left">Account</th>
                       <th className="px-4 py-2 text-right">Debit</th>
                       <th className="px-4 py-2 text-right">Credit</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {filteredTransactions.map(t => (
                       <React.Fragment key={t.id}>
                          {t.lines.map((l, idx) => {
                             if (selectedAccount !== 'all' && l.accountId !== selectedAccount) return null;
                             const accName = accounts.find(a => a.id === l.accountId)?.name || 'Unknown';
                             return (
                                <tr key={`${t.id}-${idx}`}>
                                   <td className="px-4 py-2">{t.date}</td>
                                   <td className="px-4 py-2">{t.description}</td>
                                   <td className="px-4 py-2 font-medium">{accName}</td>
                                   <td className="px-4 py-2 text-right">{l.debit > 0 ? formatCurrency(l.debit, settings) : '-'}</td>
                                   <td className="px-4 py-2 text-right">{l.credit > 0 ? formatCurrency(l.credit, settings) : '-'}</td>
                                </tr>
                             );
                          })}
                       </React.Fragment>
                    ))}
                 </tbody>
              </table>
           </div>
        </Card>
     </div>
  );
};

const FinancialStatements: React.FC<{ type: 'balance' | 'income' | 'trial' }> = ({ type }) => {
  const { accounts, transactions, settings } = useStore();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

  const getBalance = (acc: Account) => {
    // Basic logic for Trial Balance vs others
    let debit = 0; 
    let credit = 0;
    transactions.forEach(t => {
      if (fromDate && t.date < fromDate) return;
      if (toDate && t.date > toDate) return;
      t.lines.forEach(l => {
        if (l.accountId === acc.id) {
          debit += l.debit;
          credit += l.credit;
        }
      });
    });
    return { debit, credit, net: debit - credit };
  };

  const renderTrialBalance = () => {
    let totalDebit = 0;
    let totalCredit = 0;
    return (
      <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-slate-700">
        <thead>
          <tr className="font-bold bg-gray-50 dark:bg-slate-700">
            <th className="px-4 py-2 text-left">Account</th>
            <th className="px-4 py-2 text-right">Debit</th>
            <th className="px-4 py-2 text-right">Credit</th>
          </tr>
        </thead>
        <tbody>
           {accounts.sort((a,b) => a.code.localeCompare(b.code)).map(acc => {
             const { debit, credit } = getBalance(acc);
             if (debit === 0 && credit === 0) return null;
             // Trial balance usually shows the NET balance in either Dr or Cr column
             // But raw trial balance shows totals. Let's do Net.
             const net = debit - credit;
             const showDebit = net > 0 ? net : 0;
             const showCredit = net < 0 ? Math.abs(net) : 0;
             totalDebit += showDebit;
             totalCredit += showCredit;
             return (
               <tr key={acc.id}>
                 <td className="px-4 py-2">{acc.code} - {acc.name}</td>
                 <td className="px-4 py-2 text-right">{showDebit ? formatCurrency(showDebit, settings) : '-'}</td>
                 <td className="px-4 py-2 text-right">{showCredit ? formatCurrency(showCredit, settings) : '-'}</td>
               </tr>
             )
           })}
           <tr className="font-bold border-t-2 border-gray-400">
             <td className="px-4 py-2">Total</td>
             <td className="px-4 py-2 text-right">{formatCurrency(totalDebit, settings)}</td>
             <td className="px-4 py-2 text-right">{formatCurrency(totalCredit, settings)}</td>
           </tr>
        </tbody>
      </table>
    );
  };

  const renderIncomeStatement = () => {
     const revenue = accounts.filter(a => a.type === AccountType.INCOME);
     const expense = accounts.filter(a => a.type === AccountType.EXPENSE);
     
     let totalRev = 0;
     let totalExp = 0;

     return (
       <div className="space-y-4">
         <div>
           <h4 className="font-bold text-lg mb-2 text-gray-700 dark:text-gray-200">Revenue</h4>
           {revenue.map(acc => {
             const { credit, debit } = getBalance(acc);
             const net = credit - debit; // Income is Credit normal
             if (net === 0) return null;
             totalRev += net;
             return (
               <div key={acc.id} className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-700">
                 <span>{acc.name}</span>
                 <span>{formatCurrency(net, settings)}</span>
               </div>
             )
           })}
           <div className="flex justify-between font-bold py-2 mt-2 bg-green-50 dark:bg-green-900/20 px-2 rounded">
             <span>Total Revenue</span>
             <span>{formatCurrency(totalRev, settings)}</span>
           </div>
         </div>

         <div>
           <h4 className="font-bold text-lg mb-2 text-gray-700 dark:text-gray-200">Expenses</h4>
           {expense.map(acc => {
             const { debit, credit } = getBalance(acc);
             const net = debit - credit; // Expense is Debit normal
             if (net === 0) return null;
             totalExp += net;
             return (
               <div key={acc.id} className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-700">
                 <span>{acc.name}</span>
                 <span>{formatCurrency(net, settings)}</span>
               </div>
             )
           })}
            <div className="flex justify-between font-bold py-2 mt-2 bg-red-50 dark:bg-red-900/20 px-2 rounded">
             <span>Total Expenses</span>
             <span>{formatCurrency(totalExp, settings)}</span>
           </div>
         </div>

         <div className="flex justify-between font-bold text-xl border-t-2 border-gray-300 pt-4">
            <span>Net Income</span>
            <span className={totalRev - totalExp >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatCurrency(totalRev - totalExp, settings)}
            </span>
         </div>
       </div>
     );
  };

  const renderBalanceSheet = () => {
    // Assets = Liabilities + Equity
    // Note: Equity must include Net Income from current period for it to balance
    const assets = accounts.filter(a => a.type === AccountType.ASSET);
    const liabilities = accounts.filter(a => a.type === AccountType.LIABILITY);
    const equity = accounts.filter(a => a.type === AccountType.EQUITY);

    // Calculate Net Income first
    const incomeAccs = accounts.filter(a => a.type === AccountType.INCOME);
    const expenseAccs = accounts.filter(a => a.type === AccountType.EXPENSE);
    let netIncome = 0;
    incomeAccs.forEach(a => { const b = getBalance(a); netIncome += (b.credit - b.debit); });
    expenseAccs.forEach(a => { const b = getBalance(a); netIncome -= (b.debit - b.credit); });

    let totalAssets = 0;
    let totalLiab = 0;
    let totalEquity = 0;

    return (
      <div className="space-y-6">
        <div>
           <h4 className="font-bold text-lg border-b mb-2">Assets</h4>
           {assets.map(a => {
             const b = getBalance(a);
             const val = b.debit - b.credit;
             if (val === 0) return null;
             totalAssets += val;
             return <div key={a.id} className="flex justify-between py-1 text-sm"><span>{a.name}</span><span>{formatCurrency(val, settings)}</span></div>
           })}
           <div className="flex justify-between font-bold bg-gray-100 dark:bg-slate-700 p-2 mt-1"><span>Total Assets</span><span>{formatCurrency(totalAssets, settings)}</span></div>
        </div>

        <div>
           <h4 className="font-bold text-lg border-b mb-2">Liabilities</h4>
           {liabilities.map(a => {
             const b = getBalance(a);
             const val = b.credit - b.debit;
             if (val === 0) return null;
             totalLiab += val;
             return <div key={a.id} className="flex justify-between py-1 text-sm"><span>{a.name}</span><span>{formatCurrency(val, settings)}</span></div>
           })}
           <div className="flex justify-between font-bold bg-gray-100 dark:bg-slate-700 p-2 mt-1"><span>Total Liabilities</span><span>{formatCurrency(totalLiab, settings)}</span></div>
        </div>

        <div>
           <h4 className="font-bold text-lg border-b mb-2">Equity</h4>
           {equity.map(a => {
             const b = getBalance(a);
             const val = b.credit - b.debit;
             if (val === 0) return null;
             totalEquity += val;
             return <div key={a.id} className="flex justify-between py-1 text-sm"><span>{a.name}</span><span>{formatCurrency(val, settings)}</span></div>
           })}
           <div className="flex justify-between py-1 text-sm"><span>Retained Earnings (Net Income)</span><span>{formatCurrency(netIncome, settings)}</span></div>
           <div className="flex justify-between font-bold bg-gray-100 dark:bg-slate-700 p-2 mt-1"><span>Total Equity</span><span>{formatCurrency(totalEquity + netIncome, settings)}</span></div>
        </div>
        
        <div className="flex justify-between font-bold text-lg border-t-2 border-black dark:border-white pt-2">
           <span>Total Liab + Equity</span>
           <span>{formatCurrency(totalLiab + totalEquity + netIncome, settings)}</span>
        </div>
      </div>
    );
  };

  const titles = {
    balance: 'Balance Sheet',
    income: 'Income Statement (P&L)',
    trial: 'Trial Balance'
  };

  return (
    <Card title={titles[type]} action={<button className="p-2 hover:bg-gray-100 rounded" onClick={() => window.print()}><Printer size={20}/></button>}>
       <div className="flex gap-4 mb-6 no-print">
          <Input label="From" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <Input label="To" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
       </div>
       <div className="print-section p-4 border border-gray-100 rounded">
         <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">{settings.companyName}</h2>
            <h3 className="text-xl">{titles[type]}</h3>
            <p className="text-sm text-gray-500">For the period ending {toDate}</p>
         </div>
         {type === 'trial' && renderTrialBalance()}
         {type === 'income' && renderIncomeStatement()}
         {type === 'balance' && renderBalanceSheet()}
       </div>
    </Card>
  );
};

const CashFlowStatement: React.FC = () => {
    const { accounts, transactions, settings } = useStore();
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    const getPreviousDay = (dateString: string): string | undefined => {
        if (!dateString) return undefined;
        const date = new Date(dateString);
        date.setDate(date.getDate()); // Adjust for timezone to get the start of the day
        date.setDate(date.getDate() - 1);
        return date.toISOString().split('T')[0];
    };

    const getNetBalance = (acc: Account, transactions: Transaction[], endDate?: string): number => {
        let balance = 0;
        const filtered = transactions.filter(t => !endDate || t.date <= endDate);
        filtered.forEach(t => {
            t.lines.forEach(line => {
                if (line.accountId === acc.id) {
                    balance += line.debit - line.credit;
                }
            });
        });

        if ([AccountType.LIABILITY, AccountType.EQUITY, AccountType.INCOME].includes(acc.type)) {
            return -balance;
        }
        return balance;
    };
    
    const cashFlowData = useMemo(() => {
        const periodTransactions = transactions.filter(t => (!fromDate || t.date >= fromDate) && (!toDate || t.date <= toDate));
        const beginningPeriodDate = getPreviousDay(fromDate);

        // --- Operating Activities ---
        let netIncome = 0;
        let totalRev = getAccountTypeBalance(periodTransactions, accounts, AccountType.INCOME);
        let totalExp = getAccountTypeBalance(periodTransactions, accounts, AccountType.EXPENSE);
        netIncome = totalRev - totalExp;

        const workingCapitalAccounts = accounts.filter(a => ['Accounts Receivable', 'Inventory', 'Accounts Payable', 'Sales Tax Payable'].includes(a.name));
        const wcChanges = workingCapitalAccounts.map(acc => {
            const startBalance = getNetBalance(acc, transactions, beginningPeriodDate);
            const endBalance = getNetBalance(acc, transactions, toDate);
            const change = endBalance - startBalance;
            const cashEffect = acc.type === AccountType.ASSET ? -change : change;
            return { name: `Change in ${acc.name}`, amount: cashEffect };
        });

        const totalWcChange = wcChanges.reduce((sum, item) => sum + item.amount, 0);
        const cashFromOps = netIncome + totalWcChange;

        // --- Investing Activities ---
        const investingAccounts = accounts.filter(a => a.type === AccountType.ASSET && !['Cash', 'Bank', 'Accounts Receivable', 'Inventory'].includes(a.name));
        let cashFromInv = 0;
        investingAccounts.forEach(acc => {
            periodTransactions.forEach(t => {
                t.lines.forEach(l => {
                    if (l.accountId === acc.id) {
                        cashFromInv += l.credit - l.debit;
                    }
                });
            });
        });
        
        // --- Financing Activities ---
        const financingAccounts = accounts.filter(a => a.type === AccountType.EQUITY);
        let cashFromFin = 0;
        financingAccounts.forEach(acc => {
            periodTransactions.forEach(t => {
                t.lines.forEach(l => {
                    if (l.accountId === acc.id) {
                        cashFromFin += l.credit - l.debit;
                    }
                });
            });
        });

        // --- Reconciliation ---
        const cashAccounts = accounts.filter(a => ['Cash', 'Bank'].includes(a.name));
        const beginningCash = cashAccounts.reduce((sum, acc) => sum + getNetBalance(acc, transactions, beginningPeriodDate), 0);
        const endingCash = cashAccounts.reduce((sum, acc) => sum + getNetBalance(acc, transactions, toDate), 0);
        const netCashFlow = cashFromOps + cashFromInv + cashFromFin;

        return {
            netIncome,
            wcChanges,
            cashFromOps,
            cashFromInv,
            investingAccounts,
            cashFromFin,
            financingAccounts,
            netCashFlow,
            beginningCash,
            endingCash,
        };

    }, [accounts, transactions, fromDate, toDate]);

    return (
        <Card title="Cash Flow Statement" action={<button className="p-2 hover:bg-gray-100 rounded" onClick={() => window.print()}><Printer size={20}/></button>}>
            <div className="flex gap-4 mb-6 no-print">
                <Input label="From" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                <Input label="To" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            <div className="print-section p-4 border border-gray-100 rounded">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold">{settings.companyName}</h2>
                    <h3 className="text-xl">Cash Flow Statement</h3>
                    <p className="text-sm text-gray-500">For the period ending {toDate}</p>
                </div>
                
                <div className="space-y-4 text-sm">
                    {/* Operating */}
                    <div>
                        <h4 className="font-bold text-base bg-gray-50 dark:bg-slate-700 p-2 rounded">Cash Flow from Operating Activities</h4>
                        <div className="flex justify-between py-1 px-2"><span>Net Income</span><span>{formatCurrency(cashFlowData.netIncome, settings)}</span></div>
                        <p className="px-2 pt-2 text-xs text-gray-500">Adjustments to reconcile net income:</p>
                        {cashFlowData.wcChanges.map(item => (
                            <div key={item.name} className="flex justify-between py-1 px-2"><span>{item.name}</span><span>{formatCurrency(item.amount, settings)}</span></div>
                        ))}
                        <div className="flex justify-between font-bold border-t mt-1 pt-1 px-2"><span>Net cash from operating activities</span><span>{formatCurrency(cashFlowData.cashFromOps, settings)}</span></div>
                    </div>
                    {/* Investing */}
                    <div>
                        <h4 className="font-bold text-base bg-gray-50 dark:bg-slate-700 p-2 rounded">Cash Flow from Investing Activities</h4>
                        {cashFlowData.investingAccounts.length === 0 && <p className="px-2 py-1 text-gray-500">No investing activities for the period.</p>}
                        {/* You would list individual transactions here in a real app */}
                        <div className="flex justify-between font-bold border-t mt-1 pt-1 px-2"><span>Net cash from investing activities</span><span>{formatCurrency(cashFlowData.cashFromInv, settings)}</span></div>
                    </div>
                     {/* Financing */}
                    <div>
                        <h4 className="font-bold text-base bg-gray-50 dark:bg-slate-700 p-2 rounded">Cash Flow from Financing Activities</h4>
                        {cashFlowData.financingAccounts.length === 0 && <p className="px-2 py-1 text-gray-500">No financing activities for the period.</p>}
                        {/* You would list individual transactions here in a real app */}
                        <div className="flex justify-between font-bold border-t mt-1 pt-1 px-2"><span>Net cash from financing activities</span><span>{formatCurrency(cashFlowData.cashFromFin, settings)}</span></div>
                    </div>

                     {/* Summary */}
                    <div className="pt-4">
                        <div className="flex justify-between font-bold text-base bg-blue-50 dark:bg-blue-900/30 p-2 rounded"><span>Net Increase/Decrease in Cash</span><span>{formatCurrency(cashFlowData.netCashFlow, settings)}</span></div>
                        <div className="flex justify-between py-1 px-2 mt-2"><span>Cash at beginning of period</span><span>{formatCurrency(cashFlowData.beginningCash, settings)}</span></div>
                        <div className="flex justify-between font-bold border-t mt-1 pt-1 px-2 text-base"><span>Cash at end of period</span><span>{formatCurrency(cashFlowData.endingCash, settings)}</span></div>
                    </div>

                </div>
            </div>
        </Card>
    );
};

const RatioAnalysis: React.FC = () => {
    const { accounts, transactions, settings } = useStore();
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    const ratioData = useMemo(() => {
        const periodTransactions = transactions.filter(t => (!fromDate || t.date >= fromDate) && (!toDate || t.date <= toDate));
        
        const getBalanceByType = (type: AccountType) => getAccountTypeBalance(periodTransactions, accounts, type);
        const getBalanceByName = (name: string) => {
          const account = accounts.find(a => a.name === name);
          if (!account) return 0;
          let balance = 0;
          periodTransactions.forEach(t => {
            t.lines.forEach(l => {
              if (l.accountId === account.id) {
                if(account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
                  balance += l.debit - l.credit;
                } else {
                  balance += l.credit - l.debit;
                }
              }
            })
          });
          return balance;
        };

        const currentAssets = getBalanceByName('Cash') + getBalanceByName('Bank') + getBalanceByName('Accounts Receivable') + getBalanceByName('Inventory');
        const currentLiabilities = getBalanceByName('Accounts Payable') + getBalanceByName('Sales Tax Payable');
        const inventory = getBalanceByName('Inventory');
        const totalAssets = getBalanceByType(AccountType.ASSET);
        const totalLiabilities = getBalanceByType(AccountType.LIABILITY);
        const totalEquity = totalAssets - totalLiabilities;
        const revenue = getBalanceByType(AccountType.INCOME);
        const cogs = getBalanceByName('Cost of Goods Sold');
        const expenses = getBalanceByType(AccountType.EXPENSE);
        const netIncome = revenue - expenses;

        // Ratios
        const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : Infinity;
        const quickRatio = currentLiabilities > 0 ? (currentAssets - inventory) / currentLiabilities : Infinity;
        const grossProfitMargin = revenue > 0 ? (revenue - cogs) / revenue : 0;
        const netProfitMargin = revenue > 0 ? netIncome / revenue : 0;
        const returnOnAssets = totalAssets > 0 ? netIncome / totalAssets : 0;
        const debtToAssets = totalAssets > 0 ? totalLiabilities / totalAssets : 0;
        const debtToEquity = totalEquity > 0 ? totalLiabilities / totalEquity : Infinity;
        const assetTurnover = totalAssets > 0 ? revenue / totalAssets : 0;
        const inventoryTurnover = inventory > 0 ? cogs / inventory : 0;

        return {
            currentRatio, quickRatio, grossProfitMargin, netProfitMargin, returnOnAssets, debtToAssets, debtToEquity, assetTurnover, inventoryTurnover
        };
    }, [accounts, transactions, fromDate, toDate]);

    const RatioItem: React.FC<{ title: string; value: number; explanation: string; format?: 'percent' | 'decimal' }> = ({ title, value, explanation, format = 'decimal' }) => (
        <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-slate-700">
            <div>
                <h5 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    {title}
                    <div className="relative group">
                       <Info size={14} className="text-gray-400" />
                       <div className="absolute bottom-full mb-2 w-64 bg-slate-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                          {explanation}
                       </div>
                    </div>
                </h5>
            </div>
            <p className="font-mono text-lg text-blue-600 dark:text-blue-400">
                {isFinite(value) ? 
                  (format === 'percent' ? `${(value * 100).toFixed(2)}%` : value.toFixed(2))
                  : 'N/A'
                }
            </p>
        </div>
    );

    return (
        <div className="space-y-6">
            <Card title="Ratio Analysis">
                <div className="flex gap-4 mb-6 no-print">
                    <Input label="From" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                    <Input label="To" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                </div>
                <p className="text-sm text-gray-500 mb-6">Key financial ratios for the selected period.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold border-b pb-2">Liquidity Ratios</h4>
                        <RatioItem title="Current Ratio" value={ratioData.currentRatio} explanation="Measures ability to pay short-term obligations (higher is better). Formula: Current Assets / Current Liabilities" />
                        <RatioItem title="Quick Ratio" value={ratioData.quickRatio} explanation="A stricter liquidity test (higher is better). Formula: (Current Assets - Inventory) / Current Liabilities" />
                        
                        <h4 className="text-lg font-semibold border-b pb-2 pt-4">Solvency Ratios</h4>
                        <RatioItem title="Debt-to-Assets Ratio" value={ratioData.debtToAssets} format="percent" explanation="Proportion of assets financed by debt (lower is better). Formula: Total Liabilities / Total Assets" />
                        <RatioItem title="Debt-to-Equity Ratio" value={ratioData.debtToEquity} explanation="Compares creditor financing to owner financing (lower is better). Formula: Total Liabilities / Total Equity" />

                    </div>
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold border-b pb-2">Profitability Ratios</h4>
                        <RatioItem title="Gross Profit Margin" value={ratioData.grossProfitMargin} format="percent" explanation="Profit made on each sale, before other expenses (higher is better). Formula: (Revenue - COGS) / Revenue" />
                        <RatioItem title="Net Profit Margin" value={ratioData.netProfitMargin} format="percent" explanation="Overall profitability after all expenses (higher is better). Formula: Net Income / Revenue" />
                        <RatioItem title="Return on Assets (ROA)" value={ratioData.returnOnAssets} format="percent" explanation="How efficiently assets generate profit (higher is better). Formula: Net Income / Total Assets" />

                        <h4 className="text-lg font-semibold border-b pb-2 pt-4">Efficiency Ratios</h4>
                        <RatioItem title="Asset Turnover" value={ratioData.assetTurnover} explanation="How efficiently assets generate sales (higher is better). Formula: Revenue / Total Assets" />
                        <RatioItem title="Inventory Turnover" value={ratioData.inventoryTurnover} explanation="How many times inventory is sold over a period (higher is better). Formula: COGS / Inventory" />

                    </div>
                </div>
            </Card>
        </div>
    );
};


const SettingsPage: React.FC = () => {
  const { settings, updateSettings, users, addUser, deleteUser, resetData, transactions, accounts } = useStore();
  const [newUser, setNewUser] = useState<Partial<User>>({ username: '', email: '', role: 'admin' });

  const handleAddUser = () => {
    if (newUser.username && newUser.email) {
      addUser({ id: Date.now().toString(), username: newUser.username, email: newUser.email, role: 'admin' } as User);
      setNewUser({ username: '', email: '', role: 'admin' });
    }
  };

  const handleBackup = () => {
    const data = JSON.stringify({ accounts, transactions, settings, users });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-8">
      <Card title="Company Profile & Preferences">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Company Name" value={settings.companyName} onChange={e => updateSettings({...settings, companyName: e.target.value})} />
            <Input label="Tax Rate (%)" type="number" value={settings.taxRate} onChange={e => updateSettings({...settings, taxRate: parseFloat(e.target.value)})} />
            <Select label="Language" value={settings.language} onChange={e => updateSettings({...settings, language: e.target.value})}>
               {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </Select>
            <Select label="Currency" value={settings.currency} onChange={e => {
               const curr = CURRENCIES.find(c => c.code === e.target.value);
               updateSettings({...settings, currency: e.target.value, currencySign: curr?.sign || '$'});
            }}>
               {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.sign})</option>)}
            </Select>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={settings.showCurrencySign} onChange={e => updateSettings({...settings, showCurrencySign: e.target.checked})} className="h-4 w-4" />
              <label>Show Currency Sign</label>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={settings.theme === 'dark'} onChange={e => updateSettings({...settings, theme: e.target.checked ? 'dark' : 'light'})} className="h-4 w-4" />
              <label>Dark Mode</label>
            </div>
         </div>
      </Card>

      <Card title="Admin Panel - Users">
        <div className="flex gap-2 mb-4 items-end">
           <Input label="Username" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
           <Input label="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
           <div className="mb-3">
             <Button onClick={handleAddUser}>Add User</Button>
           </div>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-slate-700">
           {users.map(u => (
             <li key={u.id} className="py-2 flex justify-between items-center">
               <span>{u.username} ({u.email})</span>
               {u.username !== 'admin' && <button onClick={() => deleteUser(u.id)} className="text-red-500"><Trash2 size={16}/></button>}
             </li>
           ))}
        </ul>
      </Card>

      <Card title="Backup & Reset">
         <div className="flex gap-4">
            <Button onClick={handleBackup} className="flex items-center gap-2"><Download size={16} /> Download Backup</Button>
            <Button onClick={() => { if(confirm('Are you sure? This will clear all data.')) resetData(); }} variant="danger">Reset All Data</Button>
         </div>
      </Card>

       <Card title="Contact & Help">
          <div className="space-y-2">
            <p><strong>Contact Us:</strong> support@proaccounting.com</p>
            <p><strong>WhatsApp:</strong> +923026834300</p>
          </div>
       </Card>
    </div>
  );
};

// --- Layout & Navigation ---

const SidebarItem: React.FC<{ icon: any; label: string; to?: string; children?: React.ReactNode; isOpen?: boolean; onClick?: () => void }> = ({ icon: Icon, label, to, children, isOpen, onClick }) => {
  const location = useLocation();
  const active = to && location.pathname === to;
  
  return (
    <div className="mb-1">
      {to ? (
        <Link to={to} className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${active ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'}`}>
           <Icon size={18} className="mr-3" />
           {label}
        </Link>
      ) : (
        <button onClick={onClick} className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700 rounded-md">
           <div className="flex items-center">
             <Icon size={18} className="mr-3" />
             {label}
           </div>
           {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      )}
      {isOpen && children && (
        <div className="ml-8 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-slate-700 pl-2">
           {children}
        </div>
      )}
    </div>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ accounts: true, financial: false, reports: false, settings: false });
  const { settings } = useStore();

  const toggleMenu = (menu: string) => setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 flex flex-col transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm z-10">
        <div className="flex items-center justify-between px-4 py-3">
           <div className="flex items-center">
             <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 lg:hidden">
                <Menu size={24} className="text-gray-600 dark:text-gray-200" />
             </button>
             <div className="ml-4 flex items-center gap-2">
                <div className="bg-blue-600 text-white p-2 rounded-lg"><FileText size={20} /></div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white hidden sm:block">Pro Accounting <span className="text-xs font-normal text-gray-500">v1.2.0</span></h1>
             </div>
           </div>
           <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{settings.companyName}</span>
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">A</div>
           </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed lg:relative lg:translate-x-0 z-20 w-64 h-full bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transition-transform duration-300 ease-in-out overflow-y-auto pb-20`}>
           <div className="p-4 space-y-1">
              <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" />
              
              <SidebarItem icon={BookOpen} label="Accounts" isOpen={openMenus.accounts} onClick={() => toggleMenu('accounts')}>
                 <SidebarItem icon={FileText} label="Chart of Accounts" to="/accounts/chart" />
                 <SidebarItem icon={Plus} label="Transactions" to="/accounts/transactions" />
                 <SidebarItem icon={Search} label="Ledger" to="/accounts/ledger" />
                 <SidebarItem icon={FileText} label="Trial Balance" to="/financial/trial-balance" />
              </SidebarItem>

              <SidebarItem icon={PieChart} label="Financial Statements" isOpen={openMenus.financial} onClick={() => toggleMenu('financial')}>
                 <SidebarItem icon={FileText} label="Balance Sheet" to="/financial/balance-sheet" />
                 <SidebarItem icon={FileText} label="Income Statement" to="/financial/income-statement" />
                 <SidebarItem icon={FileText} label="Cash Flow Statement" to="/financial/cash-flow" />
                 <SidebarItem icon={FileText} label="Ratio Analysis" to="/financial/ratio-analysis" />
              </SidebarItem>

              <SidebarItem icon={Settings} label="Settings" isOpen={openMenus.settings} onClick={() => toggleMenu('settings')}>
                 <SidebarItem icon={Settings} label="Admin & App" to="/settings" />
              </SidebarItem>
              
              <SidebarItem icon={HelpCircle} label="Help" to="/settings" />
           </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-20">
           {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 py-3 px-6 text-center text-sm text-gray-500 dark:text-gray-400 fixed bottom-0 w-full z-30">
        Developed by asifanwar.online | For quick response WhatsApp: +923026834300
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/accounts/chart" element={<ChartOfAccounts />} />
            <Route path="/accounts/transactions" element={<Transactions />} />
            <Route path="/accounts/ledger" element={<ReportsLedger />} />
            <Route path="/financial/trial-balance" element={<FinancialStatements type="trial" />} />
            <Route path="/financial/balance-sheet" element={<FinancialStatements type="balance" />} />
            <Route path="/financial/income-statement" element={<FinancialStatements type="income" />} />
            <Route path="/financial/cash-flow" element={<CashFlowStatement />} />
            <Route path="/financial/ratio-analysis" element={<RatioAnalysis />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </StoreProvider>
  );
};

export default App;