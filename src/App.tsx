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
  Briefcase,
  Bell,
  Image as ImageIcon,
  Calendar,
  Filter
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
import { Account, AccountType, Transaction, JournalEntryLine, AppSettings, User, BackupData, Permission } from './types';
import { CURRENCIES, LANGUAGES, INITIAL_ACCOUNTS, ADMIN_PERMISSIONS, VIEWER_PERMISSIONS } from './constants';

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

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }> = ({ label, error, className = "", ...props }) => (
  <div className="mb-3">
    {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
    <input className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white ${className}`} {...props} />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
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

const NotificationCenter: React.FC = () => {
    const { notifications, markNotificationRead, settings } = useStore();
    const [open, setOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;

    const handleSendEmail = () => {
        if(!settings.notificationEmail) {
            alert("Please configure a notification email in settings.");
            return;
        }
        alert(`Email report sent to ${settings.notificationEmail} (Simulated)`);
    };

    return (
        <div className="relative">
            <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full" onClick={() => setOpen(!open)}>
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                )}
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl z-50 border dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
                        <h4 className="font-bold">Notifications</h4>
                        <button onClick={handleSendEmail} className="text-xs text-blue-600 hover:underline">Email Report</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="p-4 text-center text-sm text-gray-500">No notifications</p>
                        ) : (
                            notifications.sort((a,b) => b.date.localeCompare(a.date)).map(n => (
                                <div key={n.id} className={`p-3 border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750 cursor-pointer ${n.read ? 'opacity-60' : 'bg-blue-50/50 dark:bg-blue-900/10'}`} onClick={() => markNotificationRead(n.id)}>
                                    <div className="flex gap-2">
                                        <AlertCircle size={16} className={n.type === 'warning' ? 'text-orange-500' : 'text-blue-500'} />
                                        <div>
                                            <p className="text-sm font-medium">{n.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">{new Date(n.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

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

    const bankAccounts = accounts.filter(a => a.type === AccountType.ASSET && (a.name.toLowerCase().includes('bank') || a.name.toLowerCase().includes('cash')));
    const targetAccounts = accounts.filter(a => {
        if(type === 'income' || type === 'sale') return a.type === AccountType.INCOME;
        return a.type === AccountType.EXPENSE || (type === 'purchase' && a.type === AccountType.ASSET);
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

const Dashboard: React.FC = () => {
  const { accounts, transactions, settings, currentUser } = useStore();
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
  
  const marketingAccounts = accounts.filter(a => a.name.toLowerCase().includes('marketing') || a.name.toLowerCase().includes('advertising'));
  const marketingSpend = marketingAccounts.reduce((sum, acc) => sum + getAccountBalance(acc, transactions), 0);
  
  const burnRate = totalExpenses > 0 ? totalExpenses / 4 : 0; 
  const roi = totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : 0;

  const incomeTransactionsCount = transactions.filter(t => t.lines.some(l => {
      const acc = accounts.find(a => a.id === l.accountId);
      return acc?.type === AccountType.INCOME && l.credit > 0;
  })).length;
  const cac = incomeTransactionsCount > 0 ? marketingSpend / incomeTransactionsCount : 0;
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
              <Link to="/transactions">
                <button className="bg-[#1E1B39] hover:bg-[#2d2955] text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors">
                    View All
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
                  </div>
              ))}
           </div>
        </div>

      </div>

      <div className="space-y-8">
         <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] shadow-sm h-80 flex flex-col">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold">Expenses</h3>
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
                </div>
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
            </div>
            <div className="h-40 mb-6">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={profitTrendData}>
                     <defs>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#1E1B39" stopOpacity={0.8}/>
                           <stop offset="95%" stopColor="#1E1B39" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <Area type="monotone" dataKey="profit" stroke="#1E1B39" fillOpacity={1} fill="url(#colorProfit)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
};

const Transactions: React.FC = () => {
  const { transactions, accounts, addTransaction, deleteTransaction, settings, hasPermission } = useStore();
  const [newTransaction, setNewTransaction] = useState<Omit<Transaction, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    description: '',
    lines: [
      { accountId: '', debit: 0, credit: 0 },
      { accountId: '', debit: 0, credit: 0 }
    ],
    contact: ''
  });
  const [error, setError] = useState('');

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
    setError('');
    
    // Validation
    const totalDebit = newTransaction.lines.reduce((sum, line) => sum + Number(line.debit), 0);
    const totalCredit = newTransaction.lines.reduce((sum, line) => sum + Number(line.credit), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      setError(`Debits (${totalDebit}) must equal Credits (${totalCredit})`);
      return;
    }
    
    if (newTransaction.lines.some(l => !l.accountId)) {
      setError("Please select an account for all lines");
      return;
    }
    
    // If Liability used, check for due date for bill tracking
    const liabilityUsed = newTransaction.lines.some(l => {
       const acc = accounts.find(a => a.id === l.accountId);
       return acc?.type === AccountType.LIABILITY && l.credit > 0;
    });

    if (liabilityUsed && !newTransaction.dueDate) {
        if(!confirm("You are recording a liability (Payable) without a Due Date. Continue?")) return;
    }

    addTransaction({
      id: Date.now().toString(),
      ...newTransaction,
      lines: newTransaction.lines.map(l => ({ ...l, debit: Number(l.debit), credit: Number(l.credit) }))
    });
    
    setNewTransaction({
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      description: '',
      lines: [
        { accountId: '', debit: 0, credit: 0 },
        { accountId: '', debit: 0, credit: 0 }
      ],
      contact: ''
    });
  };

  return (
    <div className="space-y-6">
      {hasPermission('manage_transactions') && (
      <Card title="New Transaction">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input 
              label="Date" 
              type="date" 
              value={newTransaction.date} 
              onChange={e => setNewTransaction({...newTransaction, date: e.target.value})} 
              required 
            />
            <Input 
              label="Due Date (Optional)" 
              type="date" 
              value={newTransaction.dueDate} 
              onChange={e => setNewTransaction({...newTransaction, dueDate: e.target.value})} 
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
            <div className="flex justify-between items-center">
                <button type="button" onClick={addLine} className="text-sm text-blue-600 flex items-center gap-1 hover:underline">
                    <Plus size={14} /> Add Line
                </button>
                {error && <span className="text-red-500 text-sm font-bold">{error}</span>}
            </div>
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
                       {hasPermission('manage_transactions') && (
                       <button onClick={() => deleteTransaction(t.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={16} />
                       </button>
                       )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const ChartOfAccounts: React.FC = () => {
  const { accounts, addAccount, updateAccount, deleteAccount, hasPermission } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Account>>({});

  const handleEdit = (account: Account) => {
    setEditingId(account.id);
    setFormData(account);
  };

  const handleSave = () => {
    if (!formData.code || !formData.name || !formData.type) return;
    
    // Check for duplicate code
    if (!editingId && accounts.some(a => a.code === formData.code)) {
        alert("Account Code already exists!");
        return;
    }

    if (editingId) {
      updateAccount(formData as Account);
    } else {
      addAccount({
        id: Date.now().toString(),
        ...formData as any,
        openingBalance: Number(formData.openingBalance || 0)
      });
    }
    setEditingId(null);
    setFormData({});
  };

  return (
    <div className="space-y-6">
      {hasPermission('manage_accounts') && (
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
                 {hasPermission('manage_accounts') && <th className="px-4 py-3 text-right">Actions</th>}
               </tr>
             </thead>
             <tbody>
               {accounts.sort((a,b) => a.code.localeCompare(b.code)).map(acc => (
                 <tr key={acc.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">
                    <td className="px-4 py-3 font-mono">{acc.code}</td>
                    <td className="px-4 py-3 font-medium">{acc.name}</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{acc.type}</span></td>
                    <td className="px-4 py-3">{acc.openingBalance?.toFixed(2)}</td>
                    {hasPermission('manage_accounts') && (
                    <td className="px-4 py-3 text-right">
                       <button onClick={() => handleEdit(acc)} className="text-blue-600 hover:text-blue-800 mr-3"><Edit2 size={16}/></button>
                       <button onClick={() => deleteAccount(acc.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
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

const FinancialStatements: React.FC<{ type: 'trial' | 'income' | 'balance' }> = ({ type }) => {
  const { accounts, transactions, settings, updateSettings, hasPermission } = useStore();
  const [showConfig, setShowConfig] = useState(false);
  
  if (!hasPermission('view_reports')) return <div className="p-4 text-center">Access Denied</div>;

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
        }).filter(a => settings.reportConfig.showZeroBalance ? true : (a.debit !== 0 || a.credit !== 0));
     } else if (type === 'income') {
        const income = accounts.filter(a => a.type === AccountType.INCOME).map(a => ({ ...a, balance: getAccountBalance(a, transactions) })).filter(a => settings.reportConfig.showZeroBalance || a.balance !== 0);
        const expense = accounts.filter(a => a.type === AccountType.EXPENSE).map(a => ({ ...a, balance: getAccountBalance(a, transactions) })).filter(a => settings.reportConfig.showZeroBalance || a.balance !== 0);
        return { income, expense };
     } else {
        const assets = accounts.filter(a => a.type === AccountType.ASSET).map(a => ({ ...a, balance: getAccountBalance(a, transactions) })).filter(a => settings.reportConfig.showZeroBalance || a.balance !== 0);
        const liabilities = accounts.filter(a => a.type === AccountType.LIABILITY).map(a => ({ ...a, balance: getAccountBalance(a, transactions) })).filter(a => settings.reportConfig.showZeroBalance || a.balance !== 0);
        const equity = accounts.filter(a => a.type === AccountType.EQUITY).map(a => ({ ...a, balance: getAccountBalance(a, transactions) })).filter(a => settings.reportConfig.showZeroBalance || a.balance !== 0);
        
        const totalIncome = getAccountTypeBalance(transactions, accounts, AccountType.INCOME);
        const totalExpense = getAccountTypeBalance(transactions, accounts, AccountType.EXPENSE);
        const netIncome = totalIncome - totalExpense;

        return { assets, liabilities, equity, netIncome };
     }
  }, [type, accounts, transactions, settings.reportConfig]);

  const toggleConfig = () => setShowConfig(!showConfig);
  const { reportConfig } = settings;

  return (
    <div className="space-y-4">
        <div className="flex justify-end">
            <Button onClick={toggleConfig} variant="secondary" className="flex items-center gap-2 text-xs">
                <Filter size={16}/> Customize Report
            </Button>
        </div>

        {showConfig && (
            <div className="bg-gray-100 dark:bg-slate-700 p-4 rounded-lg mb-4 grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={reportConfig.showZeroBalance} onChange={e => updateSettings({...settings, reportConfig: {...reportConfig, showZeroBalance: e.target.checked}})} />
                    Show Zero Balance Accounts
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={reportConfig.showAccountCodes} onChange={e => updateSettings({...settings, reportConfig: {...reportConfig, showAccountCodes: e.target.checked}})} />
                    Show Account Codes
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={reportConfig.compactView} onChange={e => updateSettings({...settings, reportConfig: {...reportConfig, compactView: e.target.checked}})} />
                    Compact View
                </label>
                <Input label="Footer Text" value={reportConfig.footerText || ''} onChange={e => updateSettings({...settings, reportConfig: {...reportConfig, footerText: e.target.value}})} />
            </div>
        )}

        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow print-section">
            {/* Report Header with Logo */}
            <div className="text-center mb-8 border-b pb-4">
                {settings.companyLogo && <img src={settings.companyLogo} alt="Logo" className="h-16 mx-auto mb-2" />}
                <h2 className="text-2xl font-bold">{settings.companyName}</h2>
                <h3 className="text-xl text-gray-500 uppercase tracking-widest mt-1">
                    {type === 'trial' ? 'Trial Balance' : type === 'income' ? 'Income Statement' : 'Balance Sheet'}
                </h3>
                <p className="text-sm text-gray-400 mt-2">{new Date().toLocaleDateString()}</p>
            </div>

            <div className={reportConfig.compactView ? 'text-xs' : 'text-sm'}>
               {/* Rendering Logic matches previous but uses data from memoized reportData */}
               {type === 'trial' && (
                  <table className="w-full">
                      <thead className="border-b-2 border-gray-800 dark:border-gray-200 font-bold">
                          <tr>
                              <th className="text-left py-2">Account</th>
                              <th className="text-right py-2">Debit</th>
                              <th className="text-right py-2">Credit</th>
                          </tr>
                      </thead>
                      <tbody>
                          {(reportData as any[]).map(d => (
                              <tr key={d.id} className="border-b border-gray-100 dark:border-slate-700">
                                  <td className="py-2">{reportConfig.showAccountCodes ? `${d.code} - ` : ''}{d.name}</td>
                                  <td className="text-right">{d.debit ? formatCurrency(d.debit, settings) : '-'}</td>
                                  <td className="text-right">{d.credit ? formatCurrency(d.credit, settings) : '-'}</td>
                              </tr>
                          ))}
                          <tr className="font-bold border-t-2 border-gray-800">
                              <td className="py-2">Total</td>
                              <td className="text-right">{(reportData as any[]).reduce((s,a)=>s+a.debit,0).toFixed(2)}</td>
                              <td className="text-right">{(reportData as any[]).reduce((s,a)=>s+a.credit,0).toFixed(2)}</td>
                          </tr>
                      </tbody>
                  </table>
               )}

               {type === 'income' && (
                   <div className="space-y-6">
                       <div>
                           <h4 className="font-bold text-lg text-green-600 border-b mb-2">Revenue</h4>
                           {(reportData as any).income.map((a:any) => (
                               <div key={a.id} className="flex justify-between py-1 border-b border-gray-50">
                                   <span>{reportConfig.showAccountCodes ? `${a.code} - ` : ''}{a.name}</span>
                                   <span>{formatCurrency(a.balance, settings)}</span>
                               </div>
                           ))}
                       </div>
                       <div>
                           <h4 className="font-bold text-lg text-red-600 border-b mb-2">Expenses</h4>
                           {(reportData as any).expense.map((a:any) => (
                               <div key={a.id} className="flex justify-between py-1 border-b border-gray-50">
                                   <span>{reportConfig.showAccountCodes ? `${a.code} - ` : ''}{a.name}</span>
                                   <span>{formatCurrency(a.balance, settings)}</span>
                               </div>
                           ))}
                       </div>
                       <div className="flex justify-between items-center text-xl font-bold pt-4 border-t-2 border-black">
                           <span>Net Income</span>
                           <span>{formatCurrency((reportData as any).income.reduce((s:number,a:any)=>s+a.balance,0) - (reportData as any).expense.reduce((s:number,a:any)=>s+a.balance,0), settings)}</span>
                       </div>
                   </div>
               )}

               {type === 'balance' && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div>
                           <h4 className="font-bold text-lg text-blue-600 border-b mb-2">Assets</h4>
                           {(reportData as any).assets.map((a:any) => (
                               <div key={a.id} className="flex justify-between py-1 border-b border-gray-50">
                                   <span>{reportConfig.showAccountCodes ? `${a.code} - ` : ''}{a.name}</span>
                                   <span>{formatCurrency(a.balance, settings)}</span>
                               </div>
                           ))}
                           <div className="font-bold mt-2 flex justify-between">
                               <span>Total Assets</span>
                               <span>{formatCurrency((reportData as any).assets.reduce((s:number,a:any)=>s+a.balance,0), settings)}</span>
                           </div>
                       </div>
                       <div>
                           <h4 className="font-bold text-lg text-red-600 border-b mb-2">Liabilities</h4>
                           {(reportData as any).liabilities.map((a:any) => (
                               <div key={a.id} className="flex justify-between py-1 border-b border-gray-50">
                                   <span>{reportConfig.showAccountCodes ? `${a.code} - ` : ''}{a.name}</span>
                                   <span>{formatCurrency(a.balance, settings)}</span>
                               </div>
                           ))}
                           
                           <h4 className="font-bold text-lg text-purple-600 border-b mb-2 mt-6">Equity</h4>
                           {(reportData as any).equity.map((a:any) => (
                               <div key={a.id} className="flex justify-between py-1 border-b border-gray-50">
                                   <span>{reportConfig.showAccountCodes ? `${a.code} - ` : ''}{a.name}</span>
                                   <span>{formatCurrency(a.balance, settings)}</span>
                               </div>
                           ))}
                           <div className="flex justify-between py-1 text-green-600 font-bold">
                               <span>Net Income</span>
                               <span>{formatCurrency((reportData as any).netIncome, settings)}</span>
                           </div>
                       </div>
                   </div>
               )}
            </div>
            
            <div className="mt-8 pt-4 border-t text-center text-xs text-gray-400">
                {reportConfig.footerText}
            </div>
        </div>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, users, updateUser, hasPermission } = useStore();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'backup'>('general');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              updateSettings({ ...settings, companyLogo: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  const togglePermission = (perm: Permission) => {
      if (!editingUser) return;
      const current = editingUser.permissions;
      const updated = current.includes(perm) ? current.filter(p => p !== perm) : [...current, perm];
      setEditingUser({ ...editingUser, permissions: updated });
  };

  const saveUserPermissions = () => {
      if (editingUser) {
          updateUser(editingUser);
          setEditingUser(null);
      }
  };

  if (!hasPermission('manage_settings')) return <div className="p-4">Access Denied</div>;

  return (
    <div className="space-y-6">
        <div className="flex border-b dark:border-slate-700">
            <button className={`px-4 py-2 ${activeTab === 'general' ? 'border-b-2 border-blue-500 font-bold' : ''}`} onClick={()=>setActiveTab('general')}>General</button>
            <button className={`px-4 py-2 ${activeTab === 'users' ? 'border-b-2 border-blue-500 font-bold' : ''}`} onClick={()=>setActiveTab('users')}>Users & Permissions</button>
            <button className={`px-4 py-2 ${activeTab === 'backup' ? 'border-b-2 border-blue-500 font-bold' : ''}`} onClick={()=>setActiveTab('backup')}>Backup & Data</button>
        </div>

      {activeTab === 'general' && (
      <Card title="General Configuration">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Company Name" value={settings.companyName} onChange={e => updateSettings({...settings, companyName: e.target.value})} />
            
            <div className="space-y-2">
                <label className="block text-sm font-medium">Company Logo</label>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"/>
                {settings.companyLogo && <img src={settings.companyLogo} alt="Logo" className="h-12 mt-2" />}
            </div>

            <Select label="Currency" value={settings.currency} onChange={e => updateSettings({...settings, currency: e.target.value})}>
               {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.sign})</option>)}
            </Select>
            <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={settings.emailNotifications} onChange={e => updateSettings({...settings, emailNotifications: e.target.checked})} />
                    Enable Email Notifications
                </label>
                {settings.emailNotifications && (
                    <Input label="Notification Email" value={settings.notificationEmail || ''} onChange={e => updateSettings({...settings, notificationEmail: e.target.value})} placeholder="alerts@company.com" />
                )}
                <Input label="Low Stock Threshold" type="number" value={settings.lowStockThreshold || 1000} onChange={e => updateSettings({...settings, lowStockThreshold: parseInt(e.target.value)})} />
            </div>
         </div>
      </Card>
      )}

      {activeTab === 'users' && (
          <Card title="User Management">
              {editingUser ? (
                  <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                      <h4 className="font-bold mb-4">Edit Permissions for {editingUser.username}</h4>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                          {['manage_settings', 'manage_users', 'manage_accounts', 'manage_transactions', 'view_reports'].map(p => (
                              <label key={p} className="flex items-center gap-2 capitalize">
                                  <input type="checkbox" checked={editingUser.permissions.includes(p as Permission)} onChange={() => togglePermission(p as Permission)} />
                                  {p.replace('_', ' ')}
                              </label>
                          ))}
                      </div>
                      <div className="flex gap-2">
                          <Button onClick={saveUserPermissions}>Save Permissions</Button>
                          <Button variant="secondary" onClick={() => setEditingUser(null)}>Cancel</Button>
                      </div>
                  </div>
              ) : (
                  <table className="w-full text-left">
                      <thead>
                          <tr className="border-b dark:border-slate-700">
                              <th className="py-2">User</th>
                              <th className="py-2">Role</th>
                              <th className="py-2">Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          {users.map(u => (
                              <tr key={u.id} className="border-b dark:border-slate-700">
                                  <td className="py-2">{u.username}</td>
                                  <td className="py-2">{u.role}</td>
                                  <td className="py-2">
                                      <button onClick={() => setEditingUser(u)} className="text-blue-500 hover:underline">Edit Permissions</button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              )}
          </Card>
      )}

      {activeTab === 'backup' && (
          <div className="p-4 bg-yellow-50 dark:bg-slate-800 rounded">
              <p>Backup controls are available in the dashboard sidebar or top menu depending on layout.</p>
          </div>
      )}
    </div>
  );
};

const AppContent: React.FC = () => {
    const { settings, users, currentUser, setCurrentUser } = useStore();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => { setSidebarOpen(false); }, [location]);
    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-slate-900 transition-colors duration-200 font-sans">
             {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

             <aside className={`fixed lg:static inset-y-0 left-0 ${collapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white transform transition-all duration-300 z-30 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
                <div className={`p-6 border-b border-slate-800 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
                    <div className="flex items-center gap-3">
                        {settings.companyLogo ? (
                             <img src={settings.companyLogo} className="w-8 h-8 rounded object-cover bg-white" alt="Logo" />
                        ) : (
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                <FileText size={20} className="text-white" />
                            </div>
                        )}
                        {!collapsed && <h1 className="font-bold text-xl tracking-tight">Pro Books</h1>}
                    </div>
                </div>
                
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <LayoutDashboard size={20} /> {!collapsed && "Dashboard"}
                    </Link>
                    <Link to="/transactions" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/transactions') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <BookOpen size={20} /> {!collapsed && "Transactions"}
                    </Link>
                    <Link to="/accounts" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/accounts') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <ClipboardList size={20} /> {!collapsed && "Chart of Accounts"}
                    </Link>
                    
                    {!collapsed && <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase">Reports</div>}
                    
                    <Link to="/reports/income" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/reports/income') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <PieChart size={20} /> {!collapsed && "Financial Reports"}
                    </Link>

                    {!collapsed && <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase">System</div>}
                    
                    <Link to="/settings" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/settings') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <Settings size={20} /> {!collapsed && "Settings"}
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    {!collapsed && (
                        <div className="px-2 mb-4">
                        <select 
                            className="w-full bg-slate-800 text-xs text-slate-300 rounded p-1 border border-slate-700 outline-none"
                            value={currentUser?.id}
                            onChange={(e) => {
                                const user = users.find(u => u.id === e.target.value);
                                if (user) setCurrentUser(user);
                            }}
                        >
                            {users.map(u => (
                            <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                            ))}
                        </select>
                        </div>
                    )}
                </div>
             </aside>

             <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="bg-white dark:bg-slate-800 shadow-sm z-10">
                    <div className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                             <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500"><Menu size={24} /></button>
                             <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:block text-gray-500"><ChevronRight size={24} /></button>
                             <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                                {location.pathname === '/' ? 'Dashboard' : 
                                 location.pathname.replace('/', '').split('/').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                             </h2>
                        </div>
                        <div className="flex items-center gap-4">
                             <NotificationCenter />
                             <div className="text-right hidden md:block">
                                 <p className="text-sm font-medium text-gray-900 dark:text-white">{settings.companyName}</p>
                             </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6 scroll-smooth">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/transactions" element={<Transactions />} />
                        <Route path="/accounts" element={<ChartOfAccounts />} />
                        <Route path="/reports/trial-balance" element={<FinancialStatements type="trial" />} />
                        <Route path="/reports/income" element={<FinancialStatements type="income" />} />
                        <Route path="/reports/balance" element={<FinancialStatements type="balance" />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
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