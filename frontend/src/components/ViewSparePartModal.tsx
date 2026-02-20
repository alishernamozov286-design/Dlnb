import React from 'react';
import { X, Package, DollarSign, TrendingUp, Calendar, Edit, Trash2, Settings } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { useTheme } from '@/contexts/ThemeContext';
import API_CONFIG from '@/config/api.config';

// Helper function to get full image URL
const getFullImageUrl = (imagePath: string | undefined): string => {
  if (!imagePath) return '';
  
  // Base64 rasm bo'lsa, to'g'ridan-to'g'ri qaytarish
  if (imagePath.startsWith('data:image/')) {
    return imagePath;
  }
  
  // Agar to'liq URL bo'lsa, o'zini qaytarish
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // API URL'dan /api qismini olib tashlash
  const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
  
  // Agar imagePath / bilan boshlanmasa, qo'shish
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${baseUrl}${path}`;
};

interface SparePart {
  _id: string;
  name: string;
  price?: number; // Optional - backward compatibility
  costPrice?: number; // O'zini narxi
  sellingPrice?: number; // Sotish narxi
  currency?: 'UZS' | 'USD'; // Valyuta turi
  profit?: number; // Foyda (virtual field)
  quantity: number;
  supplier: string;
  imageUrl?: string; // Rasm URL
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ViewSparePartModalProps {
  isOpen: boolean;
  onClose: () => void;
  sparePart: SparePart;
  onEdit?: () => void;
  onDelete?: () => void;
  currency?: 'UZS' | 'USD';
  usdRate?: number;
}

const ViewSparePartModal: React.FC<ViewSparePartModalProps> = ({ 
  isOpen, 
  onClose, 
  sparePart, 
  onEdit, 
  onDelete,
  currency = 'UZS',
  usdRate = 12700
}) => {
  const { isDarkMode } = useTheme();
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

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
    return amount.toLocaleString() + ' ' + t("so'm", language);
  };

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative rounded-xl shadow-2xl max-w-lg w-full max-h-[95vh] overflow-hidden mx-2 border ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-red-900/30' 
          : 'bg-white border-orange-200'
      }`}>
        {/* Header */}
        <div className={`px-4 py-3 ${
          isDarkMode 
            ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900' 
            : 'bg-gradient-to-r from-orange-500 to-amber-600'
        }`}>
          <button 
            onClick={onClose} 
            className="absolute top-3 right-3 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white truncate">{sparePart.name}</h2>
              <span className={`text-xs ${isDarkMode ? 'text-red-100' : 'text-orange-100'}`}>{sparePart.supplier}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(95vh-140px)] scrollbar-hide">
          {/* Rasm yoki Settings icon */}
          {sparePart.imageUrl ? (
            <div className={`rounded-lg overflow-hidden border-2 ${
              isDarkMode ? 'border-red-900/30' : 'border-orange-200'
            }`}>
              <img
                src={getFullImageUrl(sparePart.imageUrl)}
                alt={sparePart.name}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  console.error('❌ Rasm yuklanmadi:', sparePart.imageUrl);
                  console.error('📍 To\'liq URL:', getFullImageUrl(sparePart.imageUrl));
                  // Rasm yuklanmasa, Settings icon ko'rsatish
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('.settings-icon-placeholder')) {
                    const placeholder = document.createElement('div');
                    placeholder.className = `settings-icon-placeholder w-full h-48 flex items-center justify-center relative overflow-hidden ${
                      isDarkMode 
                        ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800' 
                        : 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50'
                    }`;
                    placeholder.innerHTML = `
                      <div class="absolute inset-0 ${
                        isDarkMode 
                          ? 'bg-gradient-to-br from-red-500/5 to-transparent' 
                          : 'bg-gradient-to-br from-orange-500/5 to-transparent'
                      }"></div>
                      <div class="relative">
                        <div class="absolute inset-0 ${
                          isDarkMode 
                            ? 'bg-red-600' 
                            : 'bg-orange-500'
                        } rounded-full blur-xl opacity-20 animate-pulse"></div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="relative ${
                          isDarkMode ? 'text-gray-600' : 'text-orange-400'
                        }" style="animation: spin 8s linear infinite;">
                          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </div>
                    `;
                    parent.appendChild(placeholder);
                  }
                }}
              />
            </div>
          ) : (
            <div className={`rounded-lg overflow-hidden border-2 ${
              isDarkMode ? 'border-red-900/30' : 'border-orange-200'
            }`}>
              <div className={`w-full h-48 flex items-center justify-center relative overflow-hidden ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800' 
                  : 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50'
              }`}>
                {/* Animated background gradient */}
                <div className={`absolute inset-0 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-red-500/5 to-transparent' 
                    : 'bg-gradient-to-br from-orange-500/5 to-transparent'
                }`}></div>
                
                {/* Glow effect */}
                <div className={`absolute inset-0 flex items-center justify-center ${
                  isDarkMode ? 'opacity-20' : 'opacity-30'
                }`}>
                  <div className={`w-24 h-24 rounded-full blur-3xl animate-pulse ${
                    isDarkMode 
                      ? 'bg-red-600' 
                      : 'bg-orange-500'
                  }`}></div>
                </div>
                
                {/* Settings icon with slow rotation */}
                <div className="relative">
                  <Settings className={`h-16 w-16 ${
                    isDarkMode ? 'text-gray-600' : 'text-orange-400'
                  }`} style={{ animation: 'spin 8s linear infinite' }} />
                </div>
              </div>
            </div>
          )}
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className={`rounded-lg p-3 border ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30' 
                : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <Package className={`h-4 w-4 ${isDarkMode ? 'text-red-400' : 'text-orange-600'}`} />
                <span className={`text-xs font-semibold ${isDarkMode ? 'text-red-400' : 'text-orange-600'}`}>{t('Miqdor', language)}</span>
              </div>
              <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {sparePart.quantity} {t('dona', language)}
              </p>
            </div>

            <div className={`rounded-lg p-3 border ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30' 
                : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className={`h-4 w-4 ${isDarkMode ? 'text-red-400' : 'text-orange-600'}`} />
                <span className={`text-xs font-semibold ${isDarkMode ? 'text-red-400' : 'text-orange-600'}`}>{t('Ishlatilgan', language)}</span>
              </div>
              <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {sparePart.usageCount} {t('marta', language)}
              </p>
            </div>
          </div>

          {/* Narxlar Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className={`rounded-lg p-2 border ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30' 
                : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
            }`}>
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="h-3 w-3 text-orange-400" />
                <span className="text-[10px] font-semibold text-orange-400">{t("O'zini", language)}</span>
              </div>
              <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatWithCurrency(sparePart.costPrice || sparePart.sellingPrice || sparePart.price || 0)}
              </p>
            </div>

            <div className={`rounded-lg p-2 border ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30' 
                : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
            }`}>
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="h-3 w-3 text-green-400" />
                <span className="text-[10px] font-semibold text-green-400">{t('Sotish', language)}</span>
              </div>
              <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatWithCurrency(sparePart.sellingPrice || sparePart.price || 0)}
              </p>
            </div>

            <div className={`rounded-lg p-2 border ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30' 
                : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
            }`}>
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3 text-emerald-400" />
                <span className="text-[10px] font-semibold text-emerald-400">{t('Foyda', language)}</span>
              </div>
              <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatWithCurrency(sparePart.profit || ((sparePart.sellingPrice || sparePart.price || 0) - (sparePart.costPrice || sparePart.sellingPrice || sparePart.price || 0)))}
              </p>
            </div>
          </div>

          {/* Total Value */}
          <div className={`rounded-lg p-2 border ${
            isDarkMode 
              ? 'bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 border-red-900/30' 
              : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${isDarkMode ? 'text-red-400' : 'text-orange-600'}`}>{t('Jami qiymat', language)}</span>
              <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatWithCurrency((sparePart.sellingPrice || sparePart.price || 0) * sparePart.quantity)}
              </span>
            </div>
          </div>

          {/* Total Profit */}
          <div className={`rounded-lg p-2 border ${
            isDarkMode 
              ? 'bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 border-red-900/30' 
              : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400">{t('Jami foyda', language)}</span>
              <span className="text-sm font-bold text-emerald-300">
                {formatWithCurrency((sparePart.profit || ((sparePart.sellingPrice || sparePart.price || 0) - (sparePart.costPrice || sparePart.sellingPrice || sparePart.price || 0))) * sparePart.quantity)}
              </span>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <div className={`rounded-lg p-2 border ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30' 
                : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
            }`}>
              <div className="flex items-center gap-1 mb-1">
                <Calendar className={`h-3 w-3 ${isDarkMode ? 'text-red-400' : 'text-orange-600'}`} />
                <span className={`text-xs font-semibold ${isDarkMode ? 'text-red-400' : 'text-orange-600'}`}>{t('Yaratilgan', language)}</span>
              </div>
              <p className={`text-[10px] ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{formatDate(sparePart.createdAt)}</p>
            </div>

            <div className={`rounded-lg p-2 border ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30' 
                : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
            }`}>
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="h-3 w-3 text-orange-400" />
                <span className="text-xs font-semibold text-orange-400">{t('Yangilangan', language)}</span>
              </div>
              <p className={`text-[10px] ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{formatDate(sparePart.updatedAt)}</p>
            </div>
          </div>

          {/* Balon ma'lumotlari */}
          {/* @ts-ignore */}
          {sparePart.category === 'balon' && (
            <div className={`rounded-lg p-3 border-2 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30' 
                : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
            }`}>
              <h3 className={`text-xs font-bold mb-2 flex items-center gap-2 ${
                isDarkMode ? 'text-red-400' : 'text-orange-600'
              }`}>
                <Package className="h-4 w-4" />
                {t('Balon ma\'lumotlari', language)}
              </h3>
              <div className="space-y-2">
                {/* @ts-ignore */}
                {sparePart.tireSize && (
                  <div className={`flex items-center justify-between rounded-lg p-2 border ${
                    isDarkMode 
                      ? 'bg-gray-800/60 border-red-900/20' 
                      : 'bg-white border-orange-200'
                  }`}>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('O\'lchami', language)}:</span>
                    {/* @ts-ignore */}
                    <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{sparePart.tireSize}</span>
                  </div>
                )}
                {/* @ts-ignore */}
                {sparePart.tireBrand && (
                  <div className={`flex items-center justify-between rounded-lg p-2 border ${
                    isDarkMode 
                      ? 'bg-gray-800/60 border-red-900/20' 
                      : 'bg-white border-orange-200'
                  }`}>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('Brend', language)}:</span>
                    {/* @ts-ignore */}
                    <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{sparePart.tireBrand}</span>
                  </div>
                )}
                {/* @ts-ignore */}
                {sparePart.tireType && (
                  <div className={`flex items-center justify-between rounded-lg p-2 border ${
                    isDarkMode 
                      ? 'bg-gray-800/60 border-red-900/20' 
                      : 'bg-white border-orange-200'
                  }`}>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('Turi', language)}:</span>
                    <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {/* @ts-ignore */}
                      {sparePart.tireType === 'yozgi' ? t('Yozgi', language) : 
                       /* @ts-ignore */
                       sparePart.tireType === 'qishki' ? t('Qishki', language) : 
                       t('Universal', language)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-4 pb-4">
          <div className={`flex items-center gap-2 pt-2 border-t ${
            isDarkMode ? 'border-red-900/30' : 'border-orange-200'
          }`}>
            <button
              onClick={onClose}
              className={`flex-1 px-3 py-2 text-xs font-medium border rounded-lg transition-colors ${
                isDarkMode 
                  ? 'text-gray-300 bg-gray-800 border-red-900/30 hover:bg-gray-700' 
                  : 'text-gray-700 bg-white border-orange-200 hover:bg-gray-50'
              }`}
            >
              {t('Yopish', language)}
            </button>
            
            {onEdit && (
              <button
                onClick={onEdit}
                className={`px-3 py-2 text-xs font-medium text-white rounded-lg transition-all shadow-lg flex items-center gap-1 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900 hover:from-red-700 hover:via-red-800 hover:to-gray-800 shadow-red-900/30' 
                    : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-orange-500/30'
                }`}
              >
                <Edit className="h-3 w-3" />
                {t('Tahrirlash', language)}
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={onDelete}
                className={`px-3 py-2 text-xs font-medium border rounded-lg transition-colors flex items-center gap-1 ${
                  isDarkMode 
                    ? 'text-red-400 bg-red-900/20 border-red-700/50 hover:bg-red-900/30' 
                    : 'text-orange-700 bg-orange-50 border-orange-300 hover:bg-orange-100'
                }`}
              >
                <Trash2 className="h-3 w-3" />
                {t("O'chirish", language)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSparePartModal;