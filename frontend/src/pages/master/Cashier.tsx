import React, { memo, useMemo, useState } from 'react';
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Calendar,
  BarChart3,
  Wallet,
  CreditCard,
  Smartphone,
  Clock,
  History,
  Package
} from 'lucide-react';
import { t } from '@/lib/transliteration';
import { formatCurrency } from '@/lib/utils';
import { useTransactions, useTransactionSummary } from '@/hooks/useTransactions';
import { TransactionResponse } from '@/types';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import IncomeModal from '@/components/IncomeModal';
import ExpenseModal from '@/components/ExpenseModal';
import MonthlyHistoryModal from '@/components/MonthlyHistoryModal';
import MonthlyResetModal from '@/components/MonthlyResetModal';
import UserStatsModal from '@/components/UserStatsModal';
import CashierSkeleton from '@/components/CashierSkeleton';
import { useTheme } from '@/contexts/ThemeContext';

const MasterCashier: React.FC = memo(() => {
  const { isDarkMode } = useTheme();
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isUserStatsModalOpen, setIsUserStatsModalOpen] = useState(false);
  const [userStatsType, setUserStatsType] = useState<'income' | 'expense' | 'balance'>('income');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [currency, setCurrency] = useState<'UZS' | 'USD'>('UZS'); // Currency toggle state
  const [usdRate, setUsdRate] = useState<number>(12700); // Dollar kursi (dinamik)
  const [isLoadingRate, setIsLoadingRate] = useState(false);

  const language = useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // Dollar kursini olish (CBU API)
  React.useEffect(() => {
    const fetchUsdRate = async () => {
      try {
        setIsLoadingRate(true);
        // O'zbekiston Markaziy Banki API
        const response = await fetch('https://cbu.uz/uz/arkhiv-kursov-valyut/json/');
        const data = await response.json();
        
        // USD kursini topish (kod: 840)
        const usdData = data.find((item: any) => item.Ccy === 'USD');
        if (usdData) {
          setUsdRate(parseFloat(usdData.Rate));
          console.log('Dollar kursi yangilandi:', usdData.Rate);
        }
      } catch (error) {
        console.error('Dollar kursini olishda xatolik:', error);
        // Xatolik bo'lsa, default qiymat ishlatiladi (12700)
      } finally {
        setIsLoadingRate(false);
      }
    };

    fetchUsdRate();
    
    // Har 1 soatda bir marta yangilanadi
    const interval = setInterval(fetchUsdRate, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Get date range for filter - useMemo bilan optimizatsiya
  const dateRange = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateFilter) {
      case 'today':
        return {
          startDate: today.toISOString(),
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'week':
        const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return {
          startDate: weekStart.toISOString(),
          endDate: new Date().toISOString()
        };
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          startDate: monthStart.toISOString(),
          endDate: new Date().toISOString()
        };
      default:
        return {};
    }
  }, [dateFilter]);

  // React Query hooks - cache'dan instant yuklash
  const { data: transactionsData, isLoading: isTransactionsLoading } = useTransactions({
    type: filter === 'all' ? undefined : filter,
    ...dateRange
  });
  const { data: summaryData, isLoading: isSummaryLoading } = useTransactionSummary();
  
  // Loading state - faqat birinchi marta va cache bo'sh bo'lsa skeleton ko'rsatamiz
  // Agar cache'da ma'lumot bo'lsa (data mavjud), skeleton ko'rsatmaymiz
  const isInitialLoading = (isTransactionsLoading && !transactionsData) || (isSummaryLoading && !summaryData);
  
  // Memoized data - qayta hisoblashni oldini olish
  const transactions = useMemo(() => 
    (transactionsData as TransactionResponse)?.transactions || [], 
    [transactionsData]
  );
  
  const summary = useMemo(() => 
    summaryData?.summary || {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      incomeCount: 0,
      expenseCount: 0,
      incomeCash: 0,
      incomeCard: 0,
      expenseCash: 0,
      expenseCard: 0,
      balanceCash: 0,
      balanceCard: 0,
      byUser: [],
      total: {
        income: { cash: 0, card: 0, click: 0, total: 0, count: 0 },
        expense: { cash: 0, card: 0, click: 0, total: 0, count: 0 },
        balance: { cash: 0, card: 0, click: 0, total: 0 }
      }
    }, 
    [summaryData]
  );

  // Hozirgi user ma'lumotlari
  const currentUser = useMemo(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, []);

  // User bo'yicha statistika
  // Memoized helper functions - qayta yaratilishni oldini olish
  const getPaymentMethodIcon = useMemo(() => (method: string) => {
    switch (method) {
      case 'cash': return <Wallet className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'click': return <Smartphone className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  }, []);

  const getPaymentMethodText = useMemo(() => (method: string) => {
    switch (method) {
      case 'cash': return t('Naqd', language);
      case 'card': return t('Karta', language);
      case 'click': return 'Click';
      default: return method;
    }
  }, [language]);

  // Currency conversion helper
  const convertCurrency = (amount: number) => {
    if (currency === 'USD') {
      return amount / usdRate;
    }
    return amount;
  };

  // Format currency with symbol
  const formatWithCurrency = (amount: number) => {
    const converted = convertCurrency(amount);
    if (currency === 'USD') {
      return `$${converted.toFixed(2)}`;
    }
    return formatCurrency(amount, language);
  };

  const handleMonthlyReset = async () => {
    try {
      const { transactionApi } = await import('@/lib/api');
      await transactionApi.resetMonthlyEarnings();
    } catch (error: any) {
      console.error('Reset xatosi:', error);
      throw error;
    }
  };

  const handleOpenUserStats = (type: 'income' | 'expense' | 'balance') => {
    setUserStatsType(type);
    setIsUserStatsModalOpen(true);
  };

  // Agar birinchi marta loading bo'lsa va cache bo'sh bo'lsa, skeleton ko'rsatamiz
  // Cache'da ma'lumot bo'lsa, darhol real ma'lumotlarni ko'rsatamiz
  if (isInitialLoading) {
    return <CashierSkeleton />;
  }

  return (
    <div className={`min-h-screen p-4 sm:p-6 lg:p-8 ${
      isDarkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40'
    }`}>
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6 animate-fade-in">
        {/* Header Section - Ultra Modern */}
        <div className={`relative overflow-hidden rounded-3xl shadow-2xl border ${
          isDarkMode
            ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
            : 'bg-white border-gray-100/50'
        }`}>
          {/* Animated Background Gradients */}
          <div className={`absolute inset-0 ${
            isDarkMode
              ? 'bg-gradient-to-br from-red-500/5 via-red-600/5 to-gray-900/5'
              : 'bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5'
          }`}></div>
          <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl animate-pulse ${
            isDarkMode
              ? 'bg-gradient-to-br from-red-400/20 to-red-600/20'
              : 'bg-gradient-to-br from-blue-400/20 to-indigo-400/20'
          }`}></div>
          <div className={`absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl animate-pulse ${
            isDarkMode
              ? 'bg-gradient-to-br from-red-600/20 to-gray-900/20'
              : 'bg-gradient-to-br from-indigo-400/20 to-purple-400/20'
          }`} style={{ animationDelay: '1s' }}></div>
          
          <div className="relative z-10 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="relative group">
                  <div className={`absolute inset-0 rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-red-600 to-red-700'
                      : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  }`}></div>
                  <div className={`relative p-4 rounded-2xl shadow-xl transform group-hover:scale-105 transition-transform ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-red-600 via-red-700 to-gray-900'
                      : 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600'
                  }`}>
                    <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black mb-1 ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-white via-red-200 to-red-300 bg-clip-text text-transparent'
                      : 'bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent'
                  }`}>
                    {t("Kassa", language)}
                  </h1>
                  <p className={`text-sm sm:text-base font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>{t("Kirim va chiqimlarni boshqarish", language)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 w-full lg:grid-cols-3 lg:w-auto lg:ml-auto">
                <Link 
                  to="/app/master/warehouse"
                  className={`group relative overflow-hidden px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-1.5 sm:gap-2 justify-center ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700'
                      : 'bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 relative z-10 flex-shrink-0" />
                  <span className="relative z-10 truncate">{t('Ombor', language)}</span>
                </Link>
                <button
                  onClick={() => setIsResetModalOpen(true)}
                  className={`group relative overflow-hidden px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-1.5 sm:gap-2 justify-center ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-red-600 via-red-700 to-pink-700'
                      : 'bg-gradient-to-r from-red-500 via-red-600 to-pink-600'
                  }`}
                  title={t("Barcha daromadlarni 0 ga qaytarish", language)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 relative z-10 flex-shrink-0" />
                  <span className="relative z-10 truncate">{t('Oylik Reset', language)}</span>
                </button>
                <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  className={`group relative overflow-hidden px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-1.5 sm:gap-2 justify-center ${
                    isDarkMode
                      ? 'bg-gray-800 border-2 border-red-900/30 text-gray-300 hover:border-red-700'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-400'
                  }`}
                  title={t("Oylik tarix", language)}
                >
                  <History className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors flex-shrink-0 ${
                    isDarkMode ? 'group-hover:text-red-400' : 'group-hover:text-blue-600'
                  }`} />
                  <span className={`transition-colors truncate ${
                    isDarkMode ? 'group-hover:text-red-400' : 'group-hover:text-blue-600'
                  }`}>{t('Tarix', language)}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards - Premium Design */}
          <div className="relative z-10 px-6 sm:px-8 lg:px-10 pb-6 sm:pb-8 lg:pb-10">
          
          {/* Currency Toggle - Yangi qo'shildi */}
          <div className="flex justify-end mb-3">
            <div className="flex flex-col items-end gap-1">
              {/* Kurs ko'rsatkichi */}
              <div className={`text-xs font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {isLoadingRate ? (
                  <span className="animate-pulse">{t('Yuklanmoqda...', language)}</span>
                ) : (
                  <span>1 USD = {usdRate.toLocaleString('uz-UZ')} {t('so\'m', language)}</span>
                )}
              </div>
              
              {/* Toggle buttons */}
              <div className={`inline-flex rounded-lg p-0.5 shadow-md ${
                isDarkMode ? 'bg-gray-800 border border-red-900/30' : 'bg-white border border-gray-200'
              }`}>
                <button
                  onClick={() => setCurrency('UZS')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-300 ${
                    currency === 'UZS'
                      ? isDarkMode
                        ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900 text-white shadow-lg scale-105'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                      : isDarkMode
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  UZS (so'm)
                </button>
                <button
                  onClick={() => setCurrency('USD')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-300 ${
                    currency === 'USD'
                      ? isDarkMode
                        ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900 text-white shadow-lg scale-105'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                      : isDarkMode
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </div>
          </div>
          
          {/* Action Buttons - Faqat mobil uchun birinchi (lg:hidden) */}
          <div className="grid grid-cols-2 gap-3 mb-5 lg:hidden">
            {/* KIRIM Button */}
            <button
              onClick={() => setIsIncomeModalOpen(true)}
              className={`group relative overflow-hidden text-white rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-green-600 via-green-700 to-emerald-700'
                  : 'bg-gradient-to-br from-green-500 via-green-600 to-emerald-600'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <div className="relative z-10 flex items-center justify-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm font-bold">{t('KIRIM', language)}</span>
              </div>
            </button>

            {/* CHIQIM Button */}
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className={`group relative overflow-hidden text-white rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-red-600 via-red-700 to-pink-700'
                  : 'bg-gradient-to-br from-red-500 via-red-600 to-pink-600'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <div className="relative z-10 flex items-center justify-center gap-2">
                <TrendingDown className="h-5 w-5" />
                <span className="text-sm font-bold">{t('CHIQIM', language)}</span>
              </div>
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* KIRIM CARD */}
            <div 
              onClick={() => handleOpenUserStats('income')}
              className={`relative overflow-hidden rounded-xl p-4 border hover:shadow-lg transition-all cursor-pointer hover:scale-105 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-800'
                  : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${
                  isDarkMode ? 'bg-green-600' : 'bg-green-500'
                }`}>
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  isDarkMode
                    ? 'text-green-300 bg-green-900/60'
                    : 'text-green-700 bg-green-100'
                }`}>
                  {t('Kirim', language)}
                </span>
              </div>
              
              <div className="mb-3">
                <p className={`text-xs mb-1 ${
                  isDarkMode ? 'text-green-400' : 'text-green-600'
                }`}>{t('Umumiy', language)}</p>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-green-300' : 'text-green-900'
                }`}>
                  {formatWithCurrency(summary.total?.income.total || summary.totalIncome)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className={`rounded-lg p-2 ${
                  isDarkMode ? 'bg-gray-800/60' : 'bg-white/60'
                }`}>
                  <p className={`text-xs mb-0.5 ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>{t('Naqd', language)}</p>
                  <div className={`text-sm font-bold ${
                    isDarkMode ? 'text-green-300' : 'text-green-900'
                  }`}>
                    {formatWithCurrency(summary.total?.income.cash || summary.incomeCash || 0)}
                  </div>
                </div>
                
                <div className={`rounded-lg p-2 ${
                  isDarkMode ? 'bg-gray-800/60' : 'bg-white/60'
                }`}>
                  <p className={`text-xs mb-0.5 ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>{t('Karta', language)}</p>
                  <div className={`text-sm font-bold ${
                    isDarkMode ? 'text-green-300' : 'text-green-900'
                  }`}>
                    {formatWithCurrency(summary.total?.income.card || summary.incomeCard || 0)}
                  </div>
                </div>
              </div>
              
              
              <p className={`text-xs pt-2 border-t ${
                isDarkMode
                  ? 'text-green-400 border-green-800'
                  : 'text-green-600 border-green-200'
              }`}>
                {summary.total?.income.count || summary.incomeCount} {t('ta', language)}
              </p>
            </div>

            {/* CHIQIM CARD */}
            <div 
              onClick={() => handleOpenUserStats('expense')}
              className={`relative overflow-hidden rounded-xl p-4 border hover:shadow-lg transition-all cursor-pointer hover:scale-105 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-red-900/40 to-pink-900/40 border-red-800'
                  : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${
                  isDarkMode ? 'bg-red-600' : 'bg-red-500'
                }`}>
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  isDarkMode
                    ? 'text-red-300 bg-red-900/60'
                    : 'text-red-700 bg-red-100'
                }`}>
                  {t('Chiqim', language)}
                </span>
              </div>
              
              <div className="mb-3">
                <p className={`text-xs mb-1 ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>{t('Umumiy', language)}</p>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-red-300' : 'text-red-900'
                }`}>
                  {formatWithCurrency(summary.total?.expense.total || summary.totalExpense)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className={`rounded-lg p-2 ${
                  isDarkMode ? 'bg-gray-800/60' : 'bg-white/60'
                }`}>
                  <p className={`text-xs mb-0.5 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>{t('Naqd', language)}</p>
                  <div className={`text-sm font-bold ${
                    isDarkMode ? 'text-red-300' : 'text-red-900'
                  }`}>
                    {formatWithCurrency(summary.total?.expense.cash || summary.expenseCash || 0)}
                  </div>
                </div>
                
                <div className={`rounded-lg p-2 ${
                  isDarkMode ? 'bg-gray-800/60' : 'bg-white/60'
                }`}>
                  <p className={`text-xs mb-0.5 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>{t('Karta', language)}</p>
                  <div className={`text-sm font-bold ${
                    isDarkMode ? 'text-red-300' : 'text-red-900'
                  }`}>
                    {formatWithCurrency(summary.total?.expense.card || summary.expenseCard || 0)}
                  </div>
                </div>
              </div>
              
              
              <p className={`text-xs pt-2 border-t ${
                isDarkMode
                  ? 'text-red-400 border-red-800'
                  : 'text-red-600 border-red-200'
              }`}>
                {summary.total?.expense.count || summary.expenseCount} {t('ta', language)}
              </p>
            </div>

            {/* BALANS CARD */}
            <div 
              onClick={() => handleOpenUserStats('balance')}
              className={`relative overflow-hidden rounded-xl p-4 border hover:shadow-lg transition-all cursor-pointer hover:scale-105 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-blue-800'
                  : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${
                  isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
                }`}>
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  isDarkMode
                    ? 'text-blue-300 bg-blue-900/60'
                    : 'text-blue-700 bg-blue-100'
                }`}>
                  {t('Balans', language)}
                </span>
              </div>
              
              <div className="mb-3">
                <p className={`text-xs mb-1 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>{t('Umumiy', language)}</p>
                <div className={`text-2xl font-bold ${
                  (summary.total?.balance.total || summary.balance) >= 0 
                    ? isDarkMode ? 'text-green-400' : 'text-green-900'
                    : isDarkMode ? 'text-red-400' : 'text-red-900'
                }`}>
                  {formatWithCurrency(summary.total?.balance.total || summary.balance)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className={`rounded-lg p-2 ${
                  isDarkMode ? 'bg-gray-800/60' : 'bg-white/60'
                }`}>
                  <p className={`text-xs mb-0.5 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>{t('Naqd', language)}</p>
                  <div className={`text-sm font-bold ${
                    (summary.total?.balance.cash || summary.balanceCash || 0) >= 0 
                      ? isDarkMode ? 'text-green-400' : 'text-green-900'
                      : isDarkMode ? 'text-red-400' : 'text-red-900'
                  }`}>
                    {formatWithCurrency(summary.total?.balance.cash || summary.balanceCash || 0)}
                  </div>
                </div>
                
                <div className={`rounded-lg p-2 ${
                  isDarkMode ? 'bg-gray-800/60' : 'bg-white/60'
                }`}>
                  <p className={`text-xs mb-0.5 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>{t('Karta', language)}</p>
                  <div className={`text-sm font-bold ${
                    (summary.total?.balance.card || summary.balanceCard || 0) >= 0 
                      ? isDarkMode ? 'text-green-400' : 'text-green-900'
                      : isDarkMode ? 'text-red-400' : 'text-red-900'
                  }`}>
                    {formatWithCurrency(summary.total?.balance.card || summary.balanceCard || 0)}
                  </div>
                </div>
              </div>
              
              
              <p className={`text-xs pt-2 border-t ${
                (summary.total?.balance.total || summary.balance) >= 0 
                  ? isDarkMode 
                    ? 'text-green-400 border-blue-800'
                    : 'text-green-600 border-blue-200'
                  : isDarkMode
                    ? 'text-red-400 border-blue-800'
                    : 'text-red-600 border-blue-200'
              }`}>
                {(summary.total?.balance.total || summary.balance) >= 0 ? t('Ijobiy', language) : t('Salbiy', language)}
              </p>
            </div>
          </div>
          </div>

          {/* Action Buttons - Faqat desktop uchun */}
          <div className="relative z-10 px-6 sm:px-8 lg:px-10 pb-6 sm:pb-8 lg:pb-10 hidden lg:block">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* KIRIM Button */}
            <button
              onClick={() => setIsIncomeModalOpen(true)}
              className={`group relative overflow-hidden text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${
                isDarkMode
                  ? 'bg-gradient-to-br from-green-600 to-emerald-700'
                  : 'bg-gradient-to-br from-green-500 to-emerald-600'
              }`}
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <TrendingUp className="h-8 w-8" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-2xl font-bold mb-1">{t("KIRIM", language)}</h2>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-green-200' : 'text-green-100'
                    }`}>{t("Pul kirimi qo'shish", language)}</p>
                  </div>
                </div>
                <Plus className="h-6 w-6" />
              </div>
            </button>

            {/* CHIQIM Button */}
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className={`group relative overflow-hidden text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${
                isDarkMode
                  ? 'bg-gradient-to-br from-red-600 to-pink-700'
                  : 'bg-gradient-to-br from-red-500 to-pink-600'
              }`}
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <TrendingDown className="h-8 w-8" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-2xl font-bold mb-1">{t("CHIQIM", language)}</h2>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-red-200' : 'text-red-100'
                    }`}>{t("Xarajat belgilash", language)}</p>
                  </div>
                </div>
                <Plus className="h-6 w-6" />
              </div>
            </button>
          </div>
          </div>
        </div>

        {/* Recent Transactions - Modern Card */}
        <div className={`relative overflow-hidden rounded-3xl shadow-2xl border p-5 sm:p-7 ${
          isDarkMode
            ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
            : 'bg-white border-gray-100/50'
        }`}>
          {/* Subtle Background Pattern */}
          <div className={`absolute inset-0 ${
            isDarkMode
              ? 'bg-gradient-to-br from-red-500/5 to-transparent'
              : 'bg-gradient-to-br from-gray-50/50 to-transparent'
          }`}></div>
          
          <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h3 className={`text-xl sm:text-2xl font-black flex items-center gap-3 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <div className={`p-2 rounded-xl ${
                isDarkMode
                  ? 'bg-gradient-to-br from-red-600 via-red-700 to-gray-900'
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600'
              }`}>
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              {t("So'nggi transaksiyalar", language)}
            </h3>
            
            {/* Filters - Enhanced */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <div className={`flex gap-2 p-1 rounded-xl ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 text-xs sm:text-sm rounded-lg font-semibold transition-all duration-300 ${
                    filter === 'all'
                      ? isDarkMode
                        ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900 text-white shadow-md scale-105'
                        : 'bg-white text-blue-600 shadow-md scale-105'
                      : isDarkMode
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('Barchasi', language)}
                </button>
                <button
                  onClick={() => setFilter('income')}
                  className={`px-4 py-2 text-xs sm:text-sm rounded-lg font-semibold transition-all duration-300 ${
                    filter === 'income'
                      ? isDarkMode
                        ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-md scale-105'
                        : 'bg-white text-green-600 shadow-md scale-105'
                      : isDarkMode
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('Kirim', language)}
                </button>
                <button
                  onClick={() => setFilter('expense')}
                  className={`px-4 py-2 text-xs sm:text-sm rounded-lg font-semibold transition-all duration-300 ${
                    filter === 'expense'
                      ? isDarkMode
                        ? 'bg-gradient-to-r from-red-600 to-pink-700 text-white shadow-md scale-105'
                        : 'bg-white text-red-600 shadow-md scale-105'
                      : isDarkMode
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('Chiqim', language)}
                </button>
              </div>
              
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className={`px-4 py-2 text-xs sm:text-sm border-2 rounded-xl focus:outline-none focus:ring-2 font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 border-red-900/30 text-white focus:ring-red-500 focus:border-red-500 hover:border-red-700'
                    : 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500 focus:border-transparent hover:border-gray-300'
                }`}
              >
                <option value="today">{t('Bugun', language)}</option>
                <option value="week">{t('Bu hafta', language)}</option>
                <option value="month">{t('Bu oy', language)}</option>
                <option value="all">{t('Barchasi', language)}</option>
              </select>
            </div>
          </div>

          {/* Transactions List - Enhanced */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {transactions.length === 0 ? (
              <div className="text-center py-12 md:col-span-2">
                <div className="relative inline-block mb-4">
                  <div className={`absolute inset-0 rounded-full blur-xl opacity-50 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}></div>
                  <div className={`relative p-5 rounded-full ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-gray-800 to-gray-900'
                      : 'bg-gradient-to-br from-gray-100 to-gray-200'
                  }`}>
                    <DollarSign className={`h-12 w-12 ${
                      isDarkMode ? 'text-gray-600' : 'text-gray-400'
                    }`} />
                  </div>
                </div>
                <p className={`text-base font-semibold mb-2 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>{t('Transaksiyalar yo\'q', language)}</p>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {t('Kirim yoki chiqim qo\'shing', language)}
                </p>
              </div>
            ) : (
              transactions.slice(0, 10).map((transaction: any) => (
                <div 
                  key={transaction._id} 
                  className={`group relative overflow-hidden rounded-xl p-3 sm:p-4 border-2 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${
                    isDarkMode
                      ? transaction.type === 'income'
                        ? 'border-green-900/30 bg-gradient-to-r from-green-900/20 via-emerald-900/10 to-transparent hover:border-green-700'
                        : 'border-red-900/30 bg-gradient-to-r from-red-900/20 via-pink-900/10 to-transparent hover:border-red-700'
                      : transaction.type === 'income' 
                        ? 'border-green-200 bg-gradient-to-r from-green-50 via-emerald-50/50 to-transparent hover:border-green-300' 
                        : 'border-red-200 bg-gradient-to-r from-red-50 via-pink-50/50 to-transparent hover:border-red-300'
                  }`}
                >
                  {/* Decorative Border */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    transaction.type === 'income' ? 'bg-gradient-to-b from-green-500 to-emerald-600' : 'bg-gradient-to-b from-red-500 to-pink-600'
                  }`}></div>
                  
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg shadow-md group-hover:shadow-lg transition-shadow flex-shrink-0 ${
                        transaction.type === 'income' ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-pink-600'
                      }`}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        ) : (
                          <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-bold text-sm sm:text-base truncate ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {transaction.category}
                          </h4>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full flex-shrink-0 ${
                            isDarkMode
                              ? transaction.type === 'income'
                                ? 'bg-green-900/60 text-green-300 border border-green-700'
                                : 'bg-red-900/60 text-red-300 border border-red-700'
                              : transaction.type === 'income' 
                                ? 'bg-green-100 text-green-700 border border-green-200' 
                                : 'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                            {transaction.type === 'income' ? t('Kirim', language) : t('Chiqim', language)}
                          </span>
                        </div>
                        <p className={`text-xs mb-2 line-clamp-1 font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {transaction.description}
                        </p>
                        <div className={`flex items-center gap-2 text-[10px] flex-wrap ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded ${
                            isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'
                          }`}>
                            <Calendar className="h-3 w-3" />
                            {format(new Date(transaction.createdAt), 'dd.MM.yyyy')}
                          </span>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded ${
                            isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'
                          }`}>
                            {getPaymentMethodIcon(transaction.paymentMethod)}
                            {getPaymentMethodText(transaction.paymentMethod)}
                          </span>
                          {transaction.createdBy && typeof transaction.createdBy === 'object' && (
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded font-semibold ${
                              transaction.createdBy._id === currentUser?._id
                                ? isDarkMode
                                  ? 'bg-blue-900/60 text-blue-300 border border-blue-700'
                                  : 'bg-blue-100 text-blue-700 border border-blue-200'
                                : isDarkMode
                                  ? 'bg-gray-800 text-gray-400 border border-gray-700'
                                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                              👤 {transaction.createdBy.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-sm sm:text-base font-black ${
                        transaction.type === 'income' 
                          ? isDarkMode ? 'text-green-400' : 'text-green-600'
                          : isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, language)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          </div>
        </div>


      </div>

      {/* Modals */}
      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
      />
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />
      <MonthlyHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
      <MonthlyResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleMonthlyReset}
        currentStats={summary}
      />
      <UserStatsModal
        isOpen={isUserStatsModalOpen}
        onClose={() => setIsUserStatsModalOpen(false)}
        type={userStatsType}
        userStats={summary.byUser || []}
        currentUserId={currentUser?._id}
        language={language}
        currency={currency}
        usdRate={usdRate}
      />
    </div>
  );
});

export default MasterCashier;
