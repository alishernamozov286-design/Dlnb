import React from 'react';
import { X, Package, DollarSign, TrendingUp, Calendar, Edit, Trash2 } from 'lucide-react';
import { t } from '@/lib/transliteration';

interface SparePart {
  _id: string;
  name: string;
  price: number;
  costPrice?: number; // O'zini narxi
  sellingPrice?: number; // Sotish narxi
  profit?: number; // Foyda (virtual field)
  quantity: number;
  supplier: string;
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
}

const ViewSparePartModal: React.FC<ViewSparePartModalProps> = ({ 
  isOpen, 
  onClose, 
  sparePart, 
  onEdit, 
  onDelete 
}) => {
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[95vh] overflow-hidden mx-2">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
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
              <span className="text-xs text-blue-100">{sparePart.supplier}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(95vh-140px)] scrollbar-hide">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-600">{t('Miqdor', language)}</span>
              </div>
              <p className="text-lg font-bold text-blue-900">
                {sparePart.quantity} {t('dona', language)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-3 border border-purple-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-semibold text-purple-600">{t('Ishlatilgan', language)}</span>
              </div>
              <p className="text-lg font-bold text-purple-900">
                {sparePart.usageCount} {t('marta', language)}
              </p>
            </div>
          </div>

          {/* Narxlar Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-2 border border-orange-100">
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="h-3 w-3 text-orange-600" />
                <span className="text-[10px] font-semibold text-orange-600">{t("O'zini", language)}</span>
              </div>
              <p className="text-sm font-bold text-orange-900">
                {(sparePart.costPrice || sparePart.price).toLocaleString()}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-2 border border-green-100">
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="h-3 w-3 text-green-600" />
                <span className="text-[10px] font-semibold text-green-600">{t('Sotish', language)}</span>
              </div>
              <p className="text-sm font-bold text-green-900">
                {(sparePart.sellingPrice || sparePart.price).toLocaleString()}
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-2 border border-emerald-100">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3 text-emerald-600" />
                <span className="text-[10px] font-semibold text-emerald-600">{t('Foyda', language)}</span>
              </div>
              <p className="text-sm font-bold text-emerald-900">
                {(sparePart.profit || ((sparePart.sellingPrice || sparePart.price) - (sparePart.costPrice || sparePart.price))).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Total Value */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-2 border border-indigo-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-600">{t('Jami qiymat', language)}</span>
              <span className="text-sm font-bold text-indigo-900">
                {((sparePart.sellingPrice || sparePart.price) * sparePart.quantity).toLocaleString()} {t("so'm", language)}
              </span>
            </div>
          </div>

          {/* Total Profit */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-2 border border-emerald-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600">{t('Jami foyda', language)}</span>
              <span className="text-sm font-bold text-emerald-900">
                {((sparePart.profit || ((sparePart.sellingPrice || sparePart.price) - (sparePart.costPrice || sparePart.price))) * sparePart.quantity).toLocaleString()} {t("so'm", language)}
              </span>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="h-3 w-3 text-blue-600" />
                <span className="text-xs font-semibold text-blue-600">{t('Yaratilgan', language)}</span>
              </div>
              <p className="text-[10px] text-blue-800">{formatDate(sparePart.createdAt)}</p>
            </div>

            <div className="bg-orange-50 rounded-lg p-2 border border-orange-100">
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="h-3 w-3 text-orange-600" />
                <span className="text-xs font-semibold text-orange-600">{t('Yangilangan', language)}</span>
              </div>
              <p className="text-[10px] text-orange-800">{formatDate(sparePart.updatedAt)}</p>
            </div>
          </div>

          {/* Status */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-2 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">{t('Holat', language)}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                sparePart.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {sparePart.isActive ? t('Faol', language) : t('Nofaol', language)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('Yopish', language)}
            </button>
            
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
              >
                <Edit className="h-3 w-3" />
                {t('Tahrirlash', language)}
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
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