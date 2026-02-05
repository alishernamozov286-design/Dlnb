import React, { memo, useMemo, useState } from 'react';
import { 
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  TrendingDown,
  Box,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { t } from '@/lib/transliteration';
import { formatCurrency } from '@/lib/utils';
import { useSpareParts } from '@/hooks/useSpareParts';
import CreateSparePartModal from '@/components/CreateSparePartModal';
import EditSparePartModal from '@/components/EditSparePartModal';
import DeleteSparePartModal from '@/components/DeleteSparePartModal';
import ViewSparePartModal from '@/components/ViewSparePartModal';

const MasterWarehouse: React.FC = memo(() => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<any>(null);

  const language = useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const { data: sparePartsData, isLoading, refetch } = useSpareParts();

  const spareParts = sparePartsData?.spareParts || [];

  const filteredParts = useMemo(() => {
    if (!spareParts) return [];
    return spareParts.filter((part: any) =>
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.code?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [spareParts, searchQuery]);

  const lowStockParts = useMemo(() => {
    if (!spareParts) return [];
    return spareParts.filter((part: any) => part.quantity <= part.minQuantity);
  }, [spareParts]);

  const totalValue = useMemo(() => {
    if (!spareParts) return 0;
    return spareParts.reduce((sum: number, part: any) => sum + (part.price * part.quantity), 0);
  }, [spareParts]);

  const handleEdit = (part: any) => {
    setSelectedPart(part);
    setIsEditModalOpen(true);
  };

  const handleDelete = (part: any) => {
    setSelectedPart(part);
    setIsDeleteModalOpen(true);
  };

  const handleView = (part: any) => {
    setSelectedPart(part);
    setIsViewModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/40">
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6 p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Back Button */}
        <button
          onClick={() => navigate('/app/master/cashier')}
          className="group flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-all shadow-md hover:shadow-lg"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold">{t('Kassaga qaytish', language)}</span>
        </button>

        {/* Header Section */}
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl border border-gray-100/50">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-blue-500/5"></div>
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
          
          <div className="relative z-10 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity"></div>
                  <div className="relative p-4 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-2xl shadow-xl transform group-hover:scale-105 transition-transform">
                    <Package className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent mb-1">
                    {t("Ombor", language)}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 font-medium">{t("Tovarlarni boshqarish", language)}</p>
                </div>
              </div>
              
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="group relative overflow-hidden px-6 py-3 bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <Plus className="h-5 w-5 relative z-10" />
                <span className="relative z-10">{t('Tovar qo\'shish', language)}</span>
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
              <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Box className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                    {t('Jami', language)}
                  </span>
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {isLoading ? '...' : spareParts?.length || 0}
                </div>
                <p className="text-xs text-purple-600 mt-1">{t('Tovar turlari', language)}</p>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                    {t('Qiymat', language)}
                  </span>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {isLoading ? '...' : formatCurrency(totalValue)}
                </div>
                <p className="text-xs text-blue-600 mt-1">{t('Umumiy qiymat', language)}</p>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 border border-red-200 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-red-500 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full">
                    {t('Ogohlantirish', language)}
                  </span>
                </div>
                <div className="text-2xl font-bold text-red-900">
                  {isLoading ? '...' : lowStockParts.length}
                </div>
                <p className="text-xs text-red-600 mt-1">{t('Kam qolgan', language)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockParts.length > 0 && (
          <div className="relative overflow-hidden bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-5 border-2 border-red-200 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500 rounded-xl">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-2">{t('Kam qolgan tovarlar', language)}</h3>
                <div className="space-y-2">
                  {lowStockParts.slice(0, 3).map((part: any) => (
                    <div key={part._id} className="flex items-center justify-between bg-white/60 rounded-lg p-3">
                      <span className="font-semibold text-gray-900">{part.name}</span>
                      <span className="text-sm text-red-600 font-bold">
                        {part.quantity} / {part.minQuantity} {part.unit}
                      </span>
                    </div>
                  ))}
                </div>
                {lowStockParts.length > 3 && (
                  <p className="text-sm text-red-600 mt-2">
                    +{lowStockParts.length - 3} {t('ta boshqa', language)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('Tovar qidirish...', language)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400 shadow-lg"
          />
        </div>

        {/* Parts List */}
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl border border-gray-100/50 p-5 sm:p-7">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent"></div>
          
          <div className="relative z-10">
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              {t("Tovarlar ro'yxati", language)}
            </h3>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="relative mx-auto w-16 h-16 mb-4">
                    <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-base text-gray-600 font-medium">{t('Yuklanmoqda...', language)}</p>
                </div>
              ) : filteredParts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-gray-200 rounded-full blur-xl opacity-50"></div>
                    <div className="relative p-5 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-base text-gray-600 font-semibold mb-2">{t('Tovarlar yo\'q', language)}</p>
                  <p className="text-sm text-gray-400">
                    {searchQuery ? t('Qidiruv natijasi topilmadi', language) : t('Tovar qo\'shing', language)}
                  </p>
                </div>
              ) : (
                filteredParts.map((part: any) => (
                  <div 
                    key={part._id} 
                    className={`group relative overflow-hidden rounded-2xl p-4 sm:p-5 border-2 hover:shadow-xl transition-all duration-300 hover:scale-[1.01] ${
                      part.quantity <= part.minQuantity
                        ? 'border-red-200 bg-gradient-to-r from-red-50 via-pink-50/50 to-transparent hover:border-red-300'
                        : 'border-purple-200 bg-gradient-to-r from-purple-50 via-indigo-50/50 to-transparent hover:border-purple-300'
                    }`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      part.quantity <= part.minQuantity ? 'bg-gradient-to-b from-red-500 to-pink-600' : 'bg-gradient-to-b from-purple-500 to-indigo-600'
                    }`}></div>
                    
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-xl shadow-md group-hover:shadow-lg transition-shadow ${
                          part.quantity <= part.minQuantity ? 'bg-gradient-to-br from-red-500 to-pink-600' : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                        }`}>
                          <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-bold text-base sm:text-lg text-gray-900 truncate">
                              {part.name}
                            </h4>
                            {part.code && (
                              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                                {part.code}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center gap-1.5 bg-white/80 px-2.5 py-1 rounded-lg">
                              <TrendingDown className="h-3.5 w-3.5" />
                              {part.quantity} {part.unit}
                            </span>
                            <span className="font-bold text-purple-600">
                              {formatCurrency(part.price)} / {part.unit}
                            </span>
                          </div>
                          {part.quantity <= part.minQuantity && (
                            <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold">
                              <AlertCircle className="h-3.5 w-3.5" />
                              {t('Minimal miqdor:', language)} {part.minQuantity} {part.unit}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(part)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          title={t('Ko\'rish', language)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(part)}
                          className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-colors"
                          title={t('Tahrirlash', language)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(part)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title={t('O\'chirish', language)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
      <CreateSparePartModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          refetch();
        }}
      />
      {selectedPart && (
        <>
          <EditSparePartModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedPart(null);
            }}
            onSuccess={() => {
              setIsEditModalOpen(false);
              setSelectedPart(null);
              refetch();
            }}
            sparePart={selectedPart}
          />
          <DeleteSparePartModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedPart(null);
            }}
            onSuccess={() => {
              setIsDeleteModalOpen(false);
              setSelectedPart(null);
              refetch();
            }}
            sparePart={selectedPart}
          />
          <ViewSparePartModal
            isOpen={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedPart(null);
            }}
            sparePart={selectedPart}
          />
        </>
      )}
    </div>
  );
});

export default MasterWarehouse;
 