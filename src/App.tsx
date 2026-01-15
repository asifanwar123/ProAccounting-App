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
  ChevronLeft,
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
  AlertCircle,
  Shield,
  Eye,
  Phone,
  Mail,
  MessageCircle,
  Globe,
  Send,
  FileQuestion,
  CreditCard as BillingIcon,
  Cloud,
  CheckCircle,
  Loader,
  Key,
  Lock,
  Copy,
  Check,
  ExternalLink,
  Database,
  Server,
  Zap,
  ShoppingBag,
  Target,
  Briefcase
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

declare const gapi: any;

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

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'success' }> = ({ children, variant = 'primary', className = "", ...props }) => {
  const baseStyle = "px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
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
    const timer1 = setTimeout(() => setFading(true), 2000);
    const timer2 = setTimeout(onFinish, 2700);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
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
  const rate = settings.exchangeRate || 1;
  const convertedAmount = amount * rate;
  const formatted = new Intl.NumberFormat(settings.language === 'Arabic' ? 'ar-AE' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(convertedAmount);
  return settings.showCurrencySign ? `${settings.currencySign} ${formatted}` : formatted;
};

// --- Logic Helpers ---
const getAccountBalance = (account: Account | undefined, transactions: Transaction[], startDate?: string, endDate?: string) => { if (!account) return 0; let balance = 0; const isDebitNormal = account.type === AccountType.ASSET || account.type === AccountType.EXPENSE; if (account.openingBalance) { balance += account.openingBalance; } transactions.forEach(t => { if (startDate && t.date < startDate) return; if (endDate && t.date > endDate) return; t.lines.forEach(line => { if (line.accountId === account.id) { if (isDebitNormal) { balance += (line.debit - line.credit); } else { balance += (line.credit - line.debit); } } }); }); return balance; };
const getAccountTypeBalance = (transactions: Transaction[], accounts: Account[], type: AccountType, startDate?: string, endDate?: string) => { const typeAccounts = accounts.filter(a => a.type === type); let total = 0; typeAccounts.forEach(acc => { total += getAccountBalance(acc, transactions, startDate, endDate); }); return total; };

// --- Quick Add Modal ---
const QuickTransactionModal: React.FC<{ type: 'income' | 'expense' | 'sale' | 'purchase'; onClose: () => void }> = ({ type, onClose }) => {
    const { accounts, addTransaction } = useStore();
    const [amount, setAmount] = useState('');
    const [desc, setDesc] = useState('');
    const [targetAcc, setTargetAcc] = useState('');
    const [bankAcc, setBankAcc] = useState('');

    // Pre-filter accounts
    const bankAccounts = accounts.filter(a => a.type === AccountType.ASSET && (a.name.toLowerCase().includes('bank') || a.name.toLowerCase().includes('cash')));
    const targetAccounts = accounts.filter(a => {
        if(type === 'income' || type === 'sale') return a.type === AccountType.INCOME;
        return a.type === AccountType.EXPENSE || (type === 'purchase' && a.type === AccountType.ASSET); // Purchase can be asset
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(amount);
        if(!amt || !targetAcc || !bankAcc) return;

        let debitId = '', creditId = '';
        if(type === 'income' || type === 'sale') {
            debitId = bankAcc;
            creditId = targetAcc;
        } else {
            debitId = targetAcc;
            creditId = bankAcc;
        }

        addTransaction({
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            description: desc || `Quick ${type}`,
            lines: [
                { accountId: debitId, debit: amt, credit: 0 },
                { accountId: creditId, debit: 0, credit: amt }
            ]
        });
        onClose();
    };

    const title = type === 'income' ? 'Add Income' : type === 'expense' ? 'Add Expense' : type === 'sale' ? 'Record Sale' : 'Record Purchase';
    const color = type === 'income' || type === 'sale' ? 'text-green-600' : 'text-red-600';

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-slate-700">
                    <h3 className={`text-xl font-bold ${color} capitalize`}>{title}</h3>
                    <button onClick={onClose}><X className="text-gray-400 hover:text-gray-600" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Amount" type="number" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} required autoFocus placeholder="0.00" />
                    <Input label="Description" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="e.g. Client Payment" />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {type === 'income' || type === 'sale' ? 'Deposit To (Bank/Cash)' : 'Pay From (Bank/Cash)'}
                        </label>
                        <select className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600" value={bankAcc} onChange={e=>setBankAcc(e.target.value)} required>
                            <option value="">Select Account</option>
                            {bankAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {type === 'income' || type === 'sale' ? 'Income Category' : 'Expense/Asset Category'}
                        </label>
                        <select className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600" value={targetAcc} onChange={e=>setTargetAcc(e.target.value)} required>
                            <option value="">Select Category</option>
                            {targetAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                    <Button type="submit" className="w-full mt-2">Save Transaction</Button>
                </form>
            </div>
        </div>
    );
};

// --- Pages ---

const Dashboard: React.FC = () => {
  const { accounts, transactions, settings, currentUser } = useStore();
  const isViewer = currentUser?.role === 'viewer';
  const [quickAction, setQuickAction] = useState<'income' | 'expense' | 'sale' | 'purchase' | null>(null);

  const totalIncome = getAccountTypeBalance(transactions, accounts, AccountType.INCOME);
  const totalExpenses = getAccountTypeBalance(transactions, accounts, AccountType.EXPENSE);
  const netProfit = totalIncome - totalExpenses;
  const grossProfitMargin = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  
  const cashAccount = accounts.find(a => a.name.toLowerCase().includes('cash'));
  const bankAccount = accounts.find(a => a.name.toLowerCase().includes('bank'));
  const arAccount = accounts.find(a => a.name.toLowerCase().includes('receivable'));
  const apAccount = accounts.find(a => a.name.toLowerCase().includes('payable'));

  const cashBalance = getAccountBalance(cashAccount, transactions);
  const bankBalance = getAccountBalance(bankAccount, transactions);
  const arBalance = getAccountBalance(arAccount, transactions);
  const apBalance = getAccountBalance(apAccount, transactions);
  
  // KPI Calculations
  const marketingAccounts = accounts.filter(a => a.name.toLowerCase().includes('marketing') || a.name.toLowerCase().includes('advertising'));
  const marketingSpend = marketingAccounts.reduce((sum, acc) => sum + getAccountBalance(acc, transactions), 0);
  
  // Burn Rate (Avg Monthly Expense - simplified 3 months)
  const burnRate = totalExpenses > 0 ? totalExpenses / 3 : 0; 
  
  // ROI (Net Income / Total Expenses * 100 as simplified marketing ROI or Efficiency)
  const roi = totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : 0;

  // CAC: Marketing Spend / Number of Income Transactions (Proxy for new customers)
  const incomeTransactionsCount = transactions.filter(t => t.lines.some(l => {
      const acc = accounts.find(a => a.id === l.accountId);
      return acc?.type === AccountType.INCOME && l.credit > 0;
  })).length;
  const cac = incomeTransactionsCount > 0 ? marketingSpend / incomeTransactionsCount : 0;

  // LTV (Avg Transaction Value)
  const ltv = incomeTransactionsCount > 0 ? totalIncome / incomeTransactionsCount : 0;

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
          if (acc?.type === AccountType.INCOME) income += (l.credit - l.debit);
          if (acc?.type === AccountType.EXPENSE) expense += (l.debit - l.credit);
       });
    });
    const rate = settings.exchangeRate || 1;
    return { 
        date: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }), 
        income: (income || 0) * rate, 
        expense: (expense || 0) * rate 
    };
  });

  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4)
    .map(t => {
        const status = t.lines.reduce((acc, l) => acc + l.credit, 0) > 1000 ? 'Completed' : 'Upcoming';
        return { ...t, status };
    });

  const expenseData = accounts
    .filter(a => a.type === AccountType.EXPENSE)
    .map(acc => {
       const val = getAccountBalance(acc, transactions);
       return { name: acc.name, value: val * (settings.exchangeRate || 1), fill: '#8884d8' };
    })
    .filter(d => d.value > 0)
    .sort((a,b) => b.value - a.value)
    .slice(0, 4);

  const EXPENSE_COLORS = ['#FFBB28', '#FF8042', '#00C49F', '#0088FE'];
  expenseData.forEach((d, i) => d.fill = EXPENSE_COLORS[i % EXPENSE_COLORS.length]);

  const profitTrendData = cashFlowData.map(d => ({
    name: d.date,
    profit: d.income - d.expense,
    income: d.income
  }));


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-gray-800 dark:text-gray-100 font-sans">
      {quickAction && <QuickTransactionModal type={quickAction} onClose={() => setQuickAction(null)} />}
      
      <div className="lg:col-span-2 space-y-8">
        {/* Quick Actions Bar */}
        {!isViewer && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button onClick={() => setQuickAction('income')} className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-slate-800 rounded-2xl hover:bg-green-100 dark:hover:bg-slate-700 transition-colors group">
                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
                        <TrendingUp size={24} className="text-green-600 dark:text-green-400"/>
                    </div>
                    <span className="font-bold text-sm text-green-800 dark:text-green-200">Add Income</span>
                </button>
                <button onClick={() => setQuickAction('expense')} className="flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-slate-800 rounded-2xl hover:bg-red-100 dark:hover:bg-slate-700 transition-colors group">
                    <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
                        <Zap size={24} className="text-red-600 dark:text-red-400"/>
                    </div>
                    <span className="font-bold text-sm text-red-800 dark:text-red-200">Add Expense</span>
                </button>
                <button onClick={() => setQuickAction('sale')} className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-slate-800 rounded-2xl hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors group">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
                        <ShoppingBag size={24} className="text-blue-600 dark:text-blue-400"/>
                    </div>
                    <span className="font-bold text-sm text-blue-800 dark:text-blue-200">New Sale</span>
                </button>
                <button onClick={() => setQuickAction('purchase')} className="flex flex-col items-center justify-center p-4 bg-purple-50 dark:bg-slate-800 rounded-2xl hover:bg-purple-100 dark:hover:bg-slate-700 transition-colors group">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
                        <Wallet size={24} className="text-purple-600 dark:text-purple-400"/>
                    </div>
                    <span className="font-bold text-sm text-purple-800 dark:text-purple-200">Purchase</span>
                </button>
            </div>
        )}

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
                                <p className="text-orange-400">{`Income: ${payload[0].value.toFixed(2)}`}</p>
                                <p className="text-slate-400">{`Exp: ${payload[1].value.toFixed(2)}`}</p>
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
        
        {/* KPI Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-red-500">
                    <Zap size={16}/> <span className="text-xs font-bold uppercase">Burn Rate</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(burnRate, settings)}</p>
                <p className="text-[10px] text-gray-500">Avg. Monthly Expense</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-green-500">
                    <Target size={16}/> <span className="text-xs font-bold uppercase">ROI</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{roi.toFixed(1)}%</p>
                <p className="text-[10px] text-gray-500">Return on Investment</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-blue-500">
                    <Users size={16}/> <span className="text-xs font-bold uppercase">CAC</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(cac, settings)}</p>
                <p className="text-[10px] text-gray-500">Cost per Customer</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-purple-500">
                    <Briefcase size={16}/> <span className="text-xs font-bold uppercase">LTV</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(ltv, settings)}</p>
                <p className="text-[10px] text-gray-500">Avg. Transaction Value</p>
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border-l-4 border-blue-500">
                <p className="text-xs text-gray-500 uppercase font-bold">Cash</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(cashBalance, settings)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border-l-4 border-purple-500">
                <p className="text-xs text-gray-500 uppercase font-bold">Bank</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(bankBalance, settings)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border-l-4 border-green-500">
                <p className="text-xs text-gray-500 uppercase font-bold">Receivables</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(arBalance, settings)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border-l-4 border-red-500">
                <p className="text-xs text-gray-500 uppercase font-bold">Payables</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(apBalance, settings)}</p>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] shadow-sm">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Transactions</h3>
              {!isViewer && (
                  <Link to="/transactions">
                    <button className="bg-[#1E1B39] hover:bg-[#2d2955] text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors">
                        Create Transaction
                    </button>
                  </Link>
              )}
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

                      {!isViewer && (
                        <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400">
                            <ArrowRight size={18} />
                        </button>
                      )}
                  </div>
              ))}
              {recentTransactions.length === 0 && <p className="text-center text-gray-500 py-4">No transactions found.</p>}
           </div>
        </div>

      </div>

      <div className="space-y-8">
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
            <div className="flex justify-center gap-2 mt-2">
                {expenseData.slice(0, 3).map((e, i) => (
                    <div key={e.name} className="h-2 w-8 rounded-full" style={{backgroundColor: e.fill}}></div>
                ))}
            </div>
         </div>

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

            <div className="space-y-4">
                <div className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl">
                    <span className="text-gray-500 text-sm font-medium">Gross Margin</span>
                    <span className="text-gray-900 dark:text-white font-bold">{grossProfitMargin.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl">
                    <span className="text-gray-500 text-sm font-medium">Outstanding</span>
                    <span className="text-gray-900 dark:text-white font-bold">{formatCurrency(arBalance, settings)}</span>
                </div>
            </div>
         </div>

      </div>

    </div>
  );
};

const Transactions: React.FC = () => {
  const { transactions, accounts, addTransaction, deleteTransaction, settings, currentUser } = useStore();
  const [newTransaction, setNewTransaction] = useState<Omit<Transaction, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    lines: [
      { accountId: '', debit: 0, credit: 0 },
      { accountId: '', debit: 0, credit: 0 }
    ]
  });
  const isViewer = currentUser?.role === 'viewer';

  useEffect(() => {
    const savedDraft = localStorage.getItem('draft_transaction');
    if (savedDraft) {
        try {
            const parsed = JSON.parse(savedDraft);
            if (parsed.lines && Array.isArray(parsed.lines)) setNewTransaction(parsed);
        } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
     const timeout = setTimeout(() => {
         localStorage.setItem('draft_transaction', JSON.stringify(newTransaction));
     }, 500);
     return () => clearTimeout(timeout);
  }, [newTransaction]);

  const handleLineChange = (index: number, field: keyof JournalEntryLine, value: any) => {
    const newLines = [...newTransaction.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setNewTransaction({ ...newTransaction, lines: newLines });
  };

  const addLine = () => {
    setNewTransaction({
      ...newTransaction,
      lines: [...newTransaction.lines, { accountId: '', debit: 0, credit: 0 }]
    });
  };

  const removeLine = (index: number) => {
    if (newTransaction.lines.length <= 2) return;
    setNewTransaction({
      ...newTransaction,
      lines: newTransaction.lines.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalDebit = newTransaction.lines.reduce((sum, line) => sum + Number(line.debit), 0);
    const totalCredit = newTransaction.lines.reduce((sum, line) => sum + Number(line.credit), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      alert(`Debits (${totalDebit}) must equal Credits (${totalCredit})`);
      return;
    }
    
    if (newTransaction.lines.some(l => !l.accountId)) {
      alert("Please select an account for all lines");
      return;
    }

    addTransaction({
      id: Date.now().toString(),
      ...newTransaction,
      lines: newTransaction.lines.map(l => ({ ...l, debit: Number(l.debit), credit: Number(l.credit) }))
    });
    
    localStorage.removeItem('draft_transaction');
    setNewTransaction({
      date: new Date().toISOString().split('T')[0],
      description: '',
      lines: [
        { accountId: '', debit: 0, credit: 0 },
        { accountId: '', debit: 0, credit: 0 }
      ]
    });
  };

  return (
    <div className="space-y-6">
      {!isViewer && (
      <Card title="New Transaction">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1 border border-green-200">
                  <CheckCircle size={10} /> Auto-saved to draft
              </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Date" 
              type="date" 
              value={newTransaction.date} 
              onChange={e => setNewTransaction({...newTransaction, date: e.target.value})} 
              required 
            />
            <Input 
              label="Description" 
              value={newTransaction.description} 
              onChange={e => setNewTransaction({...newTransaction, description: e.target.value})} 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Journal Lines</label>
            {newTransaction.lines.map((line, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-2 items-end bg-gray-50 dark:bg-slate-700 p-3 rounded-md">
                <div className="flex-1 w-full">
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-800"
                    value={line.accountId}
                    onChange={e => handleLineChange(idx, 'accountId', e.target.value)}
                    required
                  >
                    <option value="">Select Account</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full md:w-32">
                   <input 
                      type="number" 
                      placeholder="Debit"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-800"
                      value={line.debit || ''}
                      onChange={e => handleLineChange(idx, 'debit', parseFloat(e.target.value))}
                      min="0" step="0.01"
                   />
                </div>
                <div className="w-full md:w-32">
                   <input 
                      type="number" 
                      placeholder="Credit"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-800"
                      value={line.credit || ''}
                      onChange={e => handleLineChange(idx, 'credit', parseFloat(e.target.value))}
                      min="0" step="0.01"
                   />
                </div>
                {newTransaction.lines.length > 2 && (
                  <button type="button" onClick={() => removeLine(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addLine} className="text-sm text-blue-600 flex items-center gap-1 hover:underline">
              <Plus size={14} /> Add Line
            </button>
          </div>

          <div className="flex justify-end">
             <Button type="submit">Post Transaction</Button>
          </div>
        </form>
      </Card>
      )}

      <Card title="Transaction History">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice().reverse().map(t => {
                const total = t.lines.reduce((sum, l) => sum + l.debit, 0);
                return (
                  <tr key={t.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">
                    <td className="px-4 py-3">{t.date}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{t.description}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t.lines.map((l, i) => {
                          const acc = accounts.find(a => a.id === l.accountId);
                          return (
                            <div key={i}>
                              {acc?.name}: {l.debit > 0 ? `Dr ${formatCurrency(l.debit, settings)}` : `Cr ${formatCurrency(l.credit, settings)}`}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(total, settings)}</td>
                    <td className="px-4 py-3 text-center">
                       {!isViewer && (
                       <button onClick={() => deleteTransaction(t.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={16} />
                       </button>
                       )}
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No transactions recorded yet.</td>
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
  const { accounts, addAccount, updateAccount, deleteAccount, currentUser } = useStore();
  const isViewer = currentUser?.role === 'viewer';
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Account>>({});

  useEffect(() => {
    if (!editingId) {
        const savedDraft = localStorage.getItem('draft_account');
        if (savedDraft) {
            try { setFormData(JSON.parse(savedDraft)); } catch (e) { console.error(e); }
        }
    }
  }, [editingId]);

  useEffect(() => {
    if (!editingId) {
        const timeout = setTimeout(() => {
            localStorage.setItem('draft_account', JSON.stringify(formData));
        }, 500);
        return () => clearTimeout(timeout);
    }
  }, [formData, editingId]);

  const handleEdit = (account: Account) => {
    setEditingId(account.id);
    setFormData(account);
  };

  const handleSave = () => {
    if (!formData.code || !formData.name || !formData.type) return;
    
    if (editingId) {
      updateAccount(formData as Account);
    } else {
      addAccount({
        id: Date.now().toString(),
        ...formData as any,
        openingBalance: Number(formData.openingBalance || 0)
      });
      localStorage.removeItem('draft_account');
    }
    setEditingId(null);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure? This will delete the account.')) {
      deleteAccount(id);
    }
  };

  return (
    <div className="space-y-6">
      {!isViewer && (
      <Card title={editingId ? "Edit Account" : "Add New Account"}>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <Input 
              label="Code" 
              value={formData.code || ''} 
              onChange={e => setFormData({...formData, code: e.target.value})} 
            />
            <Input 
              label="Name" 
              value={formData.name || ''} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
            />
            <Select 
              label="Type" 
              value={formData.type || ''} 
              onChange={e => setFormData({...formData, type: e.target.value as AccountType})}
            >
              <option value="">Select Type</option>
              {Object.values(AccountType).map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Input 
              label="Opening Balance" 
              type="number"
              value={formData.openingBalance || ''} 
              onChange={e => setFormData({...formData, openingBalance: parseFloat(e.target.value)})} 
            />
            <div className="flex gap-2 mb-3">
               <Button onClick={handleSave} className="flex-1">{editingId ? 'Update' : 'Add'}</Button>
               {editingId && <Button variant="secondary" onClick={() => {setEditingId(null); setFormData({})}}>Cancel</Button>}
            </div>
         </div>
      </Card>
      )}

      <Card title="Accounts List">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
             <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-300">
               <tr>
                 <th className="px-4 py-3">Code</th>
                 <th className="px-4 py-3">Name</th>
                 <th className="px-4 py-3">Type</th>
                 <th className="px-4 py-3">Opening Bal.</th>
                 {!isViewer && <th className="px-4 py-3 text-right">Actions</th>}
               </tr>
             </thead>
             <tbody>
               {accounts.sort((a,b) => a.code.localeCompare(b.code)).map(acc => (
                 <tr key={acc.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">
                    <td className="px-4 py-3 font-mono">{acc.code}</td>
                    <td className="px-4 py-3 font-medium">{acc.name}</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{acc.type}</span></td>
                    <td className="px-4 py-3">{acc.openingBalance?.toFixed(2)}</td>
                    {!isViewer && (
                    <td className="px-4 py-3 text-right">
                       <button onClick={() => handleEdit(acc)} className="text-blue-600 hover:text-blue-800 mr-3"><Edit2 size={16}/></button>
                       <button onClick={() => handleDelete(acc.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                    </td>
                    )}
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
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  
  const ledgerEntries = useMemo(() => {
    if (!selectedAccountId) return [];
    const entries: any[] = [];
    let runningBalance = selectedAccount?.openingBalance || 0;
    
    entries.push({
      date: '',
      description: 'Opening Balance',
      debit: 0,
      credit: 0,
      balance: runningBalance
    });

    const accountTransactions = transactions
      .filter(t => t.lines.some(l => l.accountId === selectedAccountId))
      .sort((a, b) => a.date.localeCompare(b.date));

    accountTransactions.forEach(t => {
      const line = t.lines.find(l => l.accountId === selectedAccountId);
      if (!line) return;
      
      const isDebitNormal = selectedAccount?.type === AccountType.ASSET || selectedAccount?.type === AccountType.EXPENSE;
      
      if (isDebitNormal) {
         runningBalance += (line.debit - line.credit);
      } else {
         runningBalance += (line.credit - line.debit);
      }

      entries.push({
        id: t.id,
        date: t.date,
        description: t.description,
        debit: line.debit,
        credit: line.credit,
        balance: runningBalance
      });
    });

    return entries;
  }, [selectedAccountId, transactions, selectedAccount]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow flex items-center gap-4">
         <span className="font-bold">Select Account:</span>
         <select 
           className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600"
           value={selectedAccountId}
           onChange={e => setSelectedAccountId(e.target.value)}
         >
           {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
         </select>
      </div>

      <Card title={`General Ledger: ${selectedAccount?.name} (${selectedAccount?.code})`}>
         <div className="overflow-x-auto">
           <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 dark:bg-slate-700">
                 <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Description</th>
                    <th className="px-4 py-2 text-right">Debit</th>
                    <th className="px-4 py-2 text-right">Credit</th>
                    <th className="px-4 py-2 text-right">Balance</th>
                 </tr>
              </thead>
              <tbody>
                 {ledgerEntries.map((entry, idx) => (
                    <tr key={idx} className="border-b dark:border-slate-700">
                       <td className="px-4 py-2">{entry.date}</td>
                       <td className="px-4 py-2">{entry.description}</td>
                       <td className="px-4 py-2 text-right">{entry.debit ? formatCurrency(entry.debit, settings) : '-'}</td>
                       <td className="px-4 py-2 text-right">{entry.credit ? formatCurrency(entry.credit, settings) : '-'}</td>
                       <td className="px-4 py-2 text-right font-bold">{formatCurrency(entry.balance, settings)}</td>
                    </tr>
                 ))}
              </tbody>
           </table>
         </div>
      </Card>
    </div>
  );
};

const FinancialStatements: React.FC<{ type: 'trial' | 'income' | 'balance' }> = ({ type }) => {
  const { accounts, transactions, settings } = useStore();
  
  const reportData = useMemo(() => {
     if (type === 'trial') {
        return accounts.map(acc => {
           const bal = getAccountBalance(acc, transactions);
           
           let debit = 0; 
           let credit = 0;
           
           const normalDebit = (acc.type === AccountType.ASSET || acc.type === AccountType.EXPENSE);
           if (normalDebit) {
               if(bal >= 0) debit = bal; else credit = -bal;
           } else {
               if(bal >= 0) credit = bal; else debit = -bal;
           }
           
           return { ...acc, debit, credit };
        }).filter(a => a.debit !== 0 || a.credit !== 0);
     } else if (type === 'income') {
        const income = accounts.filter(a => a.type === AccountType.INCOME).map(a => ({ ...a, balance: getAccountBalance(a, transactions) }));
        const expense = accounts.filter(a => a.type === AccountType.EXPENSE).map(a => ({ ...a, balance: getAccountBalance(a, transactions) }));
        return { income, expense };
     } else {
        // Balance Sheet
        const assets = accounts.filter(a => a.type === AccountType.ASSET).map(a => ({ ...a, balance: getAccountBalance(a, transactions) }));
        const liabilities = accounts.filter(a => a.type === AccountType.LIABILITY).map(a => ({ ...a, balance: getAccountBalance(a, transactions) }));
        const equity = accounts.filter(a => a.type === AccountType.EQUITY).map(a => ({ ...a, balance: getAccountBalance(a, transactions) }));
        
        // Calculate Net Income to add to Equity
        const totalIncome = getAccountTypeBalance(transactions, accounts, AccountType.INCOME);
        const totalExpense = getAccountTypeBalance(transactions, accounts, AccountType.EXPENSE);
        const netIncome = totalIncome - totalExpense;

        return { assets, liabilities, equity, netIncome };
     }
  }, [type, accounts, transactions]);

  if (type === 'trial') {
     const data = reportData as any[];
     const totalDebit = data.reduce((s, a) => s + a.debit, 0);
     const totalCredit = data.reduce((s, a) => s + a.credit, 0);
     
     return (
        <Card title="Trial Balance">
           <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-slate-700 font-bold">
                 <tr>
                    <th className="px-4 py-2 text-left">Account</th>
                    <th className="px-4 py-2 text-right">Debit</th>
                    <th className="px-4 py-2 text-right">Credit</th>
                 </tr>
              </thead>
              <tbody>
                 {data.map(d => (
                    <tr key={d.id} className="border-b dark:border-slate-700">
                       <td className="px-4 py-2">{d.code} - {d.name}</td>
                       <td className="px-4 py-2 text-right">{d.debit ? formatCurrency(d.debit, settings) : '-'}</td>
                       <td className="px-4 py-2 text-right">{d.credit ? formatCurrency(d.credit, settings) : '-'}</td>
                    </tr>
                 ))}
                 <tr className="font-bold bg-gray-50 dark:bg-slate-700">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(totalDebit, settings)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(totalCredit, settings)}</td>
                 </tr>
              </tbody>
           </table>
        </Card>
     );
  } else if (type === 'income') {
     const { income, expense } = reportData as any;
     const totalIncome = income.reduce((s:number, a:any) => s + a.balance, 0);
     const totalExpense = expense.reduce((s:number, a:any) => s + a.balance, 0);
     
     return (
        <Card title="Income Statement (Profit & Loss)">
           <div className="space-y-6">
              <div>
                 <h4 className="font-bold text-lg mb-2 text-green-600">Revenue</h4>
                 {income.map((a:any) => (
                    <div key={a.id as string} className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-700">
                       <span>{a.name}</span>
                       <span>{formatCurrency(a.balance, settings)}</span>
                    </div>
                 ))}
                 <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                    <span>Total Revenue</span>
                    <span>{formatCurrency(totalIncome, settings)}</span>
                 </div>
              </div>
              
              <div>
                 <h4 className="font-bold text-lg mb-2 text-red-600">Expenses</h4>
                 {expense.map((a:any) => (
                    <div key={a.id as string} className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-700">
                       <span>{a.name}</span>
                       <span>{formatCurrency(a.balance, settings)}</span>
                    </div>
                 ))}
                 <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                    <span>Total Expenses</span>
                    <span>{formatCurrency(totalExpense, settings)}</span>
                 </div>
              </div>

              <div className="bg-blue-50 dark:bg-slate-700 p-4 rounded-lg flex justify-between items-center text-xl font-bold">
                 <span>Net Income</span>
                 <span className={totalIncome - totalExpense >= 0 ? "text-green-600" : "text-red-600"}>
                    {formatCurrency(totalIncome - totalExpense, settings)}
                 </span>
              </div>
           </div>
        </Card>
     );
  } else {
      const { assets, liabilities, equity, netIncome } = reportData as any;
      const totalAssets = assets.reduce((s:number, a:any) => s + a.balance, 0);
      const totalLiabilities = liabilities.reduce((s:number, a:any) => s + a.balance, 0);
      const totalEquity = equity.reduce((s:number, a:any) => s + a.balance, 0) + netIncome;

      return (
        <Card title="Balance Sheet">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                 <h4 className="font-bold text-lg mb-4 text-blue-600 border-b pb-2">Assets</h4>
                 {assets.map((a:any) => (
                    <div key={a.id as string} className="flex justify-between py-1 text-sm">
                       <span>{a.name}</span>
                       <span>{formatCurrency(a.balance, settings)}</span>
                    </div>
                 ))}
                 <div className="flex justify-between font-bold mt-4 pt-2 border-t text-lg">
                    <span>Total Assets</span>
                    <span>{formatCurrency(totalAssets, settings)}</span>
                 </div>
              </div>
              
              <div className="space-y-8">
                 <div>
                    <h4 className="font-bold text-lg mb-4 text-red-600 border-b pb-2">Liabilities</h4>
                    {liabilities.map((a:any) => (
                        <div key={a.id as string} className="flex justify-between py-1 text-sm">
                        <span>{a.name}</span>
                        <span>{formatCurrency(a.balance, settings)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                        <span>Total Liabilities</span>
                        <span>{formatCurrency(totalLiabilities, settings)}</span>
                    </div>
                 </div>

                 <div>
                    <h4 className="font-bold text-lg mb-4 text-purple-600 border-b pb-2">Equity</h4>
                    {equity.map((a:any) => (
                        <div key={a.id as string} className="flex justify-between py-1 text-sm">
                        <span>{a.name}</span>
                        <span>{formatCurrency(a.balance, settings)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between py-1 text-sm text-green-600">
                       <span>Net Income (Current Period)</span>
                       <span>{formatCurrency(netIncome, settings)}</span>
                    </div>
                    <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                        <span>Total Equity</span>
                        <span>{formatCurrency(totalEquity, settings)}</span>
                    </div>
                 </div>
                 
                 <div className="bg-gray-100 dark:bg-slate-700 p-3 rounded font-bold flex justify-between">
                     <span>Total Liabilities & Equity</span>
                     <span>{formatCurrency(totalLiabilities + totalEquity, settings)}</span>
                 </div>
              </div>
           </div>
        </Card>
      );
  }
};

const CashFlowStatement: React.FC = () => {
    const { accounts, transactions, settings } = useStore();
    
    const totalIncome = getAccountTypeBalance(transactions, accounts, AccountType.INCOME);
    const totalExpense = getAccountTypeBalance(transactions, accounts, AccountType.EXPENSE);
    const netIncome = totalIncome - totalExpense;

    return (
        <Card title="Statement of Cash Flows (Simplified)">
            <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b dark:border-slate-700">
                    <span className="font-medium">Net Income</span>
                    <span className="font-bold">{formatCurrency(netIncome, settings)}</span>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-slate-700/50 rounded text-sm text-yellow-800 dark:text-yellow-200">
                    <p>Note: This is a simplified cash flow projection based on Net Income. A full indirect method cash flow requires tracking balance changes in all asset/liability accounts (AR, AP, Inventory, Depreciation, etc.).</p>
                </div>
                <div className="flex justify-between items-center py-2 font-bold text-lg bg-gray-50 dark:bg-slate-700 p-2 rounded">
                    <span>Net Cash from Operating Activities</span>
                    <span>{formatCurrency(netIncome, settings)}</span>
                </div>
            </div>
        </Card>
    );
};

const RatioAnalysis: React.FC = () => {
    const { accounts, transactions, settings } = useStore();
    
    const currentAssets = getAccountTypeBalance(transactions, accounts, AccountType.ASSET); 
    const currentLiabilities = getAccountTypeBalance(transactions, accounts, AccountType.LIABILITY); 
    const totalEquity = getAccountTypeBalance(transactions, accounts, AccountType.EQUITY);
    const totalIncome = getAccountTypeBalance(transactions, accounts, AccountType.INCOME);
    const totalExpense = getAccountTypeBalance(transactions, accounts, AccountType.EXPENSE);
    const netIncome = totalIncome - totalExpense;
    
    const currentRatio = currentLiabilities ? (currentAssets / currentLiabilities).toFixed(2) : 'N/A';
    const debtToEquity = totalEquity ? (currentLiabilities / totalEquity).toFixed(2) : 'N/A';
    const profitMargin = totalIncome ? ((netIncome / totalIncome) * 100).toFixed(1) + '%' : '0%';

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Current Ratio">
                <div className="text-center py-6">
                    <div className="text-4xl font-bold text-blue-600">{currentRatio}</div>
                    <p className="text-sm text-gray-500 mt-2">Assets / Liabilities</p>
                    <p className="text-xs text-gray-400 mt-1">Target: &gt; 1.0</p>
                </div>
            </Card>
            <Card title="Debt to Equity">
                <div className="text-center py-6">
                    <div className="text-4xl font-bold text-purple-600">{debtToEquity}</div>
                    <p className="text-sm text-gray-500 mt-2">Liabilities / Equity</p>
                    <p className="text-xs text-gray-400 mt-1">Lower is better</p>
                </div>
            </Card>
            <Card title="Net Profit Margin">
                <div className="text-center py-6">
                    <div className="text-4xl font-bold text-green-600">{profitMargin}</div>
                    <p className="text-sm text-gray-500 mt-2">Net Income / Revenue</p>
                    <p className="text-xs text-gray-400 mt-1">Higher is better</p>
                </div>
            </Card>
        </div>
    );
};

const AgedReceivables: React.FC = () => {
    const { accounts, transactions, settings } = useStore();
    const arAccounts = accounts.filter(a => a.name.toLowerCase().includes('receivable'));
    
    const receivables = transactions.flatMap(t => {
        return t.lines.filter(l => arAccounts.some(a => a.id === l.accountId) && l.debit > 0)
           .map(l => ({ ...l, date: t.date, description: t.description, id: t.id }));
    });
    
    const totalAR = arAccounts.reduce((sum, acc) => sum + getAccountBalance(acc, transactions), 0);

    return (
        <Card title="Aged Receivables Summary">
             <div className="p-4 bg-blue-50 dark:bg-slate-700/50 rounded-lg mb-6 flex items-center justify-between">
                 <span className="font-medium">Total Receivables (Outstanding)</span>
                 <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalAR, settings)}</span>
             </div>
             
             <p className="text-sm text-gray-500 mb-4">
                 Note: Detailed aging requires full invoice tracking (matching payments to specific invoices). 
                 Currently showing total outstanding balance in Receivable accounts.
             </p>

             <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                     <thead className="bg-gray-100 dark:bg-slate-700">
                         <tr>
                             <th className="px-4 py-2 text-left">Date</th>
                             <th className="px-4 py-2 text-left">Transaction</th>
                             <th className="px-4 py-2 text-right">Original Amount</th>
                         </tr>
                     </thead>
                     <tbody>
                         {receivables.slice(0, 10).map((r, i) => (
                             <tr key={i} className="border-b dark:border-slate-700">
                                 <td className="px-4 py-2">{r.date}</td>
                                 <td className="px-4 py-2">{r.description}</td>
                                 <td className="px-4 py-2 text-right">{formatCurrency(r.debit, settings)}</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
        </Card>
    );
};

const HelpPage: React.FC = () => {
    const { settings, updateSettings } = useStore();
    const [msgSubject, setMsgSubject] = useState('');
    const [msgBody, setMsgBody] = useState('');
    
    const [activationStep, setActivationStep] = useState<'idle' | 'payment' | 'key'>('idle');
    const [paymentRegion, setPaymentRegion] = useState<'intl' | 'pk'>('intl');
    const [activationKey, setActivationKey] = useState('');
    const [generatedKey, setGeneratedKey] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showDemoHint, setShowDemoHint] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleSendEmail = () => {
        if(!msgSubject || !msgBody) {
            alert('Please fill in both subject and message.');
            return;
        }
        const mailtoLink = `mailto:m.asif.anwar@gmail.com?subject=${encodeURIComponent(msgSubject)}&body=${encodeURIComponent(msgBody)}`;
        window.location.href = mailtoLink;
    };

    const handleSendWhatsApp = () => {
        if(!msgSubject || !msgBody) {
            alert('Please fill in both subject and message.');
            return;
        }
        const waLink = `https://wa.me/923026834300?text=${encodeURIComponent(`Subject: ${msgSubject}\n\n${msgBody}`)}`;
        window.open(waLink, '_blank');
    };

    const generateLicenseKey = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let key = '';
        for (let i = 0; i < 14; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    };

    const handleWhatsAppRedirect = () => {
        const demoKey = generateLicenseKey();
        setGeneratedKey(demoKey);
        
        const message = `Hello, I have sent the payment for Pro Books Pro Plan. Please verify and send me the activation key.`;
        window.open(`https://wa.me/923026834300?text=${encodeURIComponent(message)}`, '_blank');
        
        setProcessing(true);
        setTimeout(() => {
            setProcessing(false);
            setShowDemoHint(true);
            setActivationStep('key');
        }, 3000); 
    };

    const handleActivateKey = () => {
        if (activationKey !== generatedKey && activationKey !== 'PRO-DEMO-KEY') {
            alert("Invalid Activation Key. Please ensure you copied it correctly.");
            return;
        }
        setProcessing(true);
        setTimeout(() => {
            setProcessing(false);
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            updateSettings({
                ...settings, 
                plan: 'pro', 
                billingDate: nextYear.toISOString()
            });
            setActivationStep('idle');
            setShowDemoHint(false);
            alert("Pro Plan Activated Successfully! Thank you for your purchase.");
        }, 1500);
    };

    const copyKey = async () => {
        try {
            await navigator.clipboard.writeText(generatedKey);
            setCopied(true);
        } catch (err) {
            const textArea = document.createElement("textarea");
            textArea.value = generatedKey;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                setCopied(true);
            } catch (err) {
                console.error('Unable to copy', err);
            }
            document.body.removeChild(textArea);
        }
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePaymentRedirect = (url: string) => {
        window.open(url, '_blank');
    }

    return (
        <div className="space-y-6">
            <Card title="Help & Support">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Contact Information */}
                    <div className="space-y-6">
                        <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 border-b pb-2">Contact Us</h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-blue-600 dark:text-blue-400">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Email Support</p>
                                    <p className="font-medium">m.asif.anwar@gmail.com</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300">
                                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full text-green-600 dark:text-green-400">
                                    <MessageCircle size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">WhatsApp</p>
                                    <p className="font-medium">+92 302 6834300</p>
                                </div>
                            </div>
                        </div>

                        <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 border-b pb-2 pt-4">Subscription</h4>
                        
                        {settings.plan === 'pro' ? (
                            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 flex items-center gap-4">
                                <BillingIcon className="text-yellow-600 dark:text-yellow-400" size={32} />
                                <div>
                                    <p className="font-bold text-yellow-800 dark:text-yellow-300">Pro Plan (Active)</p>
                                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                        Next billing date: {settings.billingDate ? new Date(settings.billingDate).toLocaleDateString() : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString()}
                                    </p>
                                </div>
                                <CheckCircle className="ml-auto text-green-500" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activationStep === 'idle' && (
                                    <div 
                                        className="border rounded-lg p-4 flex items-center gap-4 cursor-pointer transition-colors bg-gray-50 hover:bg-gray-100 dark:bg-slate-700"
                                        onClick={() => setActivationStep('payment')}
                                    >
                                        <Lock className="text-gray-500" size={32} />
                                        <div>
                                            <p className="font-bold text-gray-700 dark:text-gray-200">Free Plan</p>
                                            <p className="text-xs text-blue-600">Click to Upgrade to Pro</p>
                                        </div>
                                        <ChevronRight className="ml-auto text-gray-400" />
                                    </div>
                                )}

                                {activationStep === 'payment' && (
                                    <div className="bg-blue-50 dark:bg-slate-750 border border-blue-200 dark:border-slate-600 p-4 rounded-lg space-y-3">
                                        <h5 className="font-bold text-sm text-gray-800 dark:text-gray-200">1. Select Payment Method</h5>
                                        
                                        <div className="flex border-b border-gray-300 dark:border-slate-600 mb-2">
                                            <button 
                                                className={`flex-1 py-2 text-sm font-medium ${paymentRegion === 'intl' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                                                onClick={() => setPaymentRegion('intl')}
                                            >
                                                International
                                            </button>
                                            <button 
                                                className={`flex-1 py-2 text-sm font-medium ${paymentRegion === 'pk' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}
                                                onClick={() => setPaymentRegion('pk')}
                                            >
                                                Pakistan
                                            </button>
                                        </div>

                                        <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300 max-h-40 overflow-y-auto">
                                            {paymentRegion === 'intl' ? (
                                                <>
                                                    <div 
                                                        className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                                        onClick={() => handlePaymentRedirect('https://www.paypal.com')}
                                                    >
                                                        <span className="text-xl">🅿️</span>
                                                        <div className="flex-1"><p className="font-bold">PayPal</p><p>paypal@probooks.com</p></div>
                                                        <ExternalLink size={14} className="text-gray-400"/>
                                                    </div>
                                                    <div 
                                                        className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                                        onClick={() => handlePaymentRedirect('https://www.payoneer.com')}
                                                    >
                                                        <span className="text-xl">💳</span>
                                                        <div className="flex-1"><p className="font-bold">Payoneer</p><p>payoneer@probooks.com</p></div>
                                                        <ExternalLink size={14} className="text-gray-400"/>
                                                    </div>
                                                    <div 
                                                        className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                                        onClick={() => handlePaymentRedirect('https://www.binance.com')}
                                                    >
                                                        <span className="text-xl">🔶</span>
                                                        <div className="flex-1"><p className="font-bold">Binance Pay</p><p>ID: 2348910</p></div>
                                                        <ExternalLink size={14} className="text-gray-400"/>
                                                    </div>
                                                    <div 
                                                        className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                                        onClick={() => handlePaymentRedirect('https://stripe.com')}
                                                    >
                                                        <span className="text-xl">🌐</span>
                                                        <div className="flex-1"><p className="font-bold">Stripe / Card</p><p>Pay Securely</p></div>
                                                        <ExternalLink size={14} className="text-gray-400"/>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div 
                                                        className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                                        onClick={() => handlePaymentRedirect('https://www.jazzcash.com.pk')}
                                                    >
                                                        <span className="text-xl">🔴</span>
                                                        <div className="flex-1"><p className="font-bold">JazzCash</p><p>0302-6834300</p></div>
                                                        <ExternalLink size={14} className="text-gray-400"/>
                                                    </div>
                                                    <div 
                                                        className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                                        onClick={() => handlePaymentRedirect('https://easypaisa.com.pk')}
                                                    >
                                                        <span className="text-xl">🟢</span>
                                                        <div className="flex-1"><p className="font-bold">EasyPaisa</p><p>0302-6834300</p></div>
                                                        <ExternalLink size={14} className="text-gray-400"/>
                                                    </div>
                                                    <div 
                                                        className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                                        onClick={() => handlePaymentRedirect('https://sadapay.pk')}
                                                    >
                                                        <span className="text-xl">🟧</span>
                                                        <div className="flex-1"><p className="font-bold">SadaPay</p><p>0302-6834300</p></div>
                                                        <ExternalLink size={14} className="text-gray-400"/>
                                                    </div>
                                                    <div 
                                                        className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                                        onClick={() => handlePaymentRedirect('https://www.meezanbank.com')}
                                                    >
                                                        <span className="text-xl">🏦</span>
                                                        <div className="flex-1"><p className="font-bold">Meezan Bank</p><p>1234-5678-9012-3456</p></div>
                                                        <ExternalLink size={14} className="text-gray-400"/>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <p className="text-xs text-gray-500">
                                            Select a method to pay online or make a manual transfer and send receipt to +923026834300.
                                        </p>

                                        <div className="flex gap-2 flex-col">
                                            <Button onClick={handleWhatsAppRedirect} disabled={processing} variant="success" className="w-full flex items-center justify-center gap-2">
                                                {processing ? <Loader className="animate-spin" size={16} /> : <><MessageCircle size={16} /> Send Receipt on WhatsApp</>}
                                            </Button>
                                            <div className="flex gap-2">
                                                <Button onClick={() => setActivationStep('idle')} variant="secondary" className="flex-1">Cancel</Button>
                                                <Button onClick={() => setActivationStep('key')} className="flex-1">I have a Key</Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activationStep === 'key' && (
                                    <div className="bg-green-50 dark:bg-slate-750 border border-green-200 dark:border-slate-600 p-4 rounded-lg space-y-3">
                                        
                                        {showDemoHint && (
                                            <div 
                                                className="mb-2 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-md cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors group relative"
                                                onClick={copyKey}
                                                title="Click to Copy Key"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-yellow-800 dark:text-yellow-300 uppercase tracking-wider">Demo Mode Active</span>
                                                    {copied ? <span className="text-xs text-green-600 font-bold flex items-center gap-1"><Check size={12}/> Copied</span> : <span className="text-xs text-gray-500">Click key to copy</span>}
                                                </div>
                                                <div className="font-mono text-lg font-bold text-center text-gray-800 dark:text-gray-100 tracking-widest mt-1">
                                                    {generatedKey}
                                                </div>
                                                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Copy size={16} className="text-gray-500"/>
                                                </div>
                                            </div>
                                        )}

                                        <h5 className="font-bold text-sm text-gray-800 dark:text-gray-200">2. Enter Activation Key</h5>
                                        <div className="relative">
                                            <Key size={16} className="absolute left-3 top-3 text-gray-400" />
                                            <input 
                                                type="text"
                                                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                                                placeholder="Enter 14-character key" 
                                                value={activationKey} 
                                                onChange={e => setActivationKey(e.target.value)} 
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={() => setActivationStep('payment')} variant="secondary" className="flex-1">Back</Button>
                                            <Button onClick={handleActivateKey} disabled={processing} variant="success" className="flex-1">
                                                {processing ? <Loader className="animate-spin inline" size={16} /> : 'Activate'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Forms */}
                    <div className="bg-gray-50 dark:bg-slate-750 p-6 rounded-xl">
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Send us a message</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                <select className="w-full p-2 rounded border border-gray-300 dark:border-slate-600 dark:bg-slate-700">
                                    <option>Inquiry</option>
                                    <option>Suggestion</option>
                                    <option>Bug Report</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 rounded border border-gray-300 dark:border-slate-600 dark:bg-slate-700" 
                                    placeholder="Brief subject" 
                                    value={msgSubject}
                                    onChange={e => setMsgSubject(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                                <textarea 
                                    className="w-full p-2 rounded border border-gray-300 dark:border-slate-600 dark:bg-slate-700 h-32" 
                                    placeholder="How can we help?"
                                    value={msgBody}
                                    onChange={e => setMsgBody(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleSendEmail} className="flex-1 flex items-center justify-center gap-2">
                                    <Mail size={16} /> Send Email
                                </Button>
                                <Button onClick={handleSendWhatsApp} variant="success" className="flex-1 flex items-center justify-center gap-2">
                                    <MessageCircle size={16} /> WhatsApp
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetData, restoreData, saveToCloud, loadFromCloud, syncWithSupabase, isSyncing, currentUser, loadDemoData } = useStore();
  const isViewer = currentUser?.role === 'viewer';
  const [file, setFile] = useState<File | null>(null);
  const [gLoading, setGLoading] = useState(false);
  const [loadingRate, setLoadingRate] = useState(false);
  const [cloudMsg, setCloudMsg] = useState('');
  const [sbMsg, setSbMsg] = useState('');

  // --- Exchange Rate Logic ---
  const fetchExchangeRate = async (currency: string) => {
    if (currency === 'USD') return 1;
    setLoadingRate(true);
    try {
        const response = await fetch(`https://open.er-api.com/v6/latest/USD`);
        const data = await response.json();
        const rate = data.rates[currency];
        return rate || 1;
    } catch (e) {
        console.warn("API Fetch failed, using fallback rates");
        const fallbackRates: {[key: string]: number} = {
            'PKR': 278.50, 'JPY': 150.10, 'CNY': 7.19, 'AED': 3.67, 'SAR': 3.75, 'USD': 1
        };
        return fallbackRates[currency] || 1;
    } finally {
        setLoadingRate(false);
    }
  };

  const handleCurrencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newCurrency = e.target.value;
      const c = CURRENCIES.find(c => c.code === newCurrency);
      let newRate = settings.exchangeRate;
      const rate = await fetchExchangeRate(newCurrency);
      newRate = rate;
      updateSettings({
          ...settings, 
          currency: newCurrency, 
          currencySign: c?.sign || '$', 
          exchangeRate: newRate
      });
  };

  // --- Google Drive Logic ---
  const initGapi = async () => {
    if (!settings.googleClientId || !settings.googleApiKey) {
        alert('Please enter your Google Client ID and API Key first.');
        return false;
    }
    return new Promise((resolve, reject) => {
        gapi.load('client:auth2', async () => {
            try {
                await gapi.client.init({
                    apiKey: settings.googleApiKey,
                    clientId: settings.googleClientId,
                    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
                    scope: 'https://www.googleapis.com/auth/drive.file'
                });
                resolve(true);
            } catch (error) {
                console.error("GAPI Init Error", error);
                alert("Google API Initialization failed. Check console for details.");
                resolve(false);
            }
        });
    });
  };

  const handleGDriverExport = async () => {
      setGLoading(true);
      const initialized = await initGapi();
      if (!initialized) { setGLoading(false); return; }
      try {
          const authInstance = gapi.auth2.getAuthInstance();
          if (!authInstance.isSignedIn.get()) await authInstance.signIn();
          const data = localStorage.getItem('proAccountingData');
          if (!data) throw new Error("No data to save");
          const fileContent = data;
          const fileName = `pro_accounting_backup_${new Date().toISOString().split('T')[0]}.json`;
          const file = new Blob([fileContent], {type: 'application/json'});
          const metadata = { 'name': fileName, 'mimeType': 'application/json' };
          const accessToken = gapi.auth.getToken().access_token;
          const form = new FormData();
          form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
          form.append('file', file);
          await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
              method: 'POST', headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }), body: form
          });
          alert("Backup uploaded to Google Drive successfully!");
      } catch (error) { console.error(error); alert("Failed to upload to Google Drive"); } finally { setGLoading(false); }
  };

  const handleGDriveImport = async () => {
      setGLoading(true);
      const initialized = await initGapi();
      if (!initialized) { setGLoading(false); return; }
      try {
          const authInstance = gapi.auth2.getAuthInstance();
          if (!authInstance.isSignedIn.get()) await authInstance.signIn();
          const response = await gapi.client.drive.files.list({ 'pageSize': 10, 'fields': "nextPageToken, files(id, name)", 'q': "name contains 'pro_accounting_backup' and trashed = false", 'orderBy': 'createdTime desc' });
          const files = response.result.files;
          if (files && files.length > 0) {
              const fileId = files[0].id;
              if (confirm(`Found backup: ${files[0].name}. Restore this file?`)) {
                  const fileResp = await gapi.client.drive.files.get({ fileId: fileId, alt: 'media' });
                  const success = restoreData(JSON.stringify(fileResp.result)); 
                  if (success) { alert("Data restored from Google Drive!"); window.location.reload(); } else { alert("Failed to parse backup file."); }
              }
          } else { alert("No backup files found in Drive."); }
      } catch (error) { console.error(error); alert("Failed to restore from Google Drive"); } finally { setGLoading(false); }
  };

  const handleExport = () => { const data = localStorage.getItem('proAccountingData'); if (!data) return; const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `backup-${new Date().toISOString().split('T')[0]}.json`; a.click(); };
  const handleImport = async () => { if (!file) return; const text = await file.text(); if (restoreData(text)) { alert('Data restored successfully!'); window.location.reload(); } else { alert('Invalid backup file'); } };

  // Generic JSON Cloud (e.g. JSONBin)
  const handleCloudSync = async (direction: 'up' | 'down') => {
      setCloudMsg('');
      if (direction === 'up') {
          const success = await saveToCloud();
          setCloudMsg(success ? 'Saved to remote database successfully!' : 'Failed to save. Check URL and API Key.');
      } else {
          const success = await loadFromCloud();
          setCloudMsg(success ? 'Loaded from remote database! Refreshing...' : 'Failed to load. Check URL and API Key.');
          if(success) setTimeout(() => window.location.reload(), 1500);
      }
  };

  const handleSupabaseSync = async (dir: 'push' | 'pull') => {
      setSbMsg('');
      const res = await syncWithSupabase(dir);
      setSbMsg(res.message);
      if(res.success && dir === 'pull') {
          setTimeout(() => window.location.reload(), 1500);
      }
  };

  const handleLoadDemo = () => {
    if(confirm("This will replace all current data with demo data. Continue?")) {
        loadDemoData();
        alert("Demo data loaded!");
        window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <Card title="General Settings">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Company Name" value={settings.companyName} onChange={e => updateSettings({...settings, companyName: e.target.value})} disabled={isViewer} />
            <div>
                <Select label="Currency" value={settings.currency} onChange={handleCurrencyChange} disabled={isViewer}>
                   {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.sign})</option>)}
                </Select>
                <div className="flex items-center gap-2 -mt-2 mb-2 px-1">
                    <input type="checkbox" id="showCurrencySign" checked={settings.showCurrencySign} onChange={e => updateSettings({...settings, showCurrencySign: e.target.checked})} disabled={isViewer} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <label htmlFor="showCurrencySign" className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer select-none">Show Currency Sign ({settings.currencySign})</label>
                </div>
            </div>
            <Select label="Language" value={settings.language} onChange={e => updateSettings({...settings, language: e.target.value})} disabled={isViewer}>{LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}</Select>
            <Select label="Theme" value={settings.theme} onChange={e => updateSettings({...settings, theme: e.target.value as 'light'|'dark'})}><option value="light">Light</option><option value="dark">Dark</option></Select>
            <div className="col-span-2 md:col-span-1 relative">
                <Input label={`Exchange Rate (1 USD = ? ${settings.currency})`} type="number" step="0.01" value={settings.exchangeRate || 1} onChange={e => updateSettings({...settings, exchangeRate: parseFloat(e.target.value)})} disabled={isViewer || settings.currency === 'USD'} />
                {loadingRate && <div className="absolute right-3 top-9"><Loader className="animate-spin text-blue-500" size={16}/></div>}
            </div>
         </div>
      </Card>
      
      {!isViewer ? (
      <>
        <Card title="Supabase Cloud Storage">
            <div className="bg-green-50 dark:bg-slate-700 p-4 rounded-lg mb-4 text-sm text-green-800 dark:text-green-200 border border-green-200 dark:border-slate-600">
                <p className="flex items-center gap-2 mb-2"><Database size={16}/> Connect to your Supabase Project.</p>
                <div className="text-xs opacity-90">
                    <strong>Required SQL Setup:</strong> Run this in your Supabase SQL Editor to create the storage table:<br/>
                    <code className="bg-white/50 dark:bg-black/20 px-1 rounded block mt-1 p-1 font-mono text-xs select-all">
                        create table if not exists app_storage (id text primary key, data jsonb, updated_at timestamp);
                    </code>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4 mb-4">
                <Input 
                    label="Supabase URL" 
                    placeholder="https://xyz.supabase.co" 
                    value={settings.supabaseUrl || ''} 
                    onChange={e => updateSettings({...settings, supabaseUrl: e.target.value})} 
                />
                <Input 
                    label="Supabase Key (Anon/Public)" 
                    type="password"
                    placeholder="ey..." 
                    value={settings.supabaseKey || ''} 
                    onChange={e => updateSettings({...settings, supabaseKey: e.target.value})} 
                />
            </div>
            <div className="flex gap-4 items-center">
                <Button onClick={() => handleSupabaseSync('push')} disabled={isSyncing || !settings.supabaseUrl} variant="primary" className="flex items-center gap-2">
                    {isSyncing ? <Loader className="animate-spin" size={16}/> : <Upload size={16}/>} Save to Supabase
                </Button>
                <Button onClick={() => handleSupabaseSync('pull')} disabled={isSyncing || !settings.supabaseUrl} variant="secondary" className="flex items-center gap-2">
                    {isSyncing ? <Loader className="animate-spin" size={16}/> : <Download size={16}/>} Load from Supabase
                </Button>
            </div>
            {sbMsg && <p className={`mt-2 text-sm ${sbMsg.includes('failed') || sbMsg.includes('exist') ? 'text-red-500' : 'text-green-500'}`}>{sbMsg}</p>}
        </Card>

        <Card title="Remote Database Connection (e.g. JSONBin.io)">
            <div className="bg-blue-50 dark:bg-slate-700 p-4 rounded-lg mb-4 text-sm text-blue-800 dark:text-blue-200">
                <p className="flex items-center gap-2"><Server size={16}/> Connect to an external JSON storage API.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 mb-4">
                <Input 
                    label="API Key / Auth Token" 
                    type="password"
                    placeholder="X-Master-Key or Bearer Token" 
                    value={settings.remoteStorageApiKey || ''} 
                    onChange={e => updateSettings({...settings, remoteStorageApiKey: e.target.value})} 
                />
                <div className="flex gap-2 items-end">
                    <div className="flex-1">
                        <Input 
                            label="API Endpoint URL" 
                            placeholder="https://api.jsonbin.io/v3/b/..." 
                            value={settings.remoteStorageUrl || ''} 
                            onChange={e => updateSettings({...settings, remoteStorageUrl: e.target.value})} 
                        />
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2 mb-4 p-2 border border-gray-200 dark:border-slate-700 rounded bg-gray-50 dark:bg-slate-800">
                <input 
                    type="checkbox" 
                    id="autoCloudSave" 
                    checked={settings.autoCloudSave || false} 
                    onChange={e => updateSettings({...settings, autoCloudSave: e.target.checked})} 
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="autoCloudSave" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none flex items-center gap-2">
                    <Cloud size={16} className="text-blue-500"/> Auto-save to Cloud (Supabase or Remote DB)
                </label>
            </div>

            <div className="flex gap-4 items-center">
                <Button onClick={() => handleCloudSync('up')} disabled={isSyncing || !settings.remoteStorageUrl} variant="primary" className="flex items-center gap-2">
                    {isSyncing ? <Loader className="animate-spin" size={16}/> : <Upload size={16}/>} Save to Remote DB
                </Button>
                <Button onClick={() => handleCloudSync('down')} disabled={isSyncing || !settings.remoteStorageUrl} variant="secondary" className="flex items-center gap-2">
                    {isSyncing ? <Loader className="animate-spin" size={16}/> : <Download size={16}/>} Load from Remote DB
                </Button>
            </div>
            {cloudMsg && <p className={`mt-2 text-sm ${cloudMsg.includes('Error') || cloudMsg.includes('Failed') ? 'text-red-500' : 'text-green-500'}`}>{cloudMsg}</p>}
        </Card>

        <Card title="Cloud Backup (Google Drive)">
            <p className="text-sm text-gray-500 mb-4">To use Google Drive, you must provide your own Client ID and API Key from the Google Cloud Console. Enable the "Google Drive API" and add this domain to "Authorized Javascript Origins".</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input label="Google Client ID" value={settings.googleClientId || ''} onChange={e => updateSettings({...settings, googleClientId: e.target.value})} />
                <Input label="Google API Key" value={settings.googleApiKey || ''} onChange={e => updateSettings({...settings, googleApiKey: e.target.value})} />
            </div>
            <div className="flex gap-4">
                <Button onClick={handleGDriverExport} disabled={gLoading} variant="primary" className="flex items-center gap-2">
                    {gLoading ? <Loader className="animate-spin" size={16}/> : <Cloud size={16}/>} Save to Drive
                </Button>
                <Button onClick={handleGDriveImport} disabled={gLoading} variant="secondary" className="flex items-center gap-2">
                    {gLoading ? <Loader className="animate-spin" size={16}/> : <Download size={16}/>} Retrieve from Drive
                </Button>
            </div>
        </Card>

        <Card title="Local Data Management">
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                <Button onClick={handleExport} variant="secondary" className="flex items-center gap-2"><Download size={16}/> Export Backup (JSON)</Button>
                </div>
                <div className="flex items-center gap-4">
                <input type="file" accept=".json" onChange={e => setFile(e.target.files?.[0] || null)} className="text-sm text-gray-500" />
                <Button onClick={handleImport} disabled={!file} variant="secondary" className="flex items-center gap-2"><Upload size={16}/> Restore Data</Button>
                </div>
                <div className="pt-4 border-t flex flex-wrap gap-4">
                    <Button onClick={() => {if(confirm('Reset all data? This cannot be undone.')) resetData()}} variant="danger">Reset Application Data</Button>
                    <Button onClick={handleLoadDemo} className="bg-purple-600 hover:bg-purple-700 text-white border-none flex items-center gap-2">
                        <Zap size={16}/> Load Demo Data
                    </Button>
                </div>
                <p className="text-xs text-gray-500">
                    Use "Load Demo Data" to populate the app with example transactions (Marketing, Consulting, Sales) to see KPIs in action.
                </p>
            </div>
        </Card>
      </>
      ) : (
        <Card title="Data Management">
          <p className="text-gray-500">You do not have permission to manage data.</p>
        </Card>
      )}
    </div>
  );
};

// ... (Rest of the file remains unchanged, wrapping up AppContent and exports)