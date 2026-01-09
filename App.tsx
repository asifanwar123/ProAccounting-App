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
  ExternalLink
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

// Declare gapi for Google Drive Integration
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
  // Apply exchange rate if provided, otherwise default to 1
  const rate = settings.exchangeRate || 1;
  const convertedAmount = amount * rate;
  
  const formatted = new Intl.NumberFormat(settings.language === 'Arabic' ? 'ar-AE' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(convertedAmount);
  return settings.showCurrencySign ? `${settings.currencySign} ${formatted}` : formatted;
};

// --- Logic Helpers ---

const getAccountBalance = (account: Account | undefined, transactions: Transaction[], startDate?: string, endDate?: string) => {
  if (!account) return 0;
  
  let balance = 0;
  
  const isDebitNormal = account.type === AccountType.ASSET || account.type === AccountType.EXPENSE;

  // Add opening balance
  if (account.openingBalance) {
    balance += account.openingBalance;
  }

  transactions.forEach(t => {
    if (startDate && t.date < startDate) return;
    if (endDate && t.date > endDate) return;
    
    t.lines.forEach(line => {
      if (line.accountId === account.id) {
        if (isDebitNormal) {
            balance += (line.debit - line.credit);
        } else {
            balance += (line.credit - line.debit);
        }
      }
    });
  });
  return balance;
};

const getAccountTypeBalance = (transactions: Transaction[], accounts: Account[], type: AccountType, startDate?: string, endDate?: string) => {
  const typeAccounts = accounts.filter(a => a.type === type);
  let total = 0;
  
  typeAccounts.forEach(acc => {
      total += getAccountBalance(acc, transactions, startDate, endDate);
  });
  
  return total;
};

// --- Pages ---

