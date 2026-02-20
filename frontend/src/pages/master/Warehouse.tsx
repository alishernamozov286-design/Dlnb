import React, { memo, useMemo, useState, useEffect, useCallback } from 'react';
import { 
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  Box,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { t } from '@/lib/transliteration';
import { formatCurrency } from '@/lib/utils';
import { useSparePartsNew } from '@/hooks/useSparePartsNew';
import api from '@/lib/api';
import API_CONFIG from '@/config/api.config';
import CreateSparePartModal from '@/components/CreateSparePartModal';
import EditSparePartModal from '@/components/EditSparePartModal';
import DeleteSparePartModal from '@/components/DeleteSparePartModal';
import ViewSparePartModal from '@/components/ViewSparePartModal';
import SellSparePartModal from '@/components/SellSparePartModal';
import WarehouseSkeleton from '@/components/WarehouseSkeleton';
import { useTheme } from '@/contexts/ThemeContext';

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// Helper function to get full image URL
const getFullImageUrl = (imagePath: string | undefined): string => {
  if (!imagePath) return '';
  
  // Base64 rasm bo'lsa, to'g'ridan-to'g'ri qaytarish (lekin bu xavfli - juda uzun)
  if (imagePath.startsWith('data:image/')) {
    console.warn('⚠️ Base64 rasm URL juda uzun - server\'ga yuklash tavsiya etiladi');
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
  
  const fullUrl = `${baseUrl}${path}`;
  
  console.log('🖼️ WAREHOUSE getFullImageUrl:', {
    imagePath,
    'API_CONFIG.BASE_URL': API_CONFIG.BASE_URL,
    baseUrl,
    path,
    fullUrl
  });
  
  return fullUrl;
};

const MasterWarehouse: React.FC = memo(() => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 50);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [salesStats, setSalesStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [activeStatsTab, setActiveStatsTab] = useState<'warehouse' | 'sales'>('warehouse');
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
        const response = await fetch('https://cbu.uz/uz/arkhiv-kursov-valyut/json/');
        const data = await response.json();
        
        const usdData = data.find((item: any) => item.Ccy === 'USD');
        if (usdData) {
          setUsdRate(parseFloat(usdData.Rate));
        }
      } catch (error) {
        console.error('Dollar kursini olishda xatolik:', error);
      } finally {
        setIsLoadingRate(false);
      }
    };

    fetchUsdRate();
    const interval = setInterval(fetchUsdRate, 60 * 60 * 1000);
    return () => clearInterval(interval);
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
    return formatCurrency(amount, language);
  };

  // YANGI HOOK - Cars kabi
  const { 
    spareParts, 
    loading: isLoading,
    createSparePart,
    updateSparePart,
    deleteSparePart,
    sellSparePart,
    refetch: refetchSpareParts
  } = useSparePartsNew();

  // Umumiy loading holati - barcha statistikalar bir vaqtda
  const isAllStatsLoading = isLoading || isLoadingStats;

  const filteredParts = useMemo(() => {
    if (!spareParts.length) return [];
    if (!debouncedSearch) return spareParts.filter((part: any) => part && part._id);
    
    const searchLower = debouncedSearch.toLowerCase();
    return spareParts.filter((part: any) => {
      // Null/undefined check
      if (!part || !part._id) return false;
      
      // Nom bo'yicha qidirish
      const nameMatch = part.name && part.name.toLowerCase().includes(searchLower);
      
      // Supplier bo'yicha qidirish
      const supplierMatch = part.supplier && part.supplier.toLowerCase().includes(searchLower);
      
      // Kategoriya bo'yicha qidirish - YAXSHILANGAN
      const categoryMatch = part.category && (
        (part.category === 'balon' && (
          'balon'.includes(searchLower) || 
          'tire'.includes(searchLower) ||
          'шина'.includes(searchLower) || // Kirill
          'балон'.includes(searchLower)    // Kirill
        )) ||
        (part.category === 'zapchast' && (
          'zapchast'.includes(searchLower) || 
          'spare'.includes(searchLower) ||
          'запчаст'.includes(searchLower)  // Kirill
        )) ||
        (part.category === 'boshqa' && (
          'boshqa'.includes(searchLower) || 
          'other'.includes(searchLower) ||
          'бошқа'.includes(searchLower)    // Kirill
        ))
      );
      
      // Balon ma'lumotlari bo'yicha qidirish
      const tireMatch = part.category === 'balon' && (
        (part.tireSize && part.tireSize.toLowerCase().includes(searchLower)) ||
        (part.tireFullSize && part.tireFullSize.toLowerCase().includes(searchLower)) ||
        (part.tireBrand && part.tireBrand.toLowerCase().includes(searchLower)) ||
        (part.tireType && part.tireType.toLowerCase().includes(searchLower)) ||
        (part.tireCategory && part.tireCategory.toLowerCase().includes(searchLower))
      );
      
      return nameMatch || supplierMatch || categoryMatch || tireMatch;
    });
  }, [spareParts, debouncedSearch]);

  const lowStockParts = useMemo(() => {
    return spareParts.filter((part: any) => part && typeof part.quantity === 'number' && part.quantity <= 3);
  }, [spareParts]);

  const statistics = useMemo(() => {
    if (!spareParts.length) return {
      totalValue: 0,
      totalProfit: 0,
      totalItems: 0,
      totalQuantity: 0
    };

    // Faqat valid part'larni hisoblash
    const validParts = spareParts.filter((part: any) => part && part._id && typeof part.quantity === 'number');

    return {
      totalValue: validParts.reduce((sum: number, part: any) => 
        sum + ((part.sellingPrice || 0) * (part.quantity || 0)), 0),
      totalProfit: validParts.reduce((sum: number, part: any) => 
        sum + (((part.sellingPrice || 0) - (part.costPrice || 0)) * (part.quantity || 0)), 0),
      totalItems: validParts.length,
      totalQuantity: validParts.reduce((sum: number, part: any) => 
        sum + (part.quantity || 0), 0)
    };
  }, [spareParts]);

  const handleEdit = useCallback((part: any) => {
    setSelectedPart(part);
    setIsEditModalOpen(true);
  }, []);

  const handleDelete = useCallback((part: any) => {
    setSelectedPart(part);
    setIsDeleteModalOpen(true);
  }, []);

  const handleView = useCallback((part: any) => {
    setSelectedPart(part);
    setIsViewModalOpen(true);
  }, []);

  const handleSell = useCallback((part: any) => {
    setSelectedPart(part);
    setIsSellModalOpen(true);
  }, []);

  // Miqdorga qarab rang aniqlash
  const getStockColor = useCallback((quantity: number) => {
    // 3 tagacha - QIZIL
    if (quantity <= 3) {
      return {
        card: isDarkMode
          ? 'border-red-700 bg-gradient-to-br from-red-900/40 to-pink-900/40 hover:border-red-600'
          : 'border-red-500 bg-gradient-to-br from-red-100 to-pink-100 hover:border-red-600',
        badge: 'bg-gradient-to-br from-red-500 to-pink-600',
        buttons: {
          sell: isDarkMode
            ? 'bg-gray-800 border-2 border-emerald-600 text-emerald-400 hover:bg-gray-750 hover:border-emerald-500'
            : 'bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-700',
          view: isDarkMode
            ? 'bg-gray-800 border-2 border-indigo-600 text-indigo-400 hover:bg-gray-750 hover:border-indigo-500'
            : 'bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-700',
          edit: isDarkMode
            ? 'bg-gray-800 border-2 border-purple-600 text-purple-400 hover:bg-gray-750 hover:border-purple-500'
            : 'bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50 hover:border-purple-700',
          delete: isDarkMode
            ? 'bg-gray-800 border-2 border-gray-600 text-gray-400 hover:bg-gray-750 hover:border-gray-500'
            : 'bg-white border-2 border-gray-700 text-gray-700 hover:bg-gray-50 hover:border-gray-800'
        }
      };
    } 
    // 10 tagacha - SARIQ
    else if (quantity <= 10) {
      return {
        card: isDarkMode
          ? 'border-yellow-700 bg-gradient-to-br from-yellow-900/40 to-amber-900/40 hover:border-yellow-600'
          : 'border-yellow-500 bg-gradient-to-br from-yellow-100 to-amber-100 hover:border-yellow-600',
        badge: 'bg-gradient-to-br from-yellow-500 to-amber-600',
        buttons: {
          sell: isDarkMode
            ? 'bg-gray-800 border-2 border-green-600 text-green-400 hover:bg-gray-750 hover:border-green-500'
            : 'bg-white border-2 border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700',
          view: isDarkMode
            ? 'bg-gray-800 border-2 border-blue-600 text-blue-400 hover:bg-gray-750 hover:border-blue-500'
            : 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700',
          edit: isDarkMode
            ? 'bg-gray-800 border-2 border-purple-600 text-purple-400 hover:bg-gray-750 hover:border-purple-500'
            : 'bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50 hover:border-purple-700',
          delete: isDarkMode
            ? 'bg-gray-800 border-2 border-red-600 text-red-400 hover:bg-gray-750 hover:border-red-500'
            : 'bg-white border-2 border-red-600 text-red-600 hover:bg-red-50 hover:border-red-700'
        }
      };
    } 
    // 10 dan ko'p - YASHIL
    else {
      return {
        card: isDarkMode
          ? 'border-green-700 bg-gradient-to-br from-green-900/40 to-emerald-900/40 hover:border-green-600'
          : 'border-green-500 bg-gradient-to-br from-green-100 to-emerald-100 hover:border-green-600',
        badge: 'bg-gradient-to-br from-green-500 to-emerald-600',
        buttons: {
          sell: isDarkMode
            ? 'bg-gray-800 border-2 border-emerald-600 text-emerald-400 hover:bg-gray-750 hover:border-emerald-500'
            : 'bg-white border-2 border-emerald-700 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-800',
          view: isDarkMode
            ? 'bg-gray-800 border-2 border-blue-600 text-blue-400 hover:bg-gray-750 hover:border-blue-500'
            : 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700',
          edit: isDarkMode
            ? 'bg-gray-800 border-2 border-orange-600 text-orange-400 hover:bg-gray-750 hover:border-orange-500'
            : 'bg-white border-2 border-orange-600 text-orange-600 hover:bg-orange-50 hover:border-orange-700',
          delete: isDarkMode
            ? 'bg-gray-800 border-2 border-red-600 text-red-400 hover:bg-gray-750 hover:border-red-500'
            : 'bg-white border-2 border-red-600 text-red-600 hover:bg-red-50 hover:border-red-700'
        }
      };
    }
  }, [isDarkMode]);

  const fetchSalesStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      // Cache'ni bypass qilish uchun timestamp qo'shamiz
      const timestamp = Date.now();
      const response = await api.get(`/spare-parts/sales/statistics?_t=${timestamp}`);
      setSalesStats(response.data.statistics);
    } catch (error) {
      console.error('Error fetching sales statistics:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  const handleSellSuccess = useCallback(async (_soldQuantity: number) => {
    // Modal'ni yopish
    setIsSellModalOpen(false);
    setSelectedPart(null);
    
    // Loading state'ni yoqish
    setIsLoadingStats(true);
    
    // DARHOL statistikani yangilash (cache'siz)
    await fetchSalesStats();
  }, [fetchSalesStats]);

  useEffect(() => {
    fetchSalesStats();
  }, [fetchSalesStats]);

  return (
    <div className={`min-h-screen ${
      isDarkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-purple-50 via-indigo-50/50 to-pink-50/30'
    }`}>
      <div className="max-w-[1400px] mx-auto space-y-6 sm:space-y-7 lg:space-y-8 p-3 sm:p-5 lg:p-7 animate-fade-in">
        {/* Back Button */}
        <button
          onClick={() => navigate('/app/master/cashier')}
          className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all shadow-md hover:shadow-lg text-sm font-semibold ${
            isDarkMode
              ? 'bg-gray-800 hover:bg-gray-750 text-gray-300 border-red-900/30 hover:border-red-700'
              : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-purple-400'
          }`}
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>{t('Kassaga qaytish', language)}</span>
        </button>

        {/* Main Container - Bitta katta container */}
        <div className={`relative overflow-hidden rounded-2xl shadow-xl border ${
          isDarkMode
            ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-red-900/30'
            : 'bg-white border-gray-100/50'
        }`}>
          <div className={`absolute inset-0 ${
            isDarkMode
              ? 'bg-gradient-to-br from-red-500/5 via-red-600/5 to-gray-900/5'
              : 'bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-blue-500/5'
          }`}></div>
          <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl animate-pulse ${
            isDarkMode
              ? 'bg-gradient-to-br from-red-400/20 to-red-600/20'
              : 'bg-gradient-to-br from-purple-400/20 to-indigo-400/20'
          }`}></div>
          
          <div className="relative z-10 p-5 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className={`absolute inset-0 rounded-xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-red-600 to-red-700'
                      : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                  }`}></div>
                  <div className={`relative p-3 rounded-xl shadow-lg transform group-hover:scale-105 transition-transform ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-red-600 via-red-700 to-gray-900'
                      : 'bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600'
                  }`}>
                    <Package className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-black ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-white via-red-200 to-red-300 bg-clip-text text-transparent'
                      : 'bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent'
                  }`}>
                    {t("Ombor", language)}
                  </h1>
                  <p className={`text-sm sm:text-base font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>{t("Tovarlarni boshqarish", language)}</p>
                </div>
              </div>
              
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className={`group relative overflow-hidden px-5 py-3 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 text-sm ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-red-600 via-red-700 to-pink-700'
                    : 'bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <Plus className="h-5 w-5 relative z-10" />
                <span className="relative z-10">{t('Tovar qo\'shish', language)}</span>
              </button>
            </div>

            {/* Currency Toggle */}
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
                          : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg scale-105'
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
                          : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg scale-105'
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

            {/* Stats Tabs - 50% width on desktop, 100% on mobile */}
            <div className={`w-full lg:w-1/2 flex gap-2 mb-4 p-1 rounded-xl ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <button
                onClick={() => setActiveStatsTab('warehouse')}
                className={`flex-1 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  activeStatsTab === 'warehouse'
                    ? isDarkMode
                      ? 'bg-gradient-to-r from-red-600 via-red-700 to-gray-900 text-white shadow-md scale-105'
                      : 'bg-white text-purple-600 shadow-md scale-105'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>{t('Ombor', language)}</span>
                </div>
              </button>
              <button
                onClick={() => setActiveStatsTab('sales')}
                className={`flex-1 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  activeStatsTab === 'sales'
                    ? isDarkMode
                      ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-md scale-105'
                      : 'bg-white text-green-600 shadow-md scale-105'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>{t('Sotuvlar', language)}</span>
                </div>
              </button>
            </div>

            {/* Stats Cards - Warehouse Tab */}
            {activeStatsTab === 'warehouse' && (
              <div className="flex flex-wrap gap-4 lg:flex-nowrap">
                {isAllStatsLoading ? (
                  // Loading state
                  <>
                    <div className={`flex-1 min-w-[200px] relative overflow-hidden rounded-xl p-4 border-2 ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-red-900/40 to-pink-900/40 border-red-700'
                        : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${
                          isDarkMode ? 'bg-red-600' : 'bg-purple-500'
                        }`}>
                          <Box className="h-5 w-5 text-white" />
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          isDarkMode
                            ? 'text-red-300 bg-red-900/60'
                            : 'text-purple-700 bg-purple-100'
                        }`}>
                          {t('Jami', language)}
                        </span>
                      </div>
                      <div className={`h-8 w-16 animate-pulse rounded ${
                        isDarkMode ? 'bg-red-800' : 'bg-purple-200'
                      }`}></div>
                      <p className={`text-sm mt-2 ${
                        isDarkMode ? 'text-red-400' : 'text-purple-600'
                      }`}>{t('Tovar turlari', language)}</p>
                    </div>

                    <div className={`flex-1 min-w-[200px] relative overflow-hidden rounded-xl p-4 border-2 ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-blue-700'
                        : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${
                          isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
                        }`}>
                          <Package className="h-5 w-5 text-white" />
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          isDarkMode
                            ? 'text-blue-300 bg-blue-900/60'
                            : 'text-blue-700 bg-blue-100'
                        }`}>
                          {t('Qiymat', language)}
                        </span>
                      </div>
                      <div className={`h-8 w-20 animate-pulse rounded ${
                        isDarkMode ? 'bg-blue-800' : 'bg-blue-200'
                      }`}></div>
                      <p className={`text-sm mt-2 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`}>{t('Umumiy qiymat', language)}</p>
                    </div>

                    <div className={`flex-1 min-w-[200px] relative overflow-hidden rounded-xl p-4 border-2 ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-red-900/40 to-pink-900/40 border-red-700'
                        : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${
                          isDarkMode ? 'bg-red-600' : 'bg-red-500'
                        }`}>
                          <AlertCircle className="h-5 w-5 text-white" />
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          isDarkMode
                            ? 'text-red-300 bg-red-900/60'
                            : 'text-red-700 bg-red-100'
                        }`}>
                          {t('Ogohlantirish', language)}
                        </span>
                      </div>
                      <div className={`h-8 w-12 animate-pulse rounded ${
                        isDarkMode ? 'bg-red-800' : 'bg-red-200'
                      }`}></div>
                      <p className={`text-sm mt-2 ${
                        isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`}>{t('Kam qolgan', language)}</p>
                    </div>
                  </>
                ) : (
                  // Data loaded
                  <>
                    <div className={`flex-1 min-w-[200px] relative overflow-hidden rounded-xl p-4 border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105 ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-red-900/40 to-pink-900/40 border-red-700'
                        : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg shadow-md ${
                          isDarkMode ? 'bg-red-600' : 'bg-purple-500'
                        }`}>
                          <Box className="h-5 w-5 text-white" />
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          isDarkMode
                            ? 'text-red-300 bg-red-900/60'
                            : 'text-purple-700 bg-purple-100'
                        }`}>
                          {t('Jami', language)}
                        </span>
                      </div>
                      <div className={`text-3xl font-black mb-1 ${
                        isDarkMode ? 'text-red-300' : 'text-purple-900'
                      }`}>
                        {spareParts?.length || 0}
                      </div>
                      <p className={`text-sm font-medium ${
                        isDarkMode ? 'text-red-400' : 'text-purple-600'
                      }`}>{t('Tovar turlari', language)}</p>
                    </div>

                    <div className={`flex-1 min-w-[200px] relative overflow-hidden rounded-xl p-4 border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105 ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-blue-700'
                        : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg shadow-md ${
                          isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
                        }`}>
                          <Package className="h-5 w-5 text-white" />
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          isDarkMode
                            ? 'text-blue-300 bg-blue-900/60'
                            : 'text-blue-700 bg-blue-100'
                        }`}>
                          {t('Qiymat', language)}
                        </span>
                      </div>
                      <div className={`text-2xl font-black mb-1 ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-900'
                      }`}>
                        {formatWithCurrency(statistics.totalValue)}
                      </div>
                      <p className={`text-sm font-medium ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`}>{t('Umumiy qiymat', language)}</p>
                    </div>

                    <div className={`flex-1 min-w-[200px] relative overflow-hidden rounded-xl p-4 border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105 ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-red-900/40 to-pink-900/40 border-red-700'
                        : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg shadow-md ${
                          isDarkMode ? 'bg-red-600' : 'bg-red-500'
                        }`}>
                          <AlertCircle className="h-5 w-5 text-white" />
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          isDarkMode
                            ? 'text-red-300 bg-red-900/60'
                            : 'text-red-700 bg-red-100'
                        }`}>
                          {t('Ogohlantirish', language)}
                        </span>
                      </div>
                      <div className={`text-3xl font-black mb-1 ${
                        isDarkMode ? 'text-red-300' : 'text-red-900'
                      }`}>
                        {lowStockParts.length}
                      </div>
                      <p className={`text-sm font-medium ${
                        isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`}>{t('Kam qolgan', language)}</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Stats Cards - Sales Tab */}
            {activeStatsTab === 'sales' && (
              <div className="flex flex-wrap gap-4 lg:flex-nowrap">
                {isAllStatsLoading ? (
                  // Loading state
                  <>
                    <div className={`flex-1 min-w-[200px] rounded-xl p-4 border-2 ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-700'
                        : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded-lg ${
                          isDarkMode ? 'bg-green-600' : 'bg-green-500'
                        }`}>
                          <Package className="h-4 w-4 text-white" />
                        </div>
                        <span className={`text-xs font-semibold ${
                          isDarkMode ? 'text-green-300' : 'text-green-700'
                        }`}>{t('Sotuvlar', language)}</span>
                      </div>
                      <div className={`h-8 w-12 animate-pulse rounded ${
                        isDarkMode ? 'bg-green-800' : 'bg-green-200'
                      }`}></div>
                    </div>

                    <div className={`flex-1 min-w-[200px] rounded-xl p-4 border-2 ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-blue-700'
                        : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded-lg ${
                          isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
                        }`}>
                          <Box className="h-4 w-4 text-white" />
                        </div>
                        <span className={`text-xs font-semibold ${
                          isDarkMode ? 'text-blue-300' : 'text-blue-700'
                        }`}>{t('Miqdor', language)}</span>
                      </div>
                      <div className={`h-8 w-12 animate-pulse rounded ${
                        isDarkMode ? 'bg-blue-800' : 'bg-blue-200'
                      }`}></div>
                    </div>

                    <div className={`flex-1 min-w-[200px] rounded-xl p-4 border-2 ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-red-900/40 to-pink-900/40 border-red-700'
                        : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded-lg ${
                          isDarkMode ? 'bg-red-600' : 'bg-purple-500'
                        }`}>
                          <DollarSign className="h-4 w-4 text-white" />
                        </div>
                        <span className={`text-xs font-semibold ${
                          isDarkMode ? 'text-red-300' : 'text-purple-700'
                        }`}>{t('Tushum', language)}</span>
                      </div>
                      <div className={`h-7 w-20 animate-pulse rounded ${
                        isDarkMode ? 'bg-red-800' : 'bg-purple-200'
                      }`}></div>
                    </div>
                    
                    <div className={`flex-1 min-w-[200px] rounded-xl p-4 border-2 ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border-yellow-700'
                        : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded-lg ${
                          isDarkMode ? 'bg-yellow-600' : 'bg-yellow-500'
                        }`}>
                          <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <span className={`text-xs font-semibold ${
                          isDarkMode ? 'text-yellow-300' : 'text-yellow-700'
                        }`}>{t('Foyda', language)}</span>
                      </div>
                      <div className={`h-7 w-20 animate-pulse rounded ${
                        isDarkMode ? 'bg-yellow-800' : 'bg-yellow-200'
                      }`}></div>
                    </div>
                  </>
                ) : (
                  // Data loaded
                  <>
                    <div className={`flex-1 min-w-[200px] rounded-xl p-4 border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105 ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-700'
                        : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded-lg shadow-md ${
                          isDarkMode ? 'bg-green-600' : 'bg-green-500'
                        }`}>
                          <Package className="h-4 w-4 text-white" />
                        </div>
                        <span className={`text-xs font-semibold ${
                          isDarkMode ? 'text-green-300' : 'text-green-700'
                        }`}>{t('Sotuvlar', language)}</span>
                      </div>
                      <div className={`text-2xl font-black ${
                        isDarkMode ? 'text-green-300' : 'text-green-900'
                      }`}>
                        {salesStats?.totalSales || 0}
                      </div>
                    </div>

                    <div className={`flex-1 min-w-[200px] rounded-xl p-4 border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105 ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-blue-700'
                        : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded-lg shadow-md ${
                          isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
                        }`}>
                          <Box className="h-4 w-4 text-white" />
                        </div>
                        <span className={`text-xs font-semibold ${
                          isDarkMode ? 'text-blue-300' : 'text-blue-700'
                        }`}>{t('Miqdor', language)}</span>
                      </div>
                      <div className={`text-2xl font-black ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-900'
                      }`}>
                        {salesStats?.totalQuantitySold || 0}
                      </div>
                    </div>

                    <div className={`flex-1 min-w-[200px] rounded-xl p-4 border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105 ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-red-900/40 to-pink-900/40 border-red-700'
                        : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded-lg shadow-md ${
                          isDarkMode ? 'bg-red-600' : 'bg-purple-500'
                        }`}>
                          <DollarSign className="h-4 w-4 text-white" />
                        </div>
                        <span className={`text-xs font-semibold ${
                          isDarkMode ? 'text-red-300' : 'text-purple-700'
                        }`}>{t('Tushum', language)}</span>
                      </div>
                      <div className={`text-xl font-black ${
                        isDarkMode ? 'text-red-300' : 'text-purple-900'
                      }`}>
                        {formatWithCurrency(salesStats?.totalRevenue || 0)}
                      </div>
                    </div>

                    <div className={`flex-1 min-w-[200px] rounded-xl p-4 border-2 hover:shadow-lg transition-all cursor-pointer hover:scale-105 ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border-yellow-700'
                        : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded-lg shadow-md ${
                          isDarkMode ? 'bg-yellow-600' : 'bg-yellow-500'
                        }`}>
                          <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <span className={`text-xs font-semibold ${
                          isDarkMode ? 'text-yellow-300' : 'text-yellow-700'
                        }`}>{t('Foyda', language)}</span>
                      </div>
                      <div className={`text-xl font-black ${
                        isDarkMode ? 'text-yellow-300' : 'text-yellow-900'
                      }`}>
                        {formatWithCurrency(salesStats?.totalProfit || 0)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Search Bar */}
            <div className={`mb-6 mt-6 pt-6 border-t flex justify-end ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="relative w-full md:w-1/2">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                  isDarkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  placeholder={t('Tovar qidirish...', language)}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 text-sm font-medium transition-all ${
                    isDarkMode
                      ? 'bg-gray-800 border-red-900/30 text-white placeholder-gray-600 focus:ring-red-500 focus:border-red-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-purple-500 focus:border-transparent'
                  }`}
                />
              </div>
            </div>

            {/* Parts List */}
            <div className="mt-6">
              <h3 className={`text-lg sm:text-xl font-black flex items-center gap-2 mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <div className={`p-1.5 rounded-lg ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-red-600 via-red-700 to-gray-900'
                    : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                }`}>
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                {t("Tovarlar ro'yxati", language)}
              </h3>

              <div className="pr-2">
              {/* Skeleton loader - faqat birinchi yuklanishda */}
              {isLoading && !spareParts.length ? (
                <WarehouseSkeleton />
              ) : filteredParts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="relative inline-block mb-4">
                    <div className={`absolute inset-0 rounded-full blur-xl opacity-50 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                    <div className={`relative p-5 rounded-full ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-gray-800 to-gray-900'
                        : 'bg-gradient-to-br from-gray-100 to-gray-200'
                    }`}>
                      <Package className={`h-12 w-12 ${
                        isDarkMode ? 'text-gray-600' : 'text-gray-400'
                      }`} />
                    </div>
                  </div>
                  <p className={`text-base font-semibold mb-2 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>{t('Tovarlar yo\'q', language)}</p>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {searchQuery ? t('Qidiruv natijasi topilmadi', language) : t('Tovar qo\'shing', language)}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredParts.map((part: any) => {
                    const stockColor = getStockColor(part.quantity);
                    return (
                      <div 
                        key={part._id} 
                        className={`group relative overflow-hidden rounded-lg p-3 border-2 hover:shadow-lg transition-all duration-300 ${stockColor.card}`}
                      >
                        {/* Top Badge */}
                        <div className="flex items-center justify-between mb-2">
                          <div className={`p-1.5 rounded-lg shadow-md ${stockColor.badge}`}>
                            <Package className="h-3.5 w-3.5 text-white" />
                          </div>
                          {part.quantity <= 3 && (
                            <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700 border border-red-300 animate-pulse">
                              {t('Kam qolgan!', language)}
                            </span>
                          )}
                        </div>

                      {/* Product Name */}
                      <div className="mb-2">
                        {/* Rasm yoki Settings icon */}
                        <div className={`mb-2 rounded-lg overflow-hidden border-2 ${
                          isDarkMode ? 'border-gray-700' : 'border-gray-300'
                        }`}>
                          {part.imageUrl ? (
                            <img
                              src={getFullImageUrl(part.imageUrl)}
                              alt={part.name}
                              className="w-full h-24 object-cover"
                              onError={(e) => {
                                console.error('❌ Rasm yuklanmadi:', part.imageUrl);
                                console.error('📍 To\'liq URL:', getFullImageUrl(part.imageUrl));
                                // Rasm yuklanmasa, Settings icon ko'rsatish
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector('.settings-icon-placeholder')) {
                                  const placeholder = document.createElement('div');
                                  placeholder.className = `settings-icon-placeholder w-full h-24 flex items-center justify-center relative overflow-hidden ${
                                    isDarkMode 
                                      ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800' 
                                      : 'bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100'
                                  }`;
                                  placeholder.innerHTML = `
                                    <div class="absolute inset-0 ${
                                      isDarkMode 
                                        ? 'bg-gradient-to-br from-red-500/5 to-transparent' 
                                        : 'bg-gradient-to-br from-purple-500/5 to-transparent'
                                    }"></div>
                                    <div class="relative">
                                      <div class="absolute inset-0 ${
                                        isDarkMode 
                                          ? 'bg-red-600' 
                                          : 'bg-purple-500'
                                      } rounded-full blur-xl opacity-20 animate-pulse"></div>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="relative ${
                                        isDarkMode ? 'text-gray-600' : 'text-gray-400'
                                      } animate-spin-slow">
                                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                      </svg>
                                    </div>
                                  `;
                                  parent.appendChild(placeholder);
                                }
                              }}
                            />
                          ) : (
                            <div className={`w-full h-24 flex items-center justify-center relative overflow-hidden ${
                              isDarkMode 
                                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800' 
                                : 'bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50'
                            }`}>
                              {/* Animated background gradient */}
                              <div className={`absolute inset-0 ${
                                isDarkMode 
                                  ? 'bg-gradient-to-br from-red-500/5 to-transparent' 
                                  : 'bg-gradient-to-br from-purple-500/5 to-transparent'
                              }`}></div>
                              
                              {/* Glow effect - kuchliroq */}
                              <div className={`absolute inset-0 flex items-center justify-center ${
                                isDarkMode ? 'opacity-20' : 'opacity-30'
                              }`}>
                                <div className={`w-20 h-20 rounded-full blur-3xl animate-pulse ${
                                  isDarkMode 
                                    ? 'bg-red-600' 
                                    : 'bg-purple-500'
                                }`}></div>
                              </div>
                              
                              {/* Settings icon with slow rotation */}
                              <div className="relative">
                                <Settings className={`h-12 w-12 ${
                                  isDarkMode ? 'text-gray-600' : 'text-purple-400'
                                }`} style={{ animation: 'spin 8s linear infinite' }} />
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <h4 className={`font-bold text-sm line-clamp-2 min-h-[2.5rem] ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {part.name}
                        </h4>
                        
                        {/* Kategoriya va balon ma'lumotlari */}
                        {part.category === 'balon' && (
                          <div className="mt-2 space-y-1">
                            <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full border ${
                              isDarkMode
                                ? 'bg-orange-900/60 text-orange-300 border-orange-700'
                                : 'bg-orange-100 text-orange-700 border-orange-300'
                            }`}>
                              🚗 {t('Balon', language)}
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {part.tireSize && (
                                <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                                  isDarkMode
                                    ? 'bg-blue-900/60 text-blue-300'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {part.tireSize}
                                </span>
                              )}
                              {part.tireFullSize && (
                                <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                                  isDarkMode
                                    ? 'bg-purple-900/60 text-purple-300'
                                    : 'bg-purple-100 text-purple-700'
                                }`}>
                                  {part.tireFullSize}
                                </span>
                              )}
                              {part.tireBrand && (
                                <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                                  isDarkMode
                                    ? 'bg-green-900/60 text-green-300'
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {part.tireBrand}
                                </span>
                              )}
                              {part.tireType && (
                                <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                                  isDarkMode
                                    ? 'bg-cyan-900/60 text-cyan-300'
                                    : 'bg-cyan-100 text-cyan-700'
                                }`}>
                                  {part.tireType === 'yozgi' ? '☀️' : part.tireType === 'qishki' ? '❄️' : '🔄'} {part.tireType}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Zapchast va boshqa kategoriyalar uchun */}
                        {(part.category === 'zapchast' || part.category === 'boshqa') && (
                          <div className="mt-2">
                            <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full border ${
                              isDarkMode
                                ? 'bg-blue-900/60 text-blue-300 border-blue-700'
                                : 'bg-blue-100 text-blue-700 border-blue-300'
                            }`}>
                              {part.category === 'zapchast' ? '🔧 ' + t('Zapchast', language) : '📦 ' + t('Boshqa', language)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Quantity & Price */}
                      <div className="space-y-1.5 mb-2">
                        <div className={`flex items-center justify-between rounded-lg p-1.5 ${
                          isDarkMode
                            ? 'bg-gray-800/60 border border-gray-700'
                            : 'bg-white/60'
                        }`}>
                          <span className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>{t('Miqdor', language)}</span>
                          <span className={`text-sm font-bold ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {part.quantity} {part.unit}
                          </span>
                        </div>
                        <div className={`flex items-center justify-between rounded-lg p-1.5 ${
                          isDarkMode
                            ? 'bg-gray-800/60 border border-gray-700'
                            : 'bg-white/60'
                        }`}>
                          <span className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>{t('Narx', language)}</span>
                          <span className={`text-sm font-bold ${
                            isDarkMode ? 'text-red-400' : 'text-purple-600'
                          }`}>
                            {formatWithCurrency(part.sellingPrice || part.price || 0)}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons - CARD RANGIGA MOS */}
                      <div className={`mt-2 rounded-lg p-1.5 border-2 shadow-md ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-700'
                          : 'bg-white border-gray-300'
                      }`}>
                        <div className="grid grid-cols-4 gap-1.5">
                          <button
                            onClick={() => handleSell(part)}
                            className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105"
                            title={t('Sotish', language)}
                          > 
                            <DollarSign className="h-4 w-4 font-bold" />
                          </button>
                          <button
                            onClick={() => handleView(part)}
                            className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105"
                            title={t('Ko\'rish', language)}
                          >
                            <Eye className="h-4 w-4 font-bold" />
                          </button>
                          <button
                            onClick={() => handleEdit(part)}
                            className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105"
                            title={t('Tahrirlash', language)}
                          >
                            <Edit className="h-4 w-4 font-bold" />
                          </button>
                          <button
                            onClick={() => handleDelete(part)}
                            className="p-2 bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 transition-all flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105"
                            title={t('O\'chirish', language)}
                          >
                            <Trash2 className="h-4 w-4 font-bold" />
                          </button>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateSparePartModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          console.log('🎉 Zapchast yaratildi - sahifani yangilash');
          
          // Ma'lumotlarni yangilash - DARHOL
          refetchSpareParts();
          fetchSalesStats();
        }}
        createSparePart={createSparePart}
      />
      {selectedPart && (
        <>
          <EditSparePartModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedPart(null);
            }}
            onSuccess={async () => {
              // Modal'ni yopish
              setIsEditModalOpen(false);
              setSelectedPart(null);
              
              // Ma'lumotlarni yangilash
              await refetchSpareParts();
            }}
            sparePart={selectedPart}
            updateSparePart={updateSparePart}
          />
          <DeleteSparePartModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedPart(null);
            }}
            onSuccess={async () => {
              // Modal'ni yopish
              setIsDeleteModalOpen(false);
              setSelectedPart(null);
              
              // Loading state'ni yoqish
              setIsLoadingStats(true);
              
              // Ma'lumotlarni yangilash
              await Promise.all([
                refetchSpareParts(),
                fetchSalesStats()
              ]);
            }}
            sparePart={selectedPart}
            deleteSparePart={deleteSparePart}
          /> 
          <ViewSparePartModal
            isOpen={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedPart(null);
            }}
            sparePart={selectedPart}
            currency={currency}
            usdRate={usdRate}
          />
          <SellSparePartModal
            isOpen={isSellModalOpen}
            onClose={() => {
              setIsSellModalOpen(false);
              setSelectedPart(null);
            }}
            onSuccess={handleSellSuccess}
            sparePart={selectedPart}
            sellSparePart={sellSparePart}
          />
        </>
      )}
    </div>
  );
});

export default MasterWarehouse;
 