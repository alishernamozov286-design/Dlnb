import React, { memo, useMemo, useState } from 'react';
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Calendar,
  BarChart3,
  Eye,
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

const MasterCashier: React.FC = memo(() => {
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');

  const language = useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // Get date range for filter
  const getDateRange = () => {
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
  };

  const dateRange = getDateRange();
  const { data: transactionsData, isLoading: transactionsLoading } = useTransactions({
    type: filter === 'all' ? undefined : filter,
    ...dateRange
  });
  const { data: summaryData, isLoading: summaryLoading } = useTransactionSummary();

  const transactions = (transactionsData as TransactionResponse)?.transactions || [];
  const summary = summaryData?.summary || {
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
    balanceCard: 0
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Wallet className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'click': return <Smartphone className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return t('Naqd', language);
      case 'card': return t('Karta', language);
      case 'click': return 'Click';
      default: return method;
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6 p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Header Section - Ultra Modern */}
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl border border-gray-100/50">
          {/* Animated Background Gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5"></div>
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          <div className="relative z-10 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity"></div>
                  <div className="relative p-4 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl shadow-xl transform group-hover:scale-105 transition-transform">
                    <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-1">
                    {t("Kassa", language)}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 font-medium">{t("Kirim va chiqimlarni boshqarish", language)}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
                <Link 
                  to="/app/master/warehouse"
                  className="group relative overflow-hidden px-5 py-3 bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2 flex-1 sm:flex-initial justify-center"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <Package className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">{t('Ombor', language)}</span>
                </Link>
                <button
                  onClick={() => setIsResetModalOpen(true)}
                  className="group relative overflow-hidden px-5 py-3 bg-gradient-to-r from-red-500 via-red-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2 flex-1 sm:flex-initial justify-center"
                  title={t("Barcha daromadlarni 0 ga qaytarish", language)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <Calendar className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">{t('Oylik Reset', language)}</span>
                </button>
                <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="group relative overflow-hidden px-5 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold shadow-md hover:shadow-xl hover:border-blue-400 transition-all duration-300 hover:scale-105 flex items-center gap-2 flex-1 sm:flex-initial justify-center"
                  title={t("Oylik tarix", language)}
                >
                  <History className="h-4 w-4 group-hover:text-blue-600 transition-colors" />
                  <span className="group-hover:text-blue-600 transition-colors">{t('Tarix', language)}</span>
                </button>
                <Link 
                  to="/app/master/expenses"
                  className="group relative overflow-hidden px-5 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold shadow-md hover:shadow-xl hover:border-indigo-400 transition-all duration-300 hover:scale-105 flex items-center gap-2 flex-1 sm:flex-initial justify-center"
                >
                  <BarChart3 className="h-4 w-4 group-hover:text-indigo-600 transition-colors" />
                  <span className="group-hover:text-indigo-600 transition-colors">{t("Hisobot", language)}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Cards - Premium Design */}
          <div className="relative z-10 px-6 sm:px-8 lg:px-10 pb-6 sm:pb-8 lg:pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-6">
            {/* KIRIM CARD */}
            <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                  {t('Kirim', language)}
                </span>
              </div>
              
              <div className="mb-3">
                <p className="text-xs text-green-600 mb-1">{t('Umumiy', language)}</p>
                <div className="text-2xl font-bold text-green-900">
                  {summaryLoading ? '...' : formatCurrency(summary.totalIncome, language)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-white/60 rounded-lg p-2">
                  <p className="text-xs text-green-600 mb-0.5">{t('Naqd', language)}</p>
                  <div className="text-sm font-bold text-green-900">
                    {summaryLoading ? '...' : formatCurrency(summary.incomeCash || 0, language)}
                  </div>
                </div>
                
                <div className="bg-white/60 rounded-lg p-2">
                  <p className="text-xs text-green-600 mb-0.5">{t('Karta', language)}</p>
                  <div className="text-sm font-bold text-green-900">
                    {summaryLoading ? '...' : formatCurrency(summary.incomeCard || 0, language)}
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-green-600">
                {summary.incomeCount} {t('ta', language)}
              </p>
            </div>

            {/* CHIQIM CARD */}
            <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 border border-red-200 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-red-500 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full">
                  {t('Chiqim', language)}
                </span>
              </div>
              
              <div className="mb-3">
                <p className="text-xs text-red-600 mb-1">{t('Umumiy', language)}</p>
                <div className="text-2xl font-bold text-red-900">
                  {summaryLoading ? '...' : formatCurrency(summary.totalExpense, language)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-white/60 rounded-lg p-2">
                  <p className="text-xs text-red-600 mb-0.5">{t('Naqd', language)}</p>
                  <div className="text-sm font-bold text-red-900">
                    {summaryLoading ? '...' : formatCurrency(summary.expenseCash || 0, language)}
                  </div>
                </div>
                
                <div className="bg-white/60 rounded-lg p-2">
                  <p className="text-xs text-red-600 mb-0.5">{t('Karta', language)}</p>
                  <div className="text-sm font-bold text-red-900">
                    {summaryLoading ? '...' : formatCurrency(summary.expenseCard || 0, language)}
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-red-600">
                {summary.expenseCount} {t('ta', language)}
              </p>
            </div>

            {/* BALANS CARD */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                  {t('Balans', language)}
                </span>
              </div>
              
              <div className="mb-3">
                <p className="text-xs text-blue-600 mb-1">{t('Umumiy', language)}</p>
                <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                  {summaryLoading ? '...' : formatCurrency(summary.balance, language)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-white/60 rounded-lg p-2">
                  <p className="text-xs text-blue-600 mb-0.5">{t('Naqd', language)}</p>
                  <div className={`text-sm font-bold ${(summary.balanceCash || 0) >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                    {summaryLoading ? '...' : formatCurrency(summary.balanceCash || 0, language)}
                  </div>
                </div>
                
                <div className="bg-white/60 rounded-lg p-2">
                  <p className="text-xs text-blue-600 mb-0.5">{t('Karta', language)}</p>
                  <div className={`text-sm font-bold ${(summary.balanceCard || 0) >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                    {summaryLoading ? '...' : formatCurrency(summary.balanceCard || 0, language)}
                  </div>
                </div>
              </div>
              
              <p className={`text-xs ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.balance >= 0 ? t('Ijobiy', language) : t('Salbiy', language)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* KIRIM Button */}
            <button
              onClick={() => setIsIncomeModalOpen(true)}
              className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <TrendingUp className="h-8 w-8" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-2xl font-bold mb-1">{t("KIRIM", language)}</h2>
                    <p className="text-sm text-green-100">{t("Pul kirimi qo'shish", language)}</p>
                  </div>
                </div>
                <Plus className="h-6 w-6" />
              </div>
            </button>

            {/* CHIQIM Button */}
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="group relative overflow-hidden bg-gradient-to-br from-red-500 to-pink-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <TrendingDown className="h-8 w-8" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-2xl font-bold mb-1">{t("CHIQIM", language)}</h2>
                    <p className="text-sm text-red-100">{t("Xarajat belgilash", language)}</p>
                  </div>
                </div>
                <Plus className="h-6 w-6" />
              </div>
            </button>
          </div>
          </div>
        </div>

        {/* Recent Transactions - Modern Card */}
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl border border-gray-100/50 p-5 sm:p-7">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent"></div>
          
          <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              {t("So'nggi transaksiyalar", language)}
            </h3>
            
            {/* Filters - Enhanced */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 text-xs sm:text-sm rounded-lg font-semibold transition-all duration-300 ${
                    filter === 'all'
                      ? 'bg-white text-blue-600 shadow-md scale-105'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('Barchasi', language)}
                </button>
                <button
                  onClick={() => setFilter('income')}
                  className={`px-4 py-2 text-xs sm:text-sm rounded-lg font-semibold transition-all duration-300 ${
                    filter === 'income'
                      ? 'bg-white text-green-600 shadow-md scale-105'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('Kirim', language)}
                </button>
                <button
                  onClick={() => setFilter('expense')}
                  className={`px-4 py-2 text-xs sm:text-sm rounded-lg font-semibold transition-all duration-300 ${
                    filter === 'expense'
                      ? 'bg-white text-red-600 shadow-md scale-105'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('Chiqim', language)}
                </button>
              </div>
              
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="px-4 py-2 text-xs sm:text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium bg-white hover:border-gray-300 transition-colors"
              >
                <option value="today">{t('Bugun', language)}</option>
                <option value="week">{t('Bu hafta', language)}</option>
                <option value="month">{t('Bu oy', language)}</option>
                <option value="all">{t('Barchasi', language)}</option>
              </select>
            </div>
          </div>

          {/* Transactions List - Enhanced */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {transactionsLoading ? (
              <div className="text-center py-12">
                <div className="relative mx-auto w-16 h-16 mb-4">
                  <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-base text-gray-600 font-medium">{t('Yuklanmoqda...', language)}</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 bg-gray-200 rounded-full blur-xl opacity-50"></div>
                  <div className="relative p-5 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full">
                    <DollarSign className="h-12 w-12 text-gray-400" />
                  </div>
                </div>
                <p className="text-base text-gray-600 font-semibold mb-2">{t('Transaksiyalar yo\'q', language)}</p>
                <p className="text-sm text-gray-400">
                  {t('Kirim yoki chiqim qo\'shing', language)}
                </p>
              </div>
            ) : (
              transactions.slice(0, 10).map((transaction: any) => (
                <div 
                  key={transaction._id} 
                  className={`group relative overflow-hidden rounded-2xl p-4 sm:p-5 border-2 hover:shadow-xl transition-all duration-300 hover:scale-[1.01] ${
                    transaction.type === 'income' 
                      ? 'border-green-200 bg-gradient-to-r from-green-50 via-emerald-50/50 to-transparent hover:border-green-300' 
                      : 'border-red-200 bg-gradient-to-r from-red-50 via-pink-50/50 to-transparent hover:border-red-300'
                  }`}
                >
                  {/* Decorative Border */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    transaction.type === 'income' ? 'bg-gradient-to-b from-green-500 to-emerald-600' : 'bg-gradient-to-b from-red-500 to-pink-600'
                  }`}></div>
                  
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-xl shadow-md group-hover:shadow-lg transition-shadow ${
                        transaction.type === 'income' ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-pink-600'
                      }`}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        ) : (
                          <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-bold text-base sm:text-lg text-gray-900 truncate">
                            {transaction.category}
                          </h4>
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 text-green-700 border border-green-200' 
                              : 'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                            {transaction.type === 'income' ? t('Kirim', language) : t('Chiqim', language)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2 font-medium">
                          {transaction.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1.5 bg-white/80 px-2.5 py-1 rounded-lg">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(transaction.createdAt), 'dd.MM.yyyy HH:mm')}
                          </span>
                          <span className="flex items-center gap-1.5 bg-white/80 px-2.5 py-1 rounded-lg">
                            {getPaymentMethodIcon(transaction.paymentMethod)}
                            {getPaymentMethodText(transaction.paymentMethod)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-lg sm:text-xl font-black ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, language)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {transactions.length > 10 && (
            <div className="text-center mt-6 pt-6 border-t-2 border-gray-100">
              <Link 
                to="/app/master/expenses"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Eye className="h-5 w-5" />
                {t("Barchasini ko'rish", language)} ({transactions.length})
              </Link>
            </div>
          )}
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
    </div>
  );
});

export default MasterCashier;