const Dashboard: React.FC = () => {
  const { accounts, transactions, settings, currentUser } = useStore();
  const isViewer = currentUser?.role === 'viewer';

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
      <div className="lg:col-span-2 space-y-8">
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

const HelpPage: React.FC = () => {
    const { settings, updateSettings } = useStore();
    const [msgSubject, setMsgSubject] = useState('');
    const [msgBody, setMsgBody] = useState('');
    
    // Pro Plan Activation State
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
        // Generate a key for the demo so the user has something to enter
        const demoKey = generateLicenseKey();
        setGeneratedKey(demoKey);
        
        const message = `Hello, I have sent the payment for Pro Books Pro Plan. Please verify and send me the activation key.`;
        window.open(`https://wa.me/923026834300?text=${encodeURIComponent(message)}`, '_blank');
        
        // Simulate the "Vendor" sending the key back after a delay
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
            // Fallback for non-secure contexts (http)
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

    // Updated redirection logic: Removed blocking confirm dialog to ensure consistent browser behavior
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
                        
                        {/* Subscription Logic */}
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

// ... (rest of the file remains the same)

const Transactions: React.FC = () => {
  const { transactions, accounts, addTransaction, deleteTransaction, settings, currentUser } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newTrans, setNewTrans] = useState<Partial<Transaction>>({
      date: new Date().toISOString().split('T')[0],
      description: '',
      lines: [{ accountId: '', debit: 0, credit: 0 }, { accountId: '', debit: 0, credit: 0 }]
  });

  const handleAddLine = () => {
      setNewTrans({ ...newTrans, lines: [...(newTrans.lines || []), { accountId: '', debit: 0, credit: 0 }] });
  };

  const updateLine = (index: number, field: keyof JournalEntryLine, value: any) => {
      const lines = [...(newTrans.lines || [])];
      lines[index] = { ...lines[index], [field]: value };
      setNewTrans({ ...newTrans, lines });
  };

  const removeLine = (index: number) => {
      const lines = [...(newTrans.lines || [])];
      lines.splice(index, 1);
      setNewTrans({ ...newTrans, lines });
  };

  const totalDebits = newTrans.lines?.reduce((sum, line) => sum + Number(line.debit || 0), 0) || 0;
  const totalCredits = newTrans.lines?.reduce((sum, line) => sum + Number(line.credit || 0), 0) || 0;
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01 && totalDebits > 0;

  const handleSubmit = () => {
      if (!isBalanced) return alert("Transaction is not balanced");
      if (!newTrans.description) return alert("Description is required");
      
      const transaction: Transaction = {
          id: Date.now().toString(),
          date: newTrans.date || '',
          description: newTrans.description || '',
          lines: newTrans.lines as JournalEntryLine[]
      };
      addTransaction(transaction);
      setIsCreating(false);
      setNewTrans({
          date: new Date().toISOString().split('T')[0],
          description: '',
          lines: [{ accountId: '', debit: 0, credit: 0 }, { accountId: '', debit: 0, credit: 0 }]
      });
  };

  if (isCreating) {
      return (
          <Card title="New Transaction" action={<Button onClick={() => setIsCreating(false)} variant="secondary">Cancel</Button>}>
              <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Date" type="date" value={newTrans.date} onChange={e => setNewTrans({...newTrans, date: e.target.value})} />
                      <Input label="Description" value={newTrans.description} onChange={e => setNewTrans({...newTrans, description: e.target.value})} />
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-slate-700">
                              <tr>
                                  <th className="p-2 text-left">Account</th>
                                  <th className="p-2 text-right">Debit</th>
                                  <th className="p-2 text-right">Credit</th>
                                  <th className="p-2 w-10"></th>
                              </tr>
                          </thead>
                          <tbody>
                              {newTrans.lines?.map((line, idx) => (
                                  <tr key={idx} className="border-t dark:border-slate-600">
                                      <td className="p-2">
                                          <select className="w-full p-1 border rounded dark:bg-slate-800" value={line.accountId} onChange={e => updateLine(idx, 'accountId', e.target.value)}>
                                              <option value="">Select Account</option>
                                              {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                                          </select>
                                      </td>
                                      <td className="p-2"><input type="number" className="w-full p-1 border rounded text-right dark:bg-slate-800" value={line.debit} onChange={e => updateLine(idx, 'debit', parseFloat(e.target.value) || 0)} disabled={line.credit > 0} /></td>
                                      <td className="p-2"><input type="number" className="w-full p-1 border rounded text-right dark:bg-slate-800" value={line.credit} onChange={e => updateLine(idx, 'credit', parseFloat(e.target.value) || 0)} disabled={line.debit > 0} /></td>
                                      <td className="p-2 text-center"><button onClick={() => removeLine(idx)} className="text-red-500"><Trash2 size={16}/></button></td>
                                  </tr>
                              ))}
                          </tbody>
                          <tfoot className="bg-gray-50 dark:bg-slate-700 font-bold">
                              <tr>
                                  <td className="p-2">Total</td>
                                  <td className={`p-2 text-right ${!isBalanced ? 'text-red-500' : 'text-green-500'}`}>{totalDebits.toFixed(2)}</td>
                                  <td className={`p-2 text-right ${!isBalanced ? 'text-red-500' : 'text-green-500'}`}>{totalCredits.toFixed(2)}</td>
                                  <td></td>
                              </tr>
                          </tfoot>
                      </table>
                  </div>
                  <Button onClick={handleAddLine} variant="secondary" className="w-full flex justify-center items-center gap-2"><Plus size={16}/> Add Line</Button>
                  <div className="flex justify-end gap-2">
                      <Button onClick={handleSubmit} disabled={!isBalanced}>Save Transaction</Button>
                  </div>
              </div>
          </Card>
      );
  }

  return (
      <Card title="Transactions" action={currentUser?.role !== 'viewer' && <Button onClick={() => setIsCreating(true)}>New Transaction</Button>}>
          <div className="overflow-x-auto">
              <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
                      <tr>
                          <th className="p-3 text-left">Date</th>
                          <th className="p-3 text-left">Description</th>
                          <th className="p-3 text-right">Amount</th>
                          <th className="p-3 text-center">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-700">
                      {[...transactions].sort((a,b) => b.date.localeCompare(a.date)).map(t => {
                          const amount = t.lines.reduce((acc, l) => acc + l.debit, 0);
                          return (
                              <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-750">
                                  <td className="p-3">{t.date}</td>
                                  <td className="p-3">
                                      <div className="font-medium">{t.description}</div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {t.lines.map(l => {
                                              const acc = accounts.find(a => a.id === l.accountId);
                                              return acc ? `${acc.name} (${l.debit > 0 ? formatCurrency(l.debit, settings) : formatCurrency(l.credit, settings)}) ` : '';
                                          }).join(' / ')}
                                      </div>
                                  </td>
                                  <td className="p-3 text-right font-bold">{formatCurrency(amount, settings)}</td>
                                  <td className="p-3 text-center">
                                      {currentUser?.role !== 'viewer' && (
                                          <button onClick={() => { if(confirm('Delete?')) deleteTransaction(t.id) }} className="text-red-500 hover:text-red-700">
                                              <Trash2 size={16} />
                                          </button>
                                      )}
                                  </td>
                              </tr>
                          );
                      })}
                      {transactions.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">No transactions yet.</td></tr>}
                  </tbody>
              </table>
          </div>
      </Card>
  );
};

const ChartOfAccounts: React.FC = () => {
    const { accounts, addAccount, updateAccount, deleteAccount, currentUser } = useStore();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Account>>({});
    const [isAdding, setIsAdding] = useState(false);

    const handleSave = () => {
        if (!editForm.code || !editForm.name || !editForm.type) return alert("Fill required fields");
        if (editingId) {
            updateAccount({ ...editForm, id: editingId } as Account);
            setEditingId(null);
        } else {
            addAccount({ ...editForm, id: Date.now().toString() } as Account);
            setIsAdding(false);
        }
        setEditForm({});
    };

    const startEdit = (acc: Account) => {
        setEditingId(acc.id);
        setEditForm(acc);
        setIsAdding(false);
    };

    return (
        <Card title="Chart of Accounts" action={currentUser?.role !== 'viewer' && <Button onClick={() => { setIsAdding(true); setEditForm({ type: AccountType.ASSET }); setEditingId(null); }}>Add Account</Button>}>
            {(isAdding || editingId) && (
                <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg mb-4 border dark:border-slate-600">
                    <h4 className="font-bold mb-2">{editingId ? 'Edit Account' : 'New Account'}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input label="Code" value={editForm.code || ''} onChange={e => setEditForm({ ...editForm, code: e.target.value })} />
                        <Input label="Name" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                        <Select label="Type" value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value as AccountType })}>
                            {Object.values(AccountType).map(t => <option key={t} value={t}>{t}</option>)}
                        </Select>
                    </div>
                    <div className="flex gap-2 mt-2">
                        <Button onClick={handleSave}>Save</Button>
                        <Button onClick={() => { setIsAdding(false); setEditingId(null); }} variant="secondary">Cancel</Button>
                    </div>
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-slate-700">
                        <tr>
                            <th className="p-2 text-left">Code</th>
                            <th className="p-2 text-left">Name</th>
                            <th className="p-2 text-left">Type</th>
                            <th className="p-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.sort((a,b) => a.code.localeCompare(b.code)).map(acc => (
                            <tr key={acc.id} className="border-b dark:border-slate-700">
                                <td className="p-2">{acc.code}</td>
                                <td className="p-2">{acc.name}</td>
                                <td className="p-2"><span className="px-2 py-1 bg-gray-200 dark:bg-slate-600 rounded text-xs">{acc.type}</span></td>
                                <td className="p-2 text-center">
                                    {currentUser?.role !== 'viewer' && (
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => startEdit(acc)} className="text-blue-500"><Edit2 size={16}/></button>
                                            <button onClick={() => {if(confirm('Delete?')) deleteAccount(acc.id)}} className="text-red-500"><Trash2 size={16}/></button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const ReportsLedger: React.FC = () => {
    const { accounts, transactions, settings } = useStore();
    const [selectedAccount, setSelectedAccount] = useState<string>(accounts[0]?.id || '');
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const account = accounts.find(a => a.id === selectedAccount);
    const relevantTrans = transactions.filter(t => t.date >= startDate && t.date <= endDate).filter(t => t.lines.some(l => l.accountId === selectedAccount)).sort((a,b) => a.date.localeCompare(b.date));
    
    let balance = getAccountBalance(account, transactions, undefined, new Date(new Date(startDate).setDate(new Date(startDate).getDate() - 1)).toISOString().split('T')[0]);

    return (
        <Card title="General Ledger">
            <div className="flex flex-wrap gap-4 mb-6">
                <Select className="w-64" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                </Select>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            
            <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded mb-4">
                <h4 className="font-bold">{account?.name} ({account?.code})</h4>
                <p>Opening Balance: {formatCurrency(balance, settings)}</p>
            </div>

            <table className="w-full text-sm">
                <thead className="bg-gray-200 dark:bg-slate-600">
                    <tr>
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Description</th>
                        <th className="p-2 text-right">Debit</th>
                        <th className="p-2 text-right">Credit</th>
                        <th className="p-2 text-right">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {relevantTrans.map(t => {
                        const line = t.lines.find(l => l.accountId === selectedAccount);
                        if (!line) return null;
                        const isDebitNormal = account?.type === AccountType.ASSET || account?.type === AccountType.EXPENSE;
                        if (isDebitNormal) balance += (line.debit - line.credit);
                        else balance += (line.credit - line.debit);

                        return (
                            <tr key={t.id} className="border-b dark:border-slate-700">
                                <td className="p-2">{t.date}</td>
                                <td className="p-2">{t.description}</td>
                                <td className="p-2 text-right">{line.debit > 0 ? formatCurrency(line.debit, settings) : '-'}</td>
                                <td className="p-2 text-right">{line.credit > 0 ? formatCurrency(line.credit, settings) : '-'}</td>
                                <td className="p-2 text-right font-bold">{formatCurrency(balance, settings)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </Card>
    );
};

const FinancialStatements: React.FC<{type: 'trial'|'income'|'balance'}> = ({ type }) => {
    const { accounts, transactions, settings } = useStore();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const balances = accounts.map(a => {
        const bal = getAccountBalance(a, transactions, undefined, date);
        return { ...a, balance: bal };
    }).filter(a => a.balance !== 0);

    const renderTrialBalance = () => {
        const totalDebit = balances.reduce((acc, curr) => acc + ((curr.type === 'Asset' || curr.type === 'Expense') ? curr.balance : 0), 0);
        const totalCredit = balances.reduce((acc, curr) => acc + ((curr.type !== 'Asset' && curr.type !== 'Expense') ? curr.balance : 0), 0);
        
        return (
            <>
                <table className="w-full text-sm mb-4">
                    <thead className="bg-gray-100 dark:bg-slate-700">
                        <tr>
                            <th className="p-2 text-left">Account</th>
                            <th className="p-2 text-right">Debit</th>
                            <th className="p-2 text-right">Credit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {balances.sort((a,b) => a.code.localeCompare(b.code)).map(a => {
                            const isDebit = a.type === 'Asset' || a.type === 'Expense';
                            return (
                                <tr key={a.id} className="border-b dark:border-slate-700">
                                    <td className="p-2">{a.code} - {a.name}</td>
                                    <td className="p-2 text-right">{isDebit ? formatCurrency(a.balance, settings) : ''}</td>
                                    <td className="p-2 text-right">{!isDebit ? formatCurrency(a.balance, settings) : ''}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                    <tfoot className="font-bold bg-gray-200 dark:bg-slate-600">
                         <tr>
                            <td className="p-2">Total</td>
                            <td className="p-2 text-right">{formatCurrency(totalDebit, settings)}</td>
                            <td className="p-2 text-right">{formatCurrency(totalCredit, settings)}</td>
                         </tr>
                    </tfoot>
                </table>
            </>
        );
    };

    const renderIncomeStatement = () => {
        const incomes = balances.filter(a => a.type === AccountType.INCOME);
        const expenses = balances.filter(a => a.type === AccountType.EXPENSE);
        const totalIncome = incomes.reduce((s, a) => s + a.balance, 0);
        const totalExpense = expenses.reduce((s, a) => s + a.balance, 0);
        const netIncome = totalIncome - totalExpense;

        return (
            <div className="space-y-6">
                <div>
                    <h4 className="font-bold border-b mb-2">Revenue</h4>
                    {incomes.map(a => <div key={a.id} className="flex justify-between py-1"><span>{a.name}</span><span>{formatCurrency(a.balance, settings)}</span></div>)}
                    <div className="flex justify-between font-bold pt-2 border-t"><span>Total Revenue</span><span>{formatCurrency(totalIncome, settings)}</span></div>
                </div>
                <div>
                    <h4 className="font-bold border-b mb-2">Expenses</h4>
                    {expenses.map(a => <div key={a.id} className="flex justify-between py-1"><span>{a.name}</span><span>{formatCurrency(a.balance, settings)}</span></div>)}
                    <div className="flex justify-between font-bold pt-2 border-t"><span>Total Expenses</span><span>{formatCurrency(totalExpense, settings)}</span></div>
                </div>
                <div className="flex justify-between font-bold text-lg bg-gray-100 dark:bg-slate-700 p-2 rounded">
                    <span>Net Income</span>
                    <span>{formatCurrency(netIncome, settings)}</span>
                </div>
            </div>
        );
    };

    const renderBalanceSheet = () => {
        const assets = balances.filter(a => a.type === AccountType.ASSET);
        const liabilities = balances.filter(a => a.type === AccountType.LIABILITY);
        const equity = balances.filter(a => a.type === AccountType.EQUITY);
        
        // Calculate Net Income for Retained Earnings
        const income = getAccountTypeBalance(transactions, accounts, AccountType.INCOME, undefined, date);
        const expense = getAccountTypeBalance(transactions, accounts, AccountType.EXPENSE, undefined, date);
        const netIncome = income - expense;

        const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
        const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0);
        const totalEquity = equity.reduce((s, a) => s + a.balance, 0) + netIncome;

        return (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                    <h4 className="font-bold border-b mb-2 text-lg">Assets</h4>
                    {assets.map(a => <div key={a.id} className="flex justify-between py-1 text-sm"><span>{a.name}</span><span>{formatCurrency(a.balance, settings)}</span></div>)}
                    <div className="flex justify-between font-bold pt-2 border-t mt-4"><span>Total Assets</span><span>{formatCurrency(totalAssets, settings)}</span></div>
                 </div>
                 <div>
                    <h4 className="font-bold border-b mb-2 text-lg">Liabilities & Equity</h4>
                    <div className="mb-4">
                        <h5 className="font-semibold text-gray-500 mb-1">Liabilities</h5>
                        {liabilities.map(a => <div key={a.id} className="flex justify-between py-1 text-sm"><span>{a.name}</span><span>{formatCurrency(a.balance, settings)}</span></div>)}
                    </div>
                    <div>
                        <h5 className="font-semibold text-gray-500 mb-1">Equity</h5>
                        {equity.map(a => <div key={a.id} className="flex justify-between py-1 text-sm"><span>{a.name}</span><span>{formatCurrency(a.balance, settings)}</span></div>)}
                        <div className="flex justify-between py-1 text-sm text-blue-600"><span>Net Income (Retained)</span><span>{formatCurrency(netIncome, settings)}</span></div>
                    </div>
                     <div className="flex justify-between font-bold pt-2 border-t mt-4"><span>Total Liab. & Equity</span><span>{formatCurrency(totalLiabilities + totalEquity, settings)}</span></div>
                 </div>
             </div>
        );
    };

    return (
        <Card title={type === 'trial' ? 'Trial Balance' : type === 'income' ? 'Income Statement' : 'Balance Sheet'}>
            <div className="flex justify-end mb-6">
                <Input type="date" label="As of" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            {type === 'trial' && renderTrialBalance()}
            {type === 'income' && renderIncomeStatement()}
            {type === 'balance' && renderBalanceSheet()}
        </Card>
    );
};

const CashFlowStatement: React.FC = () => {
    // Simple placeholder implementation as proper Cash Flow requires tagging transactions by activity type (Operating, Investing, Financing)
    return (
        <Card title="Statement of Cash Flows">
            <div className="p-8 text-center text-gray-500">
                <Cloud size={48} className="mx-auto mb-4 opacity-50"/>
                <p>Cash Flow Statement generation requires advanced transaction tagging which is available in the Enterprise version.</p>
                <p className="text-xs mt-2">Currently available reports: Balance Sheet, Income Statement, Trial Balance.</p>
            </div>
        </Card>
    );
};

const RatioAnalysis: React.FC = () => {
    const { accounts, transactions } = useStore();
    
    // Calculate totals
    const assets = getAccountTypeBalance(transactions, accounts, AccountType.ASSET);
    const liabilities = getAccountTypeBalance(transactions, accounts, AccountType.LIABILITY);
    const equity = getAccountTypeBalance(transactions, accounts, AccountType.EQUITY);
    const income = getAccountTypeBalance(transactions, accounts, AccountType.INCOME);
    const expenses = getAccountTypeBalance(transactions, accounts, AccountType.EXPENSE);
    const netIncome = income - expenses;

    const currentRatio = liabilities > 0 ? (assets / liabilities).toFixed(2) : 'N/A';
    const debtToEquity = equity > 0 ? (liabilities / equity).toFixed(2) : 'N/A';
    const profitMargin = income > 0 ? ((netIncome / income) * 100).toFixed(2) + '%' : '0%';
    const roa = assets > 0 ? ((netIncome / assets) * 100).toFixed(2) + '%' : '0%';

    return (
        <Card title="Financial Ratios">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="bg-blue-50 dark:bg-slate-700 p-4 rounded-lg">
                     <p className="text-sm text-gray-500 dark:text-gray-300">Current Ratio</p>
                     <p className="text-2xl font-bold text-blue-600">{currentRatio}</p>
                     <p className="text-xs text-gray-400">Assets / Liabilities</p>
                 </div>
                 <div className="bg-red-50 dark:bg-slate-700 p-4 rounded-lg">
                     <p className="text-sm text-gray-500 dark:text-gray-300">Debt to Equity</p>
                     <p className="text-2xl font-bold text-red-600">{debtToEquity}</p>
                     <p className="text-xs text-gray-400">Liabilities / Equity</p>
                 </div>
                 <div className="bg-green-50 dark:bg-slate-700 p-4 rounded-lg">
                     <p className="text-sm text-gray-500 dark:text-gray-300">Net Profit Margin</p>
                     <p className="text-2xl font-bold text-green-600">{profitMargin}</p>
                     <p className="text-xs text-gray-400">Net Income / Revenue</p>
                 </div>
                 <div className="bg-purple-50 dark:bg-slate-700 p-4 rounded-lg">
                     <p className="text-sm text-gray-500 dark:text-gray-300">Return on Assets</p>
                     <p className="text-2xl font-bold text-purple-600">{roa}</p>
                     <p className="text-xs text-gray-400">Net Income / Assets</p>
                 </div>
            </div>
        </Card>
    );
};

const AgedReceivables: React.FC = () => {
    const { accounts, transactions, settings } = useStore();
    const arAccounts = accounts.filter(a => a.name.toLowerCase().includes('receivable') || a.code.startsWith('101'));
    
    return (
        <Card title="Aged Receivables Summary">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-slate-700">
                        <tr>
                            <th className="p-2 text-left">Customer / Account</th>
                            <th className="p-2 text-right">Current Balance</th>
                            <th className="p-2 text-right">0-30 Days</th>
                            <th className="p-2 text-right">31-60 Days</th>
                            <th className="p-2 text-right">60+ Days</th>
                        </tr>
                    </thead>
                    <tbody>
                         {arAccounts.map(acc => {
                             const balance = getAccountBalance(acc, transactions);
                             if (balance === 0) return null;
                             return (
                                 <tr key={acc.id} className="border-b dark:border-slate-700">
                                     <td className="p-2">{acc.name}</td>
                                     <td className="p-2 text-right font-bold">{formatCurrency(balance, settings)}</td>
                                     <td className="p-2 text-right">{formatCurrency(balance, settings)}</td>
                                     <td className="p-2 text-right">-</td>
                                     <td className="p-2 text-right">-</td>
                                 </tr>
                             );
                         })}
                         {arAccounts.length === 0 && <tr><td colSpan={5} className="p-4 text-center">No Receivable Accounts Found</td></tr>}
                    </tbody>
                </table>
                <p className="text-xs text-gray-500 mt-4">* Detailed aging requires invoice-level tracking which is not available in this simplified transaction model.</p>
            </div>
        </Card>
    );
};

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetData, restoreData, currentUser } = useStore();
  const isViewer = currentUser?.role === 'viewer';
  const [file, setFile] = useState<File | null>(null);
  const [gLoading, setGLoading] = useState(false);
  const [loadingRate, setLoadingRate] = useState(false);

  // --- Exchange Rate Logic ---
  const fetchExchangeRate = async (currency: string) => {
    if (currency === 'USD') return 1;
    setLoadingRate(true);
    try {
        // Try to fetch from a free API
        const response = await fetch(`https://open.er-api.com/v6/latest/USD`);
        const data = await response.json();
        const rate = data.rates[currency];
        return rate || 1;
    } catch (e) {
        console.warn("API Fetch failed, using fallback rates");
        const fallbackRates: {[key: string]: number} = {
            'PKR': 278.50,
            'JPY': 150.10,
            'CNY': 7.19,
            'AED': 3.67,
            'SAR': 3.75,
            'USD': 1
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
      // Fetch new rate automatically
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
          if (!authInstance.isSignedIn.get()) {
              await authInstance.signIn();
          }

          const data = localStorage.getItem('proAccountingData');
          if (!data) throw new Error("No data to save");

          const fileContent = data;
          const fileName = `pro_accounting_backup_${new Date().toISOString().split('T')[0]}.json`;
          
          const file = new Blob([fileContent], {type: 'application/json'});
          const metadata = {
              'name': fileName,
              'mimeType': 'application/json'
          };

          const accessToken = gapi.auth.getToken().access_token;
          const form = new FormData();
          form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
          form.append('file', file);

          await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
              method: 'POST',
              headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
              body: form
          });

          alert("Backup uploaded to Google Drive successfully!");

      } catch (error) {
          console.error(error);
          alert("Failed to upload to Google Drive");
      } finally {
          setGLoading(false);
      }
  };

  const handleGDriveImport = async () => {
      setGLoading(true);
      const initialized = await initGapi();
      if (!initialized) { setGLoading(false); return; }

      try {
          const authInstance = gapi.auth2.getAuthInstance();
          if (!authInstance.isSignedIn.get()) {
              await authInstance.signIn();
          }

          // 1. List files
          const response = await gapi.client.drive.files.list({
              'pageSize': 10,
              'fields': "nextPageToken, files(id, name)",
              'q': "name contains 'pro_accounting_backup' and trashed = false",
              'orderBy': 'createdTime desc'
          });

          const files = response.result.files;
          if (files && files.length > 0) {
              const fileId = files[0].id; // Get most recent
              if (confirm(`Found backup: ${files[0].name}. Restore this file?`)) {
                  // 2. Download file content
                  const fileResp = await gapi.client.drive.files.get({
                      fileId: fileId,
                      alt: 'media'
                  });
                  
                  const success = restoreData(JSON.stringify(fileResp.result)); 
                  if (success) {
                      alert("Data restored from Google Drive!");
                      window.location.reload();
                  } else {
                      alert("Failed to parse backup file.");
                  }
              }
          } else {
              alert("No backup files found in Drive.");
          }

      } catch (error) {
          console.error(error);
          alert("Failed to restore from Google Drive");
      } finally {
          setGLoading(false);
      }
  };

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
            <Input label="Company Name" value={settings.companyName} onChange={e => updateSettings({...settings, companyName: e.target.value})} disabled={isViewer} />
            <Select label="Currency" value={settings.currency} onChange={handleCurrencyChange} disabled={isViewer}>
               {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.sign})</option>)}
            </Select>
            <Select label="Language" value={settings.language} onChange={e => updateSettings({...settings, language: e.target.value})} disabled={isViewer}>
               {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </Select>
            <Select label="Theme" value={settings.theme} onChange={e => updateSettings({...settings, theme: e.target.value as 'light'|'dark'})}>
               <option value="light">Light</option>
               <option value="dark">Dark</option>
            </Select>
            <div className="col-span-2 md:col-span-1 relative">
                <Input 
                    label={`Exchange Rate (1 USD = ? ${settings.currency})`} 
                    type="number" 
                    step="0.01"
                    value={settings.exchangeRate || 1} 
                    onChange={e => updateSettings({...settings, exchangeRate: parseFloat(e.target.value)})} 
                    disabled={isViewer || settings.currency === 'USD'} 
                />
                {loadingRate && <div className="absolute right-3 top-9"><Loader className="animate-spin text-blue-500" size={16}/></div>}
            </div>
         </div>
      </Card>
      
      {!isViewer ? (
      <>
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
                <div className="pt-4 border-t">
                <Button onClick={() => {if(confirm('Reset all data? This cannot be undone.')) resetData()}} variant="danger">Reset Application Data</Button>
                </div>
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

const SidebarItem: React.FC<{ to: string; icon: React.ReactNode; label: string; active: boolean; collapsed: boolean; onClick?: () => void }> = ({ to, icon, label, active, collapsed, onClick }) => (
  <Link to={to} onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} ${collapsed ? 'justify-center px-2' : ''}`}>
    {icon}
    {!collapsed && <span className="font-medium">{label}</span>}
  </Link>
);

const AppContent: React.FC = () => {
    const { settings, users, currentUser, setCurrentUser } = useStore();
    const isViewer = currentUser?.role === 'viewer';
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [reportsOpen, setReportsOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    // Close sidebar on route change on mobile
    useEffect(() => {
        setSidebarOpen(false);
    }, [location]);

    // Handle RTL for Arabic
    useEffect(() => {
      document.body.dir = settings.language === 'Arabic' ? 'rtl' : 'ltr';
    }, [settings.language]);

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-slate-900 transition-colors duration-200 font-sans">
             {/* Mobile Sidebar Overlay */}
             {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

             {/* Sidebar */}
             <aside className={`fixed lg:static inset-y-0 left-0 ${collapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white transform transition-all duration-300 z-30 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
                <div className={`p-6 border-b border-slate-800 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                           <FileText size={20} className="text-white" />
                        </div>
                        {!collapsed && <h1 className="font-bold text-xl tracking-tight">Pro Books</h1>}
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    <SidebarItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" active={isActive('/')} collapsed={collapsed} />
                    <SidebarItem to="/transactions" icon={<BookOpen size={20} />} label="Transactions" active={isActive('/transactions')} collapsed={collapsed} />
                    <SidebarItem to="/accounts" icon={<ClipboardList size={20} />} label="Chart of Accounts" active={isActive('/accounts')} collapsed={collapsed} />
                    
                    {!collapsed && <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reports</div>}
                    {collapsed && <div className="h-4"></div>}
                    
                    <button onClick={() => setReportsOpen(!reportsOpen)} className={`w-full flex items-center justify-between px-4 py-3 rounded-md transition-colors ${location.pathname.startsWith('/reports') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} ${collapsed ? 'justify-center px-2' : ''}`}>
                        <div className="flex items-center gap-3">
                           <PieChart size={20} />
                           {!collapsed && <span className="font-medium">Financial Reports</span>}
                        </div>
                        {!collapsed && (reportsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                    </button>
                    {reportsOpen && !collapsed && (
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

                    {!collapsed && <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">System</div>}
                    {collapsed && <div className="h-4"></div>}
                    <SidebarItem to="/settings" icon={<Settings size={20} />} label="Settings" active={isActive('/settings')} collapsed={collapsed} />
                    <SidebarItem to="/help" icon={<HelpCircle size={20} />} label="Help & Support" active={isActive('/help')} collapsed={collapsed} />
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className={`flex items-center gap-3 px-2 mb-2 ${collapsed ? 'justify-center' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${currentUser?.role === 'admin' ? 'bg-gradient-to-tr from-blue-500 to-purple-500' : 'bg-gradient-to-tr from-gray-500 to-slate-500'}`}>
                            {currentUser?.username.slice(0, 2).toUpperCase()}
                        </div>
                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{currentUser?.username}</p>
                                <p className="text-xs text-slate-500 truncate capitalize">{currentUser?.role}</p>
                            </div>
                        )}
                    </div>
                    {/* User Switcher for Demo */}
                    {!collapsed && (
                        <div className="px-2">
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

             {/* Main Content */}
             <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="bg-white dark:bg-slate-800 shadow-sm z-10">
                    <div className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                             <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                 <Menu size={24} />
                             </button>
                             <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:block text-gray-500 hover:text-gray-700 dark:text-gray-400">
                                 {collapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
                             </button>
                             <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                                {location.pathname === '/' ? 'Dashboard' : 
                                 location.pathname.startsWith('/reports') ? 'Financial Reports' :
                                 location.pathname.replace('/', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                             </h2>
                             {isViewer && (
                               <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                 <Eye size={12} /> Viewer Mode
                               </span>
                             )}
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
                        <Route path="/help" element={<HelpPage />} />
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