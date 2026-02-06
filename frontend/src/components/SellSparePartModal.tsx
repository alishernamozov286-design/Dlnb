import React, { useState } from 'react';
import { X, DollarSign, Package, User, Phone } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface SellSparePartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sparePart: any;
}

const SellSparePartModal: React.FC<SellSparePartModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  sparePart
}) => {
  const [quantity, setQuantity] = useState(1);
  const [sellingPrice, setSellingPrice] = useState(sparePart?.sellingPrice || 0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const language = (localStorage.getItem('language') as 'latin' | 'cyrillic') || 'latin';

  if (!isOpen || !sparePart) return null;

  const totalRevenue = sellingPrice * quantity;
  const totalCost = sparePart.costPrice * quantity;
  const profit = totalRevenue - totalCost;

  // Telefon raqamini formatlash
  const formatPhoneNumber = (value: string) => {
    // Faqat raqamlarni qoldirish
    const numbers = value.replace(/\D/g, '');
    
    // 998 bilan boshlanmasa, qo'shish
    let formatted = numbers;
    if (!formatted.startsWith('998') && formatted.length > 0) {
      formatted = '998' + formatted;
    }
    
    // Maksimal 12 raqam (998 + 9 raqam)
    formatted = formatted.slice(0, 12);
    
    return formatted;
  };

  // Telefon raqamini ko'rsatish formati
  const displayPhoneNumber = (value: string) => {
    if (!value) return '';
    
    // +998 XX XXX XX XX formatiga o'tkazish
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length === 0) return '';
    if (numbers.length <= 3) return `+${numbers}`;
    if (numbers.length <= 5) return `+${numbers.slice(0, 3)} ${numbers.slice(3)}`;
    if (numbers.length <= 8) return `+${numbers.slice(0, 3)} ${numbers.slice(3, 5)} ${numbers.slice(5)}`;
    if (numbers.length <= 10) return `+${numbers.slice(0, 3)} ${numbers.slice(3, 5)} ${numbers.slice(5, 8)} ${numbers.slice(8)}`;
    return `+${numbers.slice(0, 3)} ${numbers.slice(3, 5)} ${numbers.slice(5, 8)} ${numbers.slice(8, 10)} ${numbers.slice(10, 12)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity > sparePart.quantity) {
      toast.error(t(`Omborda yetarli miqdor yo'q. Mavjud: ${sparePart.quantity} dona`, language));
      return;
    }

    if (sellingPrice <= 0) {
      toast.error(t('Sotish narxi 0 dan katta bo\'lishi kerak', language));
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/spare-parts/sell', {
        sparePartId: sparePart._id,
        quantity,
        sellingPrice,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined
      });

      toast.success(t('Zapchast muvaffaqiyatli sotildi', language));
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error selling spare part:', error);
      toast.error(error.response?.data?.message || t('Xatolik yuz berdi', language));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="sticky top-0 bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {t('Zapchast sotish', language)}
                </h2>
                <p className="text-sm text-white/80 mt-1">{sparePart.name}</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Package className="h-5 w-5 text-gray-600" />
              <h3 className="font-bold text-gray-900">{t('Tovar ma\'lumotlari', language)}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('Mavjud miqdor', language)}</p>
                <p className="text-lg font-bold text-gray-900">{sparePart.quantity} dona</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('Tannarx', language)}</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(sparePart.costPrice)}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('Sotish miqdori', language)} *
            </label>
            <input
              type="number"
              min="1"
              max={sparePart.quantity}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(sparePart.quantity, parseInt(e.target.value) || 1)))}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('Maksimal', language)}: {sparePart.quantity} dona
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('Sotish narxi (dona)', language)} *
            </label>
            <input
              type="number"
              min="0"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('Xaridor ismi', language)}
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              placeholder={t('Ixtiyoriy', language)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {t('Xaridor telefoni', language)}
            </label>
            <input
              type="text"
              value={displayPhoneNumber(customerPhone)}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                setCustomerPhone(formatted);
              }}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              placeholder="+998 XX XXX XX XX"
            />
            {customerPhone && customerPhone.length === 12 && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {displayPhoneNumber(customerPhone)}
              </p>
            )}
            {customerPhone && customerPhone.length > 0 && customerPhone.length < 12 && (
              <p className="text-xs text-orange-600 mt-1">
                {t('12 raqam kiriting', language)} ({customerPhone.length}/12)
              </p>
            )}
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-200">
            <h3 className="font-bold text-gray-900 mb-4">{t('Hisob-kitob', language)}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('Jami tannarx', language)}:</span>
                <span className="font-bold text-gray-900">{formatCurrency(totalCost)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('Jami tushum', language)}:</span>
                <span className="font-bold text-green-600">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="h-px bg-gray-300"></div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">{t('Foyda', language)}:</span>
                <span className={`text-xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(profit)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              {t('Bekor qilish', language)}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t('Saqlanmoqda...', language) : t('Sotish', language)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellSparePartModal;
