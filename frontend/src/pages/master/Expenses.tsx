import React, { useState, useMemo } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { TransactionResponse } from '@/types';
import { useExpenseCategories, useDeleteExpenseCategory } from '../../hooks/useExpenseCategories';
import AddExpenseCategoryModal from '@/components/AddExpenseCategoryModal';
import { 
  TrendingUp,
  TrendingDown,
  Calendar,
  Plus,
  Trash2,
  BarChart3,
  ShoppingCart,
  Home,
  Zap,
  Users,
  Settings,
  Package,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { t } from '@/lib/transliteration';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const Expenses: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('expense');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
  
  const language = useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // API calls
  const { data: categoriesData, isLoading: categoriesLoading } = useExpenseCategories();
  const deleteCategoryMutation = useDeleteExpenseCategory();
  
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
  const { data: transactionsData, isLoading } = useTransactions({ 
    type: filter === 'all' ? undefined : filter,
    categoryId: selectedCategory || undefined, // categoryId bo'yicha filter
    ...dateRange
  });

  const transactions = (transactionsData as TransactionResponse)?.transactions || [];
  const categories = (categoriesData?.categories || []).filter((cat: any) => 
    cat.nameUz !== 'Zapchastlar' && 
    cat.nameUz !== 'Ehtiyot qismlar' &&
    !cat.nameUz.toLowerCase().includes('zapchast')
  );

  // Icon mapping
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      ShoppingCart,
      Home,
      Zap,
      Users,
      DollarSign,
      Package,
      Settings
    };
    return iconMap[iconName] || DollarSign;
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
        border: 'border-blue-200',
        icon: 'bg-blue-500',
        text: 'text-blue-700',
        hover: 'hover:from-blue-100 hover:to-blue-200'
      },
      green: {
        bg: 'bg-gradient-to-br from-green-50 to-green-100',
        border: 'border-green-200',
        icon: 'bg-green-500',
        text: 'text-green-700',
        hover: 'hover:from-green-100 hover:to-green-200'
      },
      yellow: {
        bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
        border: 'border-yellow-200',
        icon: 'bg-yellow-500',
        text: 'text-yellow-700',
        hover: 'hover:from-yellow-100 hover:to-yellow-200'
      },
      purple: {
        bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
        border: 'border-purple-200',
        icon: 'bg-purple-500',
        text: 'text-purple-700',
        hover: 'hover:from-purple-100 hover:to-purple-200'
      },
      red: {
        bg: 'bg-gradient-to-br from-red-50 to-red-100',
        border: 'border-red-200',
        icon: 'bg-red-500',
        text: 'text-red-700',
        hover: 'hover:from-red-100 hover:to-red-200'
      },
      indigo: {
        bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
        border: 'border-indigo-200',
        icon: 'bg-indigo-500',
        text: 'text-indigo-700',
        hover: 'hover:from-indigo-100 hover:to-indigo-200'
      },
      pink: {
        bg: 'bg-gradient-to-br from-pink-50 to-pink-100',
        border: 'border-pink-200',
        icon: 'bg-pink-500',
        text: 'text-pink-700',
        hover: 'hover:from-pink-100 hover:to-pink-200'
      },
      gray: {
        bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
        border: 'border-gray-200',
        icon: 'bg-gray-500',
        text: 'text-gray-700',
        hover: 'hover:from-gray-100 hover:to-gray-200'
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  // Kategoriya bo'yicha xarajatlarni hisoblash
  const getCategoryExpenses = (categoryId: string) => {
    return transactions
      .filter((t: any) => t.type === 'expense' && (t.categoryId === categoryId || t.category === categories.find((c: any) => c._id === categoryId)?.nameUz))
      .reduce((sum: number, t: any) => sum + t.amount, 0);
  };

  // Kategoriya bo'yicha transaksiyalar sonini hisoblash
  const getCategoryTransactionCount = (categoryId: string) => {
    return transactions.filter((t: any) => t.type === 'expense' && (t.categoryId === categoryId || t.category === categories.find((c: any) => c._id === categoryId)?.nameUz)).length;
  };

  // Bugungi xarajatlarni hisoblash
  const getTodayExpenses = (categoryId: string) => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    return transactions
      .filter((t: any) => 
        t.type === 'expense' && 
        (t.categoryId === categoryId || t.category === categories.find((c: any) => c._id === categoryId)?.nameUz) &&
        new Date(t.createdAt) >= todayStart &&
        new Date(t.createdAt) < todayEnd
      )
      .reduce((sum: number, t: any) => sum + t.amount, 0);
  };

  // Kategoriyani o'chirish funksiyasi
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      await deleteCategoryMutation.mutateAsync(categoryToDelete._id);
      
      // Agar o'chirilgan kategoriya tanlangan bo'lsa, tanlovni bekor qilamiz
      if (selectedCategory === categoryToDelete._id) {
        setSelectedCategory(null);
      }
      
      // Modal yopish
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    } catch (error: any) {
      console.error('Kategoriya o\'chirishda xatolik:', error);
    }
  };

  const openDeleteModal = (category: any) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="card-gradient p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl sm:rounded-2xl shadow-lg">
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-red-900 bg-clip-text text-transparent">
                {t('Xarajatlar', language)}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">{t('Xarajat manbalari va tarixini boshqarish', language)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="btn-secondary btn-sm flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t("Yangi manba", language)}
            </button>
            <Link 
              to="/app/master/cashier"
              className="btn-primary btn-sm flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t("Yangi xarajat", language)}
            </Link>
          </div>
        </div>
      </div>

      {/* Xarajat Manbalari (Kategoriyalar) */}
      <div className="card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-red-600" />
            {t('Xarajat manbalari', language)}
          </h2>
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !selectedCategory 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('Barchasi', language)}
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categoriesLoading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="card p-4 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-3"></div>
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            ))
          ) : categories.length === 0 ? (
            // No categories message
            <div className="col-span-full text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">{t('Hali kategoriyalar yo\'q', language)}</p>
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="btn-primary btn-sm"
              >
                {t('Birinchi kategoriyani qo\'shish', language)}
              </button>
            </div>
          ) : (
            categories.map((category: any) => {
              const colors = getColorClasses(category.color);
              const categoryExpenses = getCategoryExpenses(category._id);
              const todayExpenses = getTodayExpenses(category._id);
              const categoryCount = getCategoryTransactionCount(category._id);
              const isSelected = selectedCategory === category._id;
              const IconComponent = getIconComponent(category.icon);
              
              return (
                <div
                  key={category._id}
                  className={`card p-4 cursor-pointer transition-all duration-200 ${colors.bg} ${colors.border} ${colors.hover} ${
                    isSelected ? 'ring-2 ring-offset-2 ring-red-500 shadow-lg' : 'hover:shadow-md'
                  } relative group`}
                >
                  {/* O'chirish tugmasi - faqat default bo'lmagan kategoriyalar uchun */}
                  {!category.isDefault && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(category);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg hover:shadow-xl transform hover:scale-110"
                      title={t('Kategoriyani o\'chirish', language)}
                      disabled={deleteCategoryMutation.isPending}
                    >
                      {deleteCategoryMutation.isPending ? (
                        <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </button>
                  )}

                  <div 
                    onClick={() => setSelectedCategory(isSelected ? null : category._id)}
                    className="w-full"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 ${colors.icon} rounded-lg`}>
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        {!category.isDefault && (
                          <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-0.5 rounded-full font-medium shadow-sm">
                            {t('Maxsus', language)}
                          </span>
                        )}
                        {isSelected && (
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-sm"></div>
                        )}
                      </div>
                    </div>
                    <h3 className={`font-bold text-sm mb-1 ${colors.text}`}>
                      {t(category.nameUz, language)}
                    </h3>
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {t(category.description, language)}
                    </p>
                    
                    {/* Umumiy xarajat */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{t('Jami', language)}:</span>
                        <span className="text-lg font-bold text-red-600">
                          {formatCurrency(categoryExpenses)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Bugungi xarajat */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{t('Bugun', language)}:</span>
                        <span className="text-sm font-semibold text-orange-600">
                          {formatCurrency(todayExpenses)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Transaksiyalar soni */}
                    <div className="flex items-center justify-center pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500">
                        {categoryCount} {t('ta transaksiya', language)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          
          {/* Yangi manba qo'shish kartasi */}
          <div
            onClick={() => setShowAddCategoryModal(true)}
            className="card p-4 cursor-pointer transition-all duration-200 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:from-gray-100 hover:to-gray-200 hover:shadow-md border-2 border-dashed"
          >
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-3 bg-gray-400 rounded-lg mb-3">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-sm text-gray-700 mb-1">
                {t('Yangi manba qo\'shish', language)}
              </h3>
              <p className="text-xs text-gray-500">
                {t('Maxsus xarajat kategoriyasi', language)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('Barchasi', language)}
            </button>
            <button
              onClick={() => setFilter('income')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                filter === 'income'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('Kirim', language)}
            </button>
            <button
              onClick={() => setFilter('expense')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                filter === 'expense'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('Chiqim', language)}
            </button>
          </div>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">{t('Barcha vaqt', language)}</option>
            <option value="today">{t('Bugun', language)}</option>
            <option value="week">{t('Bu hafta', language)}</option>
            <option value="month">{t('Bu oy', language)}</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="card">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-600" />
              {selectedCategory 
                ? `${t(categories.find((c: any) => c._id === selectedCategory)?.nameUz || '', language)} ${t('xarajatlari', language)}`
                : t('Barcha transaksiyalar', language)
              }
            </h2>
            <span className="text-sm text-gray-500">
              {transactions.length} {t('ta yozuv', language)}
            </span>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-6 sm:p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-red-200 border-t-red-600 mx-auto mb-4"></div>
              <p className="text-sm sm:text-base text-gray-500">{t('Yuklanmoqda...', language)}</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-6 sm:p-8 text-center">
              <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-500 mb-2">
                {selectedCategory 
                  ? t('Bu kategoriyada xarajatlar yo\'q', language)
                  : t('Transaksiyalar yo\'q', language)
                }
              </p>
              <p className="text-xs sm:text-sm text-gray-400">
                {selectedCategory 
                  ? t('Bu manba bo\'yicha hali xarajat qilinmagan', language)
                  : dateFilter !== 'all' 
                    ? t('Tanlangan vaqt oralig\'ida transaksiyalar topilmadi', language)
                    : t('Hali birorta ham transaksiya qo\'shilmagan', language)
                }
              </p>
            </div>
          ) : (
            transactions.map((transaction: any) => (
              <div key={transaction._id} className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors border-l-4 ${
                transaction.type === 'income' ? 'border-l-green-500' : 'border-l-red-500'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 sm:gap-4 flex-1">
                    <div className={`p-2 rounded-lg ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                          {transaction.category}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type === 'income' ? t('Kirim', language) : t('Chiqim', language)}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
                        {transaction.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(transaction.createdAt), 'dd.MM.yyyy HH:mm')}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                          {transaction.paymentMethod === 'cash' ? t('Naqd', language) : 
                           transaction.paymentMethod === 'card' ? t('Karta', language) : 'Click'}
                        </span>
                        {transaction.createdBy?.name && (
                          <span className="text-xs text-gray-500">
                            {t('Yaratuvchi', language)}: {transaction.createdBy.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-lg sm:text-2xl font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'} mb-1`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      <AddExpenseCategoryModal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
      />

      {/* Delete Category Modal */}
      {showDeleteModal && categoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-pink-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Trash2 className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{t('Kategoriyani o\'chirish', language)}</h3>
                </div>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setCategoryToDelete(null);
                  }}
                  className="text-white/80 hover:text-white p-1 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900 mb-1">
                      {t('Diqqat!', language)}
                    </p>
                    <p className="text-sm text-red-800">
                      <strong>"{categoryToDelete.nameUz}"</strong> {t('kategoriyasini o\'chirishni xohlaysizmi?', language)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-800">
                    {t('Bu kategoriya bilan bog\'liq barcha ma\'lumotlar saqlanib qoladi, lekin kategoriya ro\'yxatdan o\'chib ketadi.', language)}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCategoryToDelete(null);
                }}
                disabled={deleteCategoryMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('Bekor qilish', language)}
              </button>
              <button
                onClick={handleDeleteCategory}
                disabled={deleteCategoryMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {deleteCategoryMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>{t('O\'chirilmoqda...', language)}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>{t('O\'chirish', language)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
