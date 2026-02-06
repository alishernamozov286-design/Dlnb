import React, { useEffect, useState } from 'react';
import { X, TrendingUp, DollarSign, Package, BarChart3 } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface SalesStatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SalesStatisticsModal: React.FC<SalesStatisticsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [statistics, setStatistics] = useState<any>(null);
  const [topSelling, setTopSelling] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const language = (localStorage.getItem('language') as 'latin' | 'cyrillic') || 'latin';

  useEffect(() => {
    if (isOpen) {
      fetchStatistics();
    }
  }, [isOpen]);

  const fetchStatistics = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/spare-parts/sales/statistics');
      setStatistics(response.data.statistics);
      setTopSelling(response.data.topSelling);
    } catch (error: any) {
      console.error('Error fetching sales statistics:', error);
      toast.error(t('Statistikani yuklashda xatolik', language));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {t('Sotuvlar statistikasi', language)}
                </h2>
                <p className="text-sm text-white/80 mt-1">{t('Ombor sotuvlari', language)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="relative mx-auto w-16 h-16 mb-4">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-base text-gray-600 font-medium">{t('Yuklanmoqda...', language)}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-blue-700">{t('Sotuvlar', language)}</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {statistics?.totalSales || 0}
                  </div>
                  <p className="text-xs text-blue-600 mt-1">{t('Jami sotuvlar soni', language)}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-purple-700">{t('Miqdor', language)}</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    {statistics?.totalQuantitySold || 0}
                  </div>
                  <p className="text-xs text-purple-600 mt-1">{t('Sotilgan dona', language)}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-green-700">{t('Tushum', language)}</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {formatCurrency(statistics?.totalRevenue || 0)}
                  </div>
                  <p className="text-xs text-green-600 mt-1">{t('Jami tushum', language)}</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-5 border-2 border-yellow-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-yellow-500 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-yellow-700">{t('Foyda', language)}</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-900">
                    {formatCurrency(statistics?.totalProfit || 0)}
                  </div>
                  <p className="text-xs text-yellow-600 mt-1">{t('Sof foyda', language)}</p>
                </div>
              </div>

              {topSelling && topSelling.length > 0 && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    {t('Eng ko\'p sotiladigan tovarlar', language)}
                  </h3>
                  <div className="space-y-3">
                    {topSelling.map((item: any, index: number) => (
                      <div key={item._id} className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg font-bold text-sm">
                              {index + 1}
                            </div>
                            <span className="font-bold text-gray-900">{item.sparePartName}</span>
                          </div>
                          <span className="text-sm font-semibold text-blue-600">
                            {item.salesCount} {t('ta sotuv', language)}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600 text-xs">{t('Miqdor', language)}</p>
                            <p className="font-bold text-gray-900">{item.totalQuantity} dona</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs">{t('Tushum', language)}</p>
                            <p className="font-bold text-green-600">{formatCurrency(item.totalRevenue)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs">{t('Foyda', language)}</p>
                            <p className="font-bold text-yellow-600">{formatCurrency(item.totalProfit)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesStatisticsModal;
