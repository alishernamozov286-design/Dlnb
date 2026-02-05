import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, AlertTriangle, Edit, Trash2, TrendingUp, Eye, DollarSign, Box } from 'lucide-react';
import { t } from '@/lib/transliteration';
import SparePartExpenseModal from '../../components/SparePartExpenseModal';
import EditSparePartModal from '../../components/EditSparePartModal';
import ViewSparePartModal from '../../components/ViewSparePartModal';
import DeleteSparePartModal from '../../components/DeleteSparePartModal';

interface SparePart {
  _id: string;
  name: string;
  price: number;
  costPrice?: number;
  sellingPrice?: number;
  profit?: number;
  quantity: number;
  supplier: string;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const SpareParts: React.FC = () => {
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [filteredParts, setFilteredParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);

  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  useEffect(() => {
    fetchSpareParts();
  }, []);

  useEffect(() => {
    filterParts();
  }, [spareParts, searchTerm]);

  const fetchSpareParts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/spare-parts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSpareParts(data.spareParts || []);
    } catch (error) {
      console.error('Error fetching spare parts:', error);
      setSpareParts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterParts = () => {
    let filtered = [...spareParts];

    if (searchTerm) {
      filtered = filtered.filter(part =>
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredParts(filtered);
  };

  const handleView = (part: SparePart) => {
    setSelectedPart(part);
    setIsViewModalOpen(true);
  };

  const handleEdit = (part: SparePart) => {
    setSelectedPart(part);
    setIsEditModalOpen(true);
  };

  const handleDelete = (part: SparePart) => {
    setSelectedPart(part);
    setIsDeleteModalOpen(true);
  };

  const handleEditFromView = () => {
    setIsViewModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleDeleteFromView = () => {
    setIsViewModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const closeAllModals = () => {
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedPart(null);
  };

  const lowStockCount = spareParts.filter(p => p.quantity <= 3).length;
  const totalValue = spareParts.reduce((sum, p) => sum + ((p.sellingPrice || p.price) * p.quantity), 0);
  const totalProfit = spareParts.reduce((sum, p) => sum + ((p.profit || ((p.sellingPrice || p.price) - (p.costPrice || p.price))) * p.quantity), 0);
  const totalQuantity = spareParts.reduce((sum, p) => sum + p.quantity, 0);

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return {
        status: 'tugagan',
        color: 'from-red-600 via-red-700 to-red-800',
        bgColor: 'from-red-100 to-red-200',
        borderColor: 'border-red-500',
        textColor: 'text-red-700',
        icon: AlertTriangle,
        label: t('Tugagan', language)
      };
    } else if (quantity <= 3) {
      return {
        status: 'kam',
        color: 'from-orange-600 via-orange-700 to-orange-800',
        bgColor: 'from-orange-50 to-orange-100',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-600',
        icon: AlertTriangle,
        label: t('Kam qolgan', language)
      };
    } else if (quantity <= 10) {
      return {
        status: 'normal',
        color: 'from-blue-500 via-blue-600 to-blue-700',
        bgColor: 'from-blue-50 to-blue-100',
        borderColor: 'border-blue-300',
        textColor: 'text-blue-600',
        icon: Package,
        label: t('Normal', language)
      };
    } else {
      return {
        status: 'yetarli',
        color: 'from-green-600 via-green-600 to-green-700',
        bgColor: 'from-green-50 to-green-100',
        borderColor: 'border-green-200',
        textColor: 'text-green-600',
        icon: Package,
        label: t('Yetarli', language)
      };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 sm:py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-t-blue-600 absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 sm:mt-6 text-gray-600 font-medium text-sm sm:text-base">{t("Zapchastlar yuklanmoqda...", language)}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-2 sm:p-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 rounded-xl sm:rounded-3xl shadow-2xl p-3 sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center space-x-3 sm:space-x-6">
              <div className="bg-white/20 backdrop-blur-xl p-2.5 sm:p-4 rounded-lg sm:rounded-2xl shadow-lg">
                <Package className="h-6 w-6 sm:h-10 sm:w-10 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 tracking-tight">{t('Zapchastlar', language)}</h1>
                <p className="text-purple-100 text-xs sm:text-base lg:text-lg">
                  {spareParts.length} ta zapchast mavjud
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="group relative bg-white hover:bg-purple-50 text-purple-600 px-4 py-3 sm:px-6 sm:py-3.5 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center space-x-2 hover:scale-105 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-90 transition-transform duration-300" />
              <span className="text-sm sm:text-base font-semibold">
                {t('Yangi zapchast', language)}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:gap-6 lg:grid-cols-5">
          <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-6 border border-blue-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs font-medium text-blue-600 mb-1">{t('Jami', language)}</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-blue-900">{spareParts.length}</p>
              </div>
              <div className="flex h-8 w-8 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-lg sm:rounded-xl bg-blue-500 shadow-lg">
                <Package className="h-4 w-4 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-6 border border-purple-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs font-medium text-purple-600 mb-1">{t('Miqdor', language)}</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-purple-900">{totalQuantity}</p>
              </div>
              <div className="flex h-8 w-8 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-lg sm:rounded-xl bg-purple-500 shadow-lg">
                <Box className="h-4 w-4 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 p-3 sm:p-6 border border-orange-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs font-medium text-orange-600 mb-1">{t('Kam', language)}</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-orange-900">{lowStockCount}</p>
              </div>
              <div className="flex h-8 w-8 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-lg sm:rounded-xl bg-orange-500 shadow-lg">
                <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-6 border border-green-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs font-medium text-green-600 mb-1">{t('Qiymat', language)}</p>
                <p className="text-sm sm:text-lg lg:text-xl font-bold text-green-900">
                  {totalValue.toLocaleString()}
                </p>
              </div>
              <div className="flex h-8 w-8 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-lg sm:rounded-xl bg-green-500 shadow-lg">
                <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 p-3 sm:p-6 border border-emerald-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs font-medium text-emerald-600 mb-1">{t('Foyda', language)}</p>
                <p className="text-sm sm:text-lg lg:text-xl font-bold text-emerald-900">
                  {totalProfit.toLocaleString()}
                </p>
              </div>
              <div className="flex h-8 w-8 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-500 shadow-lg">
                <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('Zapchast nomi yoki yetkazib beruvchi bo\'yicha qidirish...', language)}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm font-medium placeholder:text-gray-400"
            />
          </div>
        </div>

        {filteredParts.length === 0 ? (
            <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-16 text-center">
              <div className="max-w-md mx-auto">
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-full w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Package className="h-8 w-8 sm:h-12 sm:w-12 text-purple-600" />
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">{t('Zapchastlar topilmadi', language)}</h3>
                <p className="text-gray-600 mb-4 sm:mb-8 text-sm sm:text-base px-4 sm:px-0">
                  {searchTerm
                    ? t('Qidiruv so\'rovingizga mos zapchastlar topilmadi.', language)
                    : t('Tizimga birinchi zapchastni qo\'shishdan boshlang.', language)
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
                  >
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    {t('Birinchi zapchastni qo\'shish', language)}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredParts.map((part) => {
                const stockStatus = getStockStatus(part.quantity);
                const costPrice = part.costPrice || part.price;
                const sellingPrice = part.sellingPrice || part.price;
                const profit = part.profit || (sellingPrice - costPrice);
                const totalValue = sellingPrice * part.quantity;
                const totalProfit = profit * part.quantity;
                const StatusIcon = stockStatus.icon;
                
                return (
                  <div
                    key={part._id}
                    className={`group relative bg-white rounded-lg sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border ${stockStatus.borderColor} hover:border-purple-200 hover:-translate-y-1 ${part.quantity === 0 ? 'opacity-75' : ''}`}
                  >
                    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-30">
                      <div className={`bg-gradient-to-r ${stockStatus.bgColor} border ${stockStatus.borderColor} px-2 py-1 sm:px-3 sm:py-1.5 rounded-full flex items-center space-x-1 sm:space-x-2 shadow-sm`}>
                        <StatusIcon className={`w-3 h-3 sm:w-4 sm:h-4 ${stockStatus.textColor}`} />
                        <span className={`text-xs font-semibold ${stockStatus.textColor.replace('text-', 'text-').replace('-600', '-700')} hidden sm:inline`}>
                          {stockStatus.label}
                        </span>
                      </div>
                    </div>

                    <div className={`bg-gradient-to-br ${stockStatus.color} p-3 sm:p-6 pb-4 sm:pb-8`}>
                      <div className="flex items-start space-x-2 sm:space-x-4">
                        <div className="bg-white/20 backdrop-blur-xl p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg">
                          <Box className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-xl font-bold text-white mb-1 truncate">
                            {part.name}
                          </h3>
                          <div className="flex items-center space-x-2 text-purple-100">
                            <span className="text-xs sm:text-sm font-medium truncate">{part.supplier}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 sm:p-6 space-y-2 sm:space-y-4">
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div className={`bg-gradient-to-br ${stockStatus.bgColor} rounded-lg sm:rounded-xl p-2.5 sm:p-4 border ${stockStatus.borderColor}`}>
                          <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                            <StatusIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${stockStatus.textColor}`} />
                            <span className={`text-xs font-semibold ${stockStatus.textColor} uppercase hidden sm:inline`}>{t('Miqdor', language)}</span>
                          </div>
                          <p className={`text-base sm:text-2xl font-bold ${stockStatus.textColor.replace('text-', 'text-').replace('-600', '-900')}`}>
                            {part.quantity}
                          </p>
                          <p className="text-xs text-gray-500 sm:hidden">{t('dona', language)}</p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-orange-100">
                          <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                            <span className="text-xs font-semibold text-orange-600 uppercase hidden sm:inline">{t("O'zini", language)}</span>
                          </div>
                          <p className="text-sm sm:text-lg font-bold text-orange-900 truncate">
                            {costPrice.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 sm:hidden">{t("so'm", language)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-2 sm:p-2.5 border border-green-100">
                          <div className="flex items-center space-x-1 mb-0.5">
                            <DollarSign className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600" />
                            <span className="text-[10px] sm:text-xs font-semibold text-green-600 uppercase">{t('Sotish', language)}</span>
                          </div>
                          <p className="text-sm sm:text-base font-bold text-green-900 truncate">
                            {sellingPrice.toLocaleString()}
                          </p>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-2 sm:p-2.5 border border-emerald-100">
                          <div className="flex items-center space-x-1 mb-0.5">
                            <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-600" />
                            <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 uppercase">{t('Foyda', language)}</span>
                          </div>
                          <p className="text-sm sm:text-base font-bold text-emerald-900 truncate">
                            {profit.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-2 sm:p-2.5 border border-purple-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] sm:text-xs font-semibold text-purple-600 uppercase">{t('Jami qiymat', language)}</span>
                          <span className="text-sm sm:text-base font-bold text-purple-900">
                            {totalValue.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-2 sm:p-2.5 border border-emerald-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 uppercase">{t('Jami foyda', language)}</span>
                          <span className="text-sm sm:text-base font-bold text-emerald-900">
                            {totalProfit.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-2 sm:p-2.5 border border-blue-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] sm:text-xs font-semibold text-blue-600 uppercase">{t('Ishlatilgan', language)}</span>
                          <span className="text-sm sm:text-base font-bold text-blue-900">
                            {part.usageCount} {t('marta', language)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="px-2.5 sm:px-4 pb-2.5 sm:pb-4">
                      <div className="flex items-stretch gap-1.5 sm:gap-2 pt-2 sm:pt-3 border-t border-gray-100">
                        <button 
                          onClick={() => handleView(part)}
                          className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 sm:py-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg sm:rounded-xl transition-all duration-200 font-medium group"
                          title={t("Ko'rish", language)}
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform" />
                          <span className="text-xs sm:text-sm">{t("Ko'rish", language)}</span>
                        </button>
                        <button 
                          onClick={() => handleEdit(part)}
                          className="p-1.5 sm:p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg sm:rounded-xl transition-all duration-200"
                          title={t('Tahrirlash', language)}
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(part)}
                          className="p-1.5 sm:p-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg sm:rounded-xl transition-all duration-200"
                          title={t("O'chirish", language)}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>

      <SparePartExpenseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        createExpense={false}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          window.location.reload();
        }}
      />

      {selectedPart && (
        <>
          <ViewSparePartModal
            isOpen={isViewModalOpen}
            onClose={closeAllModals}
            sparePart={selectedPart}
            onEdit={handleEditFromView}
            onDelete={handleDeleteFromView}
          />

          <EditSparePartModal
            isOpen={isEditModalOpen}
            onClose={closeAllModals}
            sparePart={selectedPart}
            onSuccess={() => {
              fetchSpareParts();
            }}
          />

          <DeleteSparePartModal
            isOpen={isDeleteModalOpen}
            onClose={closeAllModals}
            sparePart={selectedPart}
            onSuccess={fetchSpareParts}
          />
        </>
      )}
    </div>
  );
};

export default SpareParts;
