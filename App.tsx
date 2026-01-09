import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Info, 
  LogIn, 
  LogOut, 
  ClipboardList, 
  MoreHorizontal, 
  ArrowRight, 
  Wallet, 
  TrendingUp, 
  CreditCard, 
  AlertCircle 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  RadialBarChart, 
  RadialBar 
} from 'recharts';
import { StoreProvider, useStore } from './context/Store';
import { Account, AccountType, Transaction, JournalEntryLine, AppSettings, User, BackupData } from './types';
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

const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Hold splash screen for 2 seconds, then fade out
    const timer1 = setTimeout(() => setFading(true), 2000);
    // Unmount after fade transition (duration-700 = 700ms)
    const timer2 = setTimeout(onFinish, 2700);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950 transition-opacity duration-700 ease-in-out ${fading ? 'opacity-0' : 'opacity-100'}`}>
      <div className="flex flex-col items-center scale-100 transition-transform duration-700">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-[22px] flex items-center justify-center shadow-2xl mb-8 transform hover:scale-105 transition-transform">
           <FileText size={48} className="text-white drop-shadow-md" />
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight mb-2 font-sans">Pro Accounting</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg font-light tracking-wide">Professional. Simple. Secure.</p>
      </div>
      <div className="absolute bottom-12 flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        <span className="text-slate-400 text-xs mt-4 tracking-widest uppercase">v1.2.0</span>
      </div>
    </div>
  );
};

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

  // --- Statistics Calculation ---
  const totalIncome = getAccountTypeBalance(transactions, accounts, AccountType.INCOME);
  const totalExpenses = getAccountTypeBalance(transactions, accounts, AccountType.EXPENSE);
  const netProfit = totalIncome - totalExpenses;
  const grossProfitMargin = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  
  // Outstanding Invoices (Accounts Receivable)
  const arAccount = accounts.find(a => a.name === 'Accounts Receivable');
  let outstandingBalance = 0;
  if (arAccount) {
     transactions.forEach(t => {
       t.lines.forEach(l => {
         if (l.accountId === arAccount.id) outstandingBalance += (l.debit - l.credit);
       })
     });
  }

  // --- Chart Data Preparation ---
  // Last 7 days data
  const getLast7Days = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const last7Days = getLast7Days();
  const cashFlowData = last7Days.map(date => {
    let income = 0;
    let expense = 0;
    transactions.filter(t => t.date === date).forEach(t => {
       t.lines.forEach(l => {
          const acc = accounts.find(a => a.id === l.accountId);
          if (acc?.type === AccountType.INCOME) income += (l.credit - l.debit); // Income is credit normal
          if (acc?.type === AccountType.EXPENSE) expense += (l.debit - l.credit);
       });
    });
    // Visual tweak: if data is empty, mock small values for UI demo if needed, 
    // but here we render actuals. If actuals are 0, bars are 0.
    return { date: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }), income: income || 0, expense: expense || 0 };
  });

  // Recent Transactions (Mocking as "Invoices")
  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4)
    .map(t => {
        // Mock status based on arbitrary logic for UI demo
        const status = t.lines.reduce((acc, l) => acc + l.credit, 0) > 1000 ? 'Completed' : 'Upcoming';
        return { ...t, status };
    });

  // Expense Categories for Radial Chart
  const expenseData = accounts
    .filter(a => a.type === AccountType.EXPENSE)
    .map(acc => {
       const val = getAccountBalance(acc.id, transactions);
       return { name: acc.name, value: val, fill: '#8884d8' };
    })
    .filter(d => d.value > 0)
    .sort((a,b) => b.value - a.value)
    .slice(0, 4);

  // Assign specific colors for the UI match
  const EXPENSE_COLORS = ['#FFBB28', '#FF8042', '#00C49F', '#0088FE'];
  expenseData.forEach((d, i) => d.fill = EXPENSE_COLORS[i % EXPENSE_COLORS.length]);
  // Add a "total" placeholder for the gauge background if needed, or rely on RadialBar default

  // Taxable Profit Trend (Area Chart) - Monthly approximation
  // Mocking curve data based on daily accumulation for smoother visual
  const profitTrendData = cashFlowData.map(d => ({
    name: d.date,
    profit: d.income - d.expense,
    income: d.income
  }));


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-gray-800 dark:text-gray-100 font-sans">
      
      {/* --- Left Column (Span 2) --- */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Cash Flow Card */}
        <div className="bg-[#1E1B39] text-white rounded-[32px] p-8 relative overflow-hidden shadow-xl">
           <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-300 mb-1">Cash Flow</h3>
                <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-orange-400"></div>
                   <span className="text-xs text-gray-400">Income</span>
                </div>
                <h2 className="text-4xl font-bold mt-2">{formatCurrency(totalIncome, settings)}</h2>
              </div>
              <div className="text-right">
                 <span className="bg-white/10 px-4 py-2 rounded-full text-sm font-medium">This week</span>
              </div>
           </div>

           <div className="h-48 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={cashFlowData} barGap={8}>
                    <RechartsTooltip cursor={{fill: 'transparent'}} content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                        return (
                            <div className="bg-slate-800 text-white text-xs p-2 rounded border border-slate-700">
                                <p>{`${payload[0].payload.date}`}</p>
                                <p className="text-orange-400">{`Income: ${payload[0].value}`}</p>
                                <p className="text-slate-400">{`Exp: ${payload[1].value}`}</p>
                            </div>
                        );
                        }
                        return null;
                    }} />
                    <Bar dataKey="expense" fill="#4B4769" radius={[6, 6, 6, 6]} barSize={24} />
                    <Bar dataKey="income" fill="#FBA94B" radius={[6, 6, 6, 6]} barSize={24} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Small KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Gross Profit Margin */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm flex flex-col justify-between h-40 relative">
              <div className="flex justify-between items-start">
                 <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Gross Profit Margin</span>
                 <div className="bg-gray-100 dark:bg-slate-700 p-2 rounded-full">
                    <PieChart size={20} className="text-gray-600 dark:text-gray-300" />
                 </div>
              </div>
              <div>
                 <h2 className="text-4xl font-bold text-gray-900 dark:text-white">%{grossProfitMargin.toFixed(0)}</h2>
              </div>
           </div>

           {/* Outstanding Invoices */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                 <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Outstanding Invoices</span>
                 <div className="bg-gray-100 dark:bg-slate-700 p-2 rounded-full">
                    <AlertCircle size={20} className="text-gray-600 dark:text-gray-300" />
                 </div>
              </div>
              <div>
                 <h2 className="text-4xl font-bold text-gray-900 dark:text-white">{formatCurrency(outstandingBalance, settings)}</h2>
              </div>
           </div>
        </div>

        {/* Invoice / Transaction List */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] shadow-sm">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Transactions</h3>
              <Link to="/accounts/transactions">
                <button className="bg-[#1E1B39] hover:bg-[#2d2955] text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors">
                    Create Transaction
                </button>
              </Link>
           </div>
           
           <div className="space-y-4">
              {recentTransactions.map((t, idx) => (
                  <div key={t.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-750 rounded-2xl transition-colors group">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-gray-500">
                             <FileText size={20} />
                          </div>
                          <div>
                              <p className="font-bold text-gray-900 dark:text-white text-sm">#{t.id.slice(-6).toUpperCase()}</p>
                              <p className="text-xs text-gray-500">{t.description}</p>
                          </div>
                      </div>
                      
                      <div className="hidden sm:block">
                          <span className={`px-4 py-2 rounded-full text-xs font-bold 
                            ${t.status === 'Completed' ? 'bg-cyan-100 text-cyan-600' : 
                              t.status === 'Upcoming' ? 'bg-orange-100 text-orange-500' : 'bg-red-100 text-red-500'}`}>
                              {t.status || 'Completed'}
                          </span>
                      </div>

                      <div className="text-right">
                          <p className="font-bold text-sm text-gray-900 dark:text-white">{t.date}</p>
                      </div>

                      <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400">
                          <ArrowRight size={18} />
                      </button>
                  </div>
              ))}
              {recentTransactions.length === 0 && <p className="text-center text-gray-500 py-4">No transactions found.</p>}
           </div>
        </div>

      </div>

      {/* --- Right Column (Span 1) --- */}
      <div className="space-y-8">
         
         {/* Expenses Radial Chart */}
         <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] shadow-sm h-80 flex flex-col">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold">Expenses</h3>
               <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={24}/></button>
            </div>
            
            <div className="flex-1 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                        cx="50%" 
                        cy="50%" 
                        innerRadius="60%" 
                        outerRadius="100%" 
                        barSize={15} 
                        data={expenseData} 
                        startAngle={180} 
                        endAngle={0}
                    >
                        <RadialBar
                            background
                            dataKey="value"
                            cornerRadius={10}
                        />
                    </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                    <span className="text-xs text-gray-500 bg-orange-100 text-orange-600 px-2 py-1 rounded-full mb-1">Total</span>
                    <span className="text-3xl font-bold">{formatCurrency(totalExpenses, settings)}</span>
                    <span className="text-xs text-gray-400">All Total</span>
                </div>
            </div>
            {/* Legend Mockup */}
            <div className="flex justify-center gap-2 mt-2">
                {expenseData.slice(0, 3).map((e, i) => (
                    <div key={e.name} className="h-2 w-8 rounded-full" style={{backgroundColor: e.fill}}></div>
                ))}
            </div>
         </div>

         {/* Taxable Profit Area Chart */}
         <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-6">
               <div>
                  <div className="bg-orange-400 w-fit px-3 py-1 rounded-full text-white text-xs font-bold mb-2">
                      June
                  </div>
                  <span className="text-gray-500 text-xs font-medium">Taxable Profit</span>
                  <h2 className="text-3xl font-bold mt-1">{formatCurrency(netProfit, settings)}</h2>
               </div>
               <div className="bg-[#1E1B39] p-2 rounded-full text-white">
                  <TrendingUp size={20} />
               </div>
            </div>

            <div className="h-40 mb-6">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={profitTrendData}>
                     <defs>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#1E1B39" stopOpacity={0.8}/>
                           <stop offset="95%" stopColor="#1E1B39" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#FBA94B" stopOpacity={0.8}/>
                           <stop offset="95%" stopColor="#FBA94B" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <Area type="monotone" dataKey="income" stroke="#FBA94B" fillOpacity={1} fill="url(#colorIncome)" />
                     <Area type="monotone" dataKey="profit" stroke="#1E1B39" fillOpacity={1} fill="url(#colorProfit)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>

            {/* Week Days Tabs Mockup */}
            <div className="flex justify-between text-xs text-gray-400 mb-6">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <span key={i} className={`w-8 h-8 flex items-center justify-center rounded-full ${i === 4 ? 'bg-[#1E1B39] text-white' : ''}`}>{d}</span>
                ))}
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl">
                    <span className="text-gray-500 text-sm font-medium">Total Income</span>
                    <span className="text-gray-900 dark:text-white font-bold">{formatCurrency(totalIncome, settings)}</span>
                </div>
                <div className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl">
                    <span className="text-gray-500 text-sm font-medium">Total Outcome</span>
                    <span className="text-gray-900 dark:text-white font-bold">{formatCurrency(totalExpenses, settings)}</span>
                </div>
            </div>
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
      <Card title={editingId ? "Edit Transaction" : "New Transaction"} className="no-print">
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

      <Card title="All Transactions" action={<button className="p-2 hover:bg-gray-100 rounded" onClick={() => window.print()}><Printer size={20}/></button>}>
        <div className="print-section p-4 border border-gray-100 rounded">
            <div className="text-center mb-6 hidden print:block">
                <h2 className="text-2xl font-bold">{settings.companyName}</h2>
                <h3 className="text-xl">Transaction Register</h3>
                <p className="text-sm text-gray-500">As of {new Date().toLocaleDateString()}</p>
            </div>
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead>
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider no-print">Actions</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right flex justify-end items-center space-x-2 no-print">
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
        <Card title="Ledger & Activity" action={<button className="p-2 hover:bg-gray-100 rounded" onClick={() => window.print()}><Printer size={20}/></button>}>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 no-print">
              <Input label="From Date" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              <Input label="To Date" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
              <Select label="Account" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
                 <option value="all">All Accounts</option>
                 {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
              </Select>
           </div>
           
           <div className="print-section p-4 border border-gray-100 rounded">
                <div className="text-center mb-6 hidden print:block">
                    <h2 className="text-2xl font-bold">{settings.companyName}</h2>
                    <h3 className="text-xl">General Ledger</h3>
                    <p className="text-sm text-gray-500">
                        {fromDate && toDate ? `From ${fromDate} to ${toDate}` : 'All Dates'}
                    </p>
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
            <Card title="Ratio Analysis" action={<button className="p-2 hover:bg-gray-100 rounded" onClick={() => window.print()}><Printer size={20}/></button>}>
                <div className="flex gap-4 mb-6 no-print">
                    <Input label="From" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                    <Input label="To" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                </div>
                
                <div className="print-section p-4 border border-gray-100 rounded">
                    <div className="text-center mb-6 hidden print:block">
                        <h2 className="text-2xl font-bold">{settings.companyName}</h2>
                        <h3 className="text-xl">Financial Ratio Analysis</h3>
                        <p className="text-sm text-gray-500">
                            {fromDate && toDate ? `From ${fromDate} to ${toDate}` : 'All Dates'}
                        </p>
                    </div>

                    <p className="text-sm text-gray-500 mb-6 no-print">Key financial ratios for the selected period.</p>
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
                </div>
            </Card>
        </div>
    );
};

const AgedReceivables: React.FC = () => {
    const { accounts, transactions, settings } = useStore();
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

    const agedData = useMemo(() => {
        const arAccount = accounts.find(a => a.name === 'Accounts Receivable');
        if (!arAccount) return { customers: [], totals: { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0, total: 0 }};

        const customerData: { [key: string]: { balance: number; invoices: { date: string; amount: number }[] } } = {};

        // Simplified customer identification from description
        const getCustomerName = (desc: string): string => {
            const match = desc.match(/(to|from|for)\s(.*?)(?:\s|$|:)/i);
            return match ? match[2].trim() : 'Unknown Customer';
        };
        
        const relevantTransactions = transactions
            .filter(t => t.date <= reportDate && t.lines.some(l => l.accountId === arAccount.id))
            .sort((a,b) => a.date.localeCompare(b.date));

        relevantTransactions.forEach(t => {
            const arLine = t.lines.find(l => l.accountId === arAccount.id);
            if (!arLine) return;

            const customerName = getCustomerName(t.description);
            if (!customerData[customerName]) {
                customerData[customerName] = { balance: 0, invoices: [] };
            }

            if (arLine.debit > 0) { // Invoice
                customerData[customerName].invoices.push({ date: t.date, amount: arLine.debit });
            }
            if (arLine.credit > 0) { // Payment
                // Simple FIFO payment application
                let paymentAmount = arLine.credit;
                // Oldest invoices are already first due to initial sort
                for (const invoice of customerData[customerName].invoices) {
                    if (paymentAmount <= 0) break;
                    const paidAmount = Math.min(invoice.amount, paymentAmount);
                    invoice.amount -= paidAmount;
                    paymentAmount -= paidAmount;
                }
            }
        });
        
        const reportDateObj = new Date(reportDate);
        const customers = Object.entries(customerData).map(([name, data]) => {
            const aging = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0, total: 0 };
            data.invoices.forEach(inv => {
                if (inv.amount <= 0.01) return;

                const invDate = new Date(inv.date);
                const age = (reportDateObj.getTime() - invDate.getTime()) / (1000 * 3600 * 24);

                if (age < 1) aging.current += inv.amount;
                else if (age <= 30) aging['1-30'] += inv.amount;
                else if (age <= 60) aging['31-60'] += inv.amount;
                else if (age <= 90) aging['61-90'] += inv.amount;
                else aging['90+'] += inv.amount;
                aging.total += inv.amount;
            });
            return { name, ...aging };
        }).filter(c => c.total > 0.01);

        const totals = customers.reduce((acc, curr) => {
            acc.current += curr.current;
            acc['1-30'] += curr['1-30'];
            acc['31-60'] += curr['31-60'];
            acc['61-90'] += curr['61-90'];
            acc['90+'] += curr['90+'];
            acc.total += curr.total;
            return acc;
        }, { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0, total: 0 });

        return { customers, totals };

    }, [accounts, transactions, reportDate]);

    return (
        <Card title="Aged Receivables Summary" action={<button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded" onClick={() => window.print()}><Printer size={20}/></button>}>
            <div className="flex gap-4 mb-6 no-print">
                <Input label="Aging as of" type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} />
            </div>
            <div className="print-section p-4 border border-gray-100 rounded">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold">{settings.companyName}</h2>
                    <h3 className="text-xl">Aged Receivables</h3>
                    <p className="text-sm text-gray-500">As of {reportDate}</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-4 py-2 text-left">Customer</th>
                                <th className="px-4 py-2 text-right">Current</th>
                                <th className="px-4 py-2 text-right">1-30 Days</th>
                                <th className="px-4 py-2 text-right">31-60 Days</th>
                                <th className="px-4 py-2 text-right">61-90 Days</th>
                                <th className="px-4 py-2 text-right">90+ Days</th>
                                <th className="px-4 py-2 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                            {agedData.customers.map(cust => (
                                <tr key={cust.name}>
                                    <td className="px-4 py-2 font-medium">{cust.name}</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(cust.current, settings)}</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(cust['1-30'], settings)}</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(cust['31-60'], settings)}</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(cust['61-90'], settings)}</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(cust['90+'], settings)}</td>
                                    <td className="px-4 py-2 text-right font-bold">{formatCurrency(cust.total, settings)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100 dark:bg-slate-800 font-bold border-t-2 border-gray-300">
                            <tr>
                                <td className="px-4 py-2 text-left">Total</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(agedData.totals.current, settings)}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(agedData.totals['1-30'], settings)}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(agedData.totals['31-60'], settings)}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(agedData.totals['61-90'], settings)}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(agedData.totals['90+'], settings)}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(agedData.totals.total, settings)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                 {agedData.customers.length === 0 && (
                   <p className="text-center py-8 text-gray-500">No outstanding receivables for the selected date.</p>
                 )}
            </div>
        </Card>
    );
};

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, users, addUser, updateUser, deleteUser, resetData, restoreData } = useStore();
  const [file, setFile] = useState<File | null>(null);

  const handleExport = () => {
    const data = localStorage.getItem('proAccountingData');
    if (!data) return;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = async () => {
    if (!file) return;
    const text = await file.text();
    if (restoreData(text)) {
      alert('Data restored successfully!');
      window.location.reload();
    } else {
      alert('Invalid backup file');
    }
  };

  return (
    <div className="space-y-6">
      <Card title="General Settings">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Company Name" value={settings.companyName} onChange={e => updateSettings({...settings, companyName: e.target.value})} />
            <Select label="Currency" value={settings.currency} onChange={e => {
                const c = CURRENCIES.find(c => c.code === e.target.value);
                updateSettings({...settings, currency: e.target.value, currencySign: c?.sign || '$'});
            }}>
               {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.sign})</option>)}
            </Select>
            <Select label="Language" value={settings.language} onChange={e => updateSettings({...settings, language: e.target.value})}>
               {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </Select>
            <Select label="Theme" value={settings.theme} onChange={e => updateSettings({...settings, theme: e.target.value as 'light'|'dark'})}>
               <option value="light">Light</option>
               <option value="dark">Dark</option>
            </Select>
         </div>
      </Card>
      
      <Card title="Data Management">
         <div className="space-y-4">
            <div className="flex items-center gap-4">
               <Button onClick={handleExport} variant="secondary" className="flex items-center gap-2"><Download size={16}/> Export Backup</Button>
            </div>
            <div className="flex items-center gap-4">
               <input type="file" accept=".json" onChange={e => setFile(e.target.files?.[0] || null)} className="text-sm text-gray-500" />
               <Button onClick={handleImport} disabled={!file} variant="secondary" className="flex items-center gap-2"><Upload size={16}/> Restore Data</Button>
            </div>
            <div className="pt-4 border-t">
               <Button onClick={() => {if(confirm('Reset all data? This cannot be undone.')) resetData()}} variant="danger">Reset Application Data</Button>
            </div>
         </div>
      </Card>
    </div>
  );
};

const SidebarItem: React.FC<{ to: string; icon: React.ReactNode; label: string; active: boolean; onClick?: () => void }> = ({ to, icon, label, active, onClick }) => (
  <Link to={to} onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);

const AppContent: React.FC = () => {
    const { settings } = useStore();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [reportsOpen, setReportsOpen] = useState(false);

    // Close sidebar on route change on mobile
    useEffect(() => {
        setSidebarOpen(false);
    }, [location]);

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-slate-900 transition-colors duration-200 font-sans">
             {/* Mobile Sidebar Overlay */}
             {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

             {/* Sidebar */}
             <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-slate-900 text-white transform transition-transform duration-200 z-30 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                           <FileText size={20} className="text-white" />
                        </div>
                        <h1 className="font-bold text-xl tracking-tight">Pro Books</h1>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    <SidebarItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" active={isActive('/')} />
                    <SidebarItem to="/transactions" icon={<BookOpen size={20} />} label="Transactions" active={isActive('/transactions')} />
                    <SidebarItem to="/accounts" icon={<ClipboardList size={20} />} label="Chart of Accounts" active={isActive('/accounts')} />
                    
                    <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reports</div>
                    <button onClick={() => setReportsOpen(!reportsOpen)} className={`w-full flex items-center justify-between px-4 py-3 rounded-md transition-colors ${location.pathname.startsWith('/reports') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <div className="flex items-center gap-3">
                           <PieChart size={20} />
                           <span className="font-medium">Financial Reports</span>
                        </div>
                        {reportsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {reportsOpen && (
                        <div className="pl-12 space-y-1 mt-1">
                            <Link to="/reports/ledger" className={`block py-2 text-sm ${isActive('/reports/ledger') ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>General Ledger</Link>
                            <Link to="/reports/trial-balance" className={`block py-2 text-sm ${isActive('/reports/trial-balance') ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>Trial Balance</Link>
                            <Link to="/reports/income" className={`block py-2 text-sm ${isActive('/reports/income') ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>Income Statement</Link>
                            <Link to="/reports/balance" className={`block py-2 text-sm ${isActive('/reports/balance') ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>Balance Sheet</Link>
                            <Link to="/reports/cashflow" className={`block py-2 text-sm ${isActive('/reports/cashflow') ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>Cash Flow</Link>
                            <Link to="/reports/ratios" className={`block py-2 text-sm ${isActive('/reports/ratios') ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>Ratio Analysis</Link>
                            <Link to="/reports/aging" className={`block py-2 text-sm ${isActive('/reports/aging') ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>Aged Receivables</Link>
                        </div>
                    )}

                    <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">System</div>
                    <SidebarItem to="/settings" icon={<Settings size={20} />} label="Settings" active={isActive('/settings')} />
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                            AD
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">Administrator</p>
                            <p className="text-xs text-slate-500 truncate">admin@company.com</p>
                        </div>
                    </div>
                </div>
             </aside>

             {/* Main Content */}
             <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="bg-white dark:bg-slate-800 shadow-sm z-10">
                    <div className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                             <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                 <Menu size={24} />
                             </button>
                             <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                                {location.pathname === '/' ? 'Dashboard' : 
                                 location.pathname.startsWith('/reports') ? 'Financial Reports' :
                                 location.pathname.replace('/', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                             </h2>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="hidden md:block text-right">
                                 <p className="text-sm font-medium text-gray-900 dark:text-white">{settings.companyName}</p>
                                 <p className="text-xs text-gray-500 dark:text-gray-400">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                             </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-6 scroll-smooth">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/transactions" element={<Transactions />} />
                        <Route path="/accounts" element={<ChartOfAccounts />} />
                        <Route path="/reports/ledger" element={<ReportsLedger />} />
                        <Route path="/reports/trial-balance" element={<FinancialStatements type="trial" />} />
                        <Route path="/reports/income" element={<FinancialStatements type="income" />} />
                        <Route path="/reports/balance" element={<FinancialStatements type="balance" />} />
                        <Route path="/reports/cashflow" element={<CashFlowStatement />} />
                        <Route path="/reports/ratios" element={<RatioAnalysis />} />
                        <Route path="/reports/aging" element={<AgedReceivables />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                    
                    <footer className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-700 text-center text-sm text-gray-500 dark:text-gray-400 pb-4">
                        &copy; {new Date().getFullYear()} Pro Accounting Software. All rights reserved. | Developed by asifanwar.online | WhatsApp: +923026834300
                    </footer>
                </div>
             </main>
        </div>
    );
};

const App: React.FC = () => {
    const [loading, setLoading] = useState(true);

    return (
        <StoreProvider>
            {loading ? <SplashScreen onFinish={() => setLoading(false)} /> : (
                <HashRouter>
                    <AppContent />
                </HashRouter>
            )}
        </StoreProvider>
    );
};

export default App;