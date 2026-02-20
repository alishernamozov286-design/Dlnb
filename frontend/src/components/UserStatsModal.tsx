import React, { useEffect } from 'react';
import { X, TrendingUp, TrendingDown, BarChart3, User, Trophy, Award, Medal } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { formatCurrency } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface UserStats {
  userId: string;
  userName: string;
  income: {
    cash: number;
    card: number;
    click: number;
    total: number;
    count: number;
  };
  expense: {
    cash: number; 
    card: number;
    click: number;
    total: number;
    count: number;
  };
}

interface UserStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'income' | 'expense' | 'balance';
  userStats: UserStats[];
  currentUserId?: string;
  language: 'latin' | 'cyrillic';
  currency?: 'UZS' | 'USD';
  usdRate?: number;
}

const UserStatsModal: React.FC<UserStatsModalProps> = ({
  isOpen,
  onClose,
  type,
  userStats,
  currentUserId,
  language,
  currency = 'UZS',
  usdRate = 12700
}) => {
  const { isDarkMode } = useTheme();
  
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
  // Body scroll'ni to'xtatish
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getTitle = () => {
    switch (type) {
      case 'income':
        return t('Kirim - Ustozlar bo\'yicha', language);
      case 'expense':
        return t('Chiqim - Ustozlar bo\'yicha', language);
      case 'balance':
        return t('Balans - Ustozlar bo\'yicha', language);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'income':
        return <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />;
      case 'expense':
        return <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-white" />;
      case 'balance':
        return <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'income':
        return {
          gradient: isDarkMode 
            ? 'from-green-600 via-green-700 to-emerald-700' 
            : 'from-green-500 to-emerald-600',
          headerBg: isDarkMode ? 'bg-green-600' : 'bg-green-500',
          cardBg: isDarkMode 
            ? 'from-green-900/40 to-emerald-900/40 border-green-800' 
            : 'from-green-50 to-emerald-50 border-green-200',
          textColor: isDarkMode ? 'text-green-400' : 'text-green-700',
          textBold: isDarkMode ? 'text-green-300' : 'text-green-900'
        };
      case 'expense':
        return {
          gradient: isDarkMode 
            ? 'from-red-600 via-red-700 to-pink-700' 
            : 'from-red-500 to-pink-600',
          headerBg: isDarkMode ? 'bg-red-600' : 'bg-red-500',
          cardBg: isDarkMode 
            ? 'from-red-900/40 to-pink-900/40 border-red-800' 
            : 'from-red-50 to-pink-50 border-red-200',
          textColor: isDarkMode ? 'text-red-400' : 'text-red-700',
          textBold: isDarkMode ? 'text-red-300' : 'text-red-900'
        };
      case 'balance':
        return {
          gradient: isDarkMode 
            ? 'from-blue-600 via-blue-700 to-indigo-700' 
            : 'from-blue-500 to-indigo-600',
          headerBg: isDarkMode ? 'bg-blue-600' : 'bg-blue-500',
          cardBg: isDarkMode 
            ? 'from-blue-900/40 to-indigo-900/40 border-blue-800' 
            : 'from-blue-50 to-indigo-50 border-blue-200',
          textColor: isDarkMode ? 'text-blue-400' : 'text-blue-700',
          textBold: isDarkMode ? 'text-blue-300' : 'text-blue-900'
        };
    }
  };

  const colors = getColorClasses();

  const sortedUsers = [...userStats].sort((a, b) => {
    if (type === 'income') {
      return b.income.total - a.income.total;
    } else if (type === 'expense') {
      return b.expense.total - a.expense.total;
    } else {
      const balanceA = a.income.total - a.expense.total;
      const balanceB = b.income.total - b.expense.total;
      return balanceB - balanceA;
    }
  });

  return (
    <div 
      className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-fade-in ${
        isDarkMode ? 'bg-black/70' : 'bg-black/50'
      }`}
      onClick={onClose}
    >
      <div 
        className={`rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-2xl lg:max-w-3xl overflow-hidden animate-scale-in ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
            : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Premium Design */}
        <div className={`relative overflow-hidden p-4 sm:p-6 ${
          isDarkMode
            ? 'bg-gradient-to-br from-red-600 via-red-700 to-gray-900'
            : `bg-gradient-to-r ${colors.gradient}`
        }`}>
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="bg-white/20 backdrop-blur-xl p-2 sm:p-3 rounded-xl shadow-lg flex-shrink-0">
                {getIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-xl md:text-2xl font-bold text-white truncate">
                  {getTitle()}
                </h2>
                <p className="text-xs sm:text-sm text-white/80 mt-0.5">
                  {sortedUsers.length} {t('ta ustoz', language)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 flex-shrink-0 hover:rotate-90 backdrop-blur-xl"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`p-3 sm:p-4 max-h-[70vh] overflow-y-auto ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
            : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40'
        }`}>
          <div className="space-y-2 sm:space-y-3">
            {sortedUsers.map((user, index) => {
              const isCurrentUser = user.userId === currentUserId;
              const balance = user.income.total - user.expense.total;
              const cashBalance = user.income.cash - user.expense.cash;
              const cardBalance = user.income.card - user.expense.card;

              // Rank icon
              const getRankIcon = () => {
                if (index === 0) return <Trophy className="h-4 w-4 text-yellow-400" />;
                if (index === 1) return <Award className="h-4 w-4 text-gray-400" />;
                if (index === 2) return <Medal className="h-4 w-4 text-orange-400" />;
                return null;
              };

              return (
                <div
                  key={user.userId}
                  className={`relative overflow-hidden rounded-xl p-3 sm:p-4 border-2 transition-all duration-300 hover:shadow-xl ${
                    isDarkMode
                      ? isCurrentUser 
                        ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-700 ring-2 ring-red-900/50' 
                        : 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30 hover:border-red-700'
                      : isCurrentUser 
                        ? 'bg-white border-blue-400 ring-2 ring-blue-200' 
                        : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {/* Rank Badge */}
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    {getRankIcon()}
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shadow-lg ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                      index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                      isDarkMode 
                        ? 'bg-gray-700 text-gray-300 border-2 border-gray-600' 
                        : 'bg-gray-100 text-gray-700 border-2 border-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="mb-3 pr-12">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${
                        isDarkMode
                          ? isCurrentUser ? 'bg-red-900/50' : 'bg-gray-700'
                          : isCurrentUser ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <User className={`h-4 w-4 ${
                          isDarkMode
                            ? isCurrentUser ? 'text-red-400' : 'text-gray-400'
                            : isCurrentUser ? 'text-blue-700' : 'text-gray-700'
                        }`} />
                      </div>
                      <h3 className={`text-sm sm:text-base font-bold truncate ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {user.userName}
                      </h3>
                      {isCurrentUser && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                          isDarkMode
                            ? 'bg-red-600 text-white'
                            : 'bg-blue-500 text-white'
                        }`}>
                          {t('Siz', language)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {/* Kirim Card */}
                    <div className={`rounded-lg p-2 sm:p-3 border ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-800'
                        : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                    }`}>
                      <div className="flex items-center gap-1 mb-1.5">
                        <div className={`p-1 rounded ${
                          isDarkMode ? 'bg-green-600' : 'bg-green-500'
                        }`}>
                          <TrendingUp className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className={`text-[9px] sm:text-[10px] font-semibold ${
                          isDarkMode ? 'text-green-400' : 'text-green-700'
                        }`}>
                          {t('Kirim', language)}
                        </span>
                      </div>
                      
                      <div className="mb-1.5">
                        <p className={`text-[8px] sm:text-[9px] ${
                          isDarkMode ? 'text-green-400' : 'text-green-600'
                        }`}>{t('Umumiy', language)}</p>
                        <div className={`text-xs sm:text-sm font-bold truncate ${
                          isDarkMode ? 'text-green-300' : 'text-green-900'
                        }`}>
                          {formatWithCurrency(user.income.total)}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className={`rounded px-1.5 py-1 ${
                          isDarkMode ? 'bg-gray-800/60' : 'bg-white/60'
                        }`}>
                          <p className={`text-[7px] sm:text-[8px] ${
                            isDarkMode ? 'text-green-400' : 'text-green-600'
                          }`}>{t('Naqd', language)}</p>
                          <div className={`text-[10px] sm:text-xs font-bold truncate ${
                            isDarkMode ? 'text-green-300' : 'text-green-900'
                          }`}>
                            {formatWithCurrency(user.income.cash)}
                          </div>
                        </div>
                        
                        <div className={`rounded px-1.5 py-1 ${
                          isDarkMode ? 'bg-gray-800/60' : 'bg-white/60'
                        }`}>
                          <p className={`text-[7px] sm:text-[8px] ${
                            isDarkMode ? 'text-green-400' : 'text-green-600'
                          }`}>{t('Karta', language)}</p>
                          <div className={`text-[10px] sm:text-xs font-bold truncate ${
                            isDarkMode ? 'text-green-300' : 'text-green-900'
                          }`}>
                            {formatWithCurrency(user.income.card)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Chiqim Card */}
                    <div className={`rounded-lg p-2 sm:p-3 border ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-red-900/40 to-pink-900/40 border-red-800'
                        : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-1 mb-1.5">
                        <div className={`p-1 rounded ${
                          isDarkMode ? 'bg-red-600' : 'bg-red-500'
                        }`}>
                          <TrendingDown className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className={`text-[9px] sm:text-[10px] font-semibold ${
                          isDarkMode ? 'text-red-400' : 'text-red-700'
                        }`}>
                          {t('Chiqim', language)}
                        </span>
                      </div>
                      
                      <div className="mb-1.5">
                        <p className={`text-[8px] sm:text-[9px] ${
                          isDarkMode ? 'text-red-400' : 'text-red-600'
                        }`}>{t('Umumiy', language)}</p>
                        <div className={`text-xs sm:text-sm font-bold truncate ${
                          isDarkMode ? 'text-red-300' : 'text-red-900'
                        }`}>
                          {formatWithCurrency(user.expense.total)}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className={`rounded px-1.5 py-1 ${
                          isDarkMode ? 'bg-gray-800/60' : 'bg-white/60'
                        }`}>
                          <p className={`text-[7px] sm:text-[8px] ${
                            isDarkMode ? 'text-red-400' : 'text-red-600'
                          }`}>{t('Naqd', language)}</p>
                          <div className={`text-[10px] sm:text-xs font-bold truncate ${
                            isDarkMode ? 'text-red-300' : 'text-red-900'
                          }`}>
                            {formatWithCurrency(user.expense.cash)}
                          </div>
                        </div>
                        
                        <div className={`rounded px-1.5 py-1 ${
                          isDarkMode ? 'bg-gray-800/60' : 'bg-white/60'
                        }`}>
                          <p className={`text-[7px] sm:text-[8px] ${
                            isDarkMode ? 'text-red-400' : 'text-red-600'
                          }`}>{t('Karta', language)}</p>
                          <div className={`text-[10px] sm:text-xs font-bold truncate ${
                            isDarkMode ? 'text-red-300' : 'text-red-900'
                          }`}>
                            {formatWithCurrency(user.expense.card)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Balans Card */}
                    <div className={`rounded-lg p-2 sm:p-3 border ${
                      isDarkMode
                        ? balance >= 0
                          ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-800'
                          : 'bg-gradient-to-br from-red-900/40 to-pink-900/40 border-red-800'
                        : balance >= 0
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                          : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-1 mb-1.5">
                        <div className={`p-1 rounded ${
                          isDarkMode
                            ? balance >= 0 ? 'bg-green-600' : 'bg-red-600'
                            : balance >= 0 ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          <BarChart3 className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className={`text-[9px] sm:text-[10px] font-semibold ${
                          isDarkMode
                            ? balance >= 0 ? 'text-green-400' : 'text-red-400'
                            : balance >= 0 ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {t('Balans', language)}
                        </span>
                      </div>
                      
                      <div className="mb-1.5">
                        <p className={`text-[8px] sm:text-[9px] ${
                          isDarkMode
                            ? balance >= 0 ? 'text-green-400' : 'text-red-400'
                            : balance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>{t('Umumiy', language)}</p>
                        <div className={`text-xs sm:text-sm font-bold truncate ${
                          isDarkMode
                            ? balance >= 0 ? 'text-green-300' : 'text-red-300'
                            : balance >= 0 ? 'text-green-900' : 'text-red-900'
                        }`}>
                          {formatWithCurrency(balance)}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className={`rounded px-1.5 py-1 ${
                          isDarkMode ? 'bg-gray-800/60' : 'bg-white/60'
                        }`}>
                          <p className={`text-[7px] sm:text-[8px] ${
                            isDarkMode
                              ? cashBalance >= 0 ? 'text-green-400' : 'text-red-400'
                              : cashBalance >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>{t('Naqd', language)}</p>
                          <div className={`text-[10px] sm:text-xs font-bold truncate ${
                            isDarkMode
                              ? cashBalance >= 0 ? 'text-green-300' : 'text-red-300'
                              : cashBalance >= 0 ? 'text-green-900' : 'text-red-900'
                          }`}>
                            {formatWithCurrency(cashBalance)}
                          </div>
                        </div>
                        
                        <div className={`rounded px-1.5 py-1 ${
                          isDarkMode ? 'bg-gray-800/60' : 'bg-white/60'
                        }`}>
                          <p className={`text-[7px] sm:text-[8px] ${
                            isDarkMode
                              ? cardBalance >= 0 ? 'text-green-400' : 'text-red-400'
                              : cardBalance >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>{t('Karta', language)}</p>
                          <div className={`text-[10px] sm:text-xs font-bold truncate ${
                            isDarkMode
                              ? cardBalance >= 0 ? 'text-green-300' : 'text-red-300'
                              : cardBalance >= 0 ? 'text-green-900' : 'text-red-900'
                          }`}>
                            {formatWithCurrency(cardBalance)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStatsModal;
