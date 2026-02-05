import React, { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface CreateSparePartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateSparePartModal: React.FC<CreateSparePartModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  
  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    costPrice: '', // O'zini narxi
    costPriceDisplay: '', // Formatli ko'rsatish
    sellingPrice: '', // Sotish narxi
    sellingPriceDisplay: '', // Formatli ko'rsatish
    price: '', // Deprecated - backward compatibility
    priceDisplay: '',
    quantity: '',
    supplier: ''
  });

  // Modal ochilganda body scroll ni bloklash
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.name.length < 2) {
      newErrors.name = t("Nom kamida 2 ta belgidan iborat bo'lishi kerak", language);
    }

    // Kamida bitta narx kiritilishi kerak
    if ((!formData.costPrice || Number(formData.costPrice) <= 0) && 
        (!formData.sellingPrice || Number(formData.sellingPrice) <= 0)) {
      newErrors.costPrice = t("Kamida bitta narx kiritilishi kerak", language);
      newErrors.sellingPrice = t("Kamida bitta narx kiritilishi kerak", language);
    }

    // Agar ikkala narx ham kiritilgan bo'lsa, sotish narxi o'zini narxidan kichik bo'lmasligi kerak
    if (formData.costPrice && formData.sellingPrice && 
        Number(formData.costPrice) > 0 && Number(formData.sellingPrice) > 0 &&
        Number(formData.sellingPrice) < Number(formData.costPrice)) {
      newErrors.sellingPrice = t("Sotish narxi o'zini narxidan kichik bo'lmasligi kerak", language);
    }

    if (!formData.quantity || Number(formData.quantity) < 0) {
      newErrors.quantity = t("Miqdor majburiy va 0 dan kichik bo'lmasligi kerak", language);
    }

    if (formData.supplier.length < 2) {
      newErrors.supplier = t("Kimdan olingani kamida 2 ta belgidan iborat bo'lishi kerak", language);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Agar faqat bitta narx kiritilgan bo'lsa, ikkinchisini avtomatik to'ldirish
      const costPrice = Number(formData.costPrice) || Number(formData.sellingPrice);
      const sellingPrice = Number(formData.sellingPrice) || Number(formData.costPrice);

      // Zapchastni qo'shish
      await api.post('/spare-parts', {
        name: formData.name,
        costPrice: costPrice,
        sellingPrice: sellingPrice,
        price: sellingPrice, // Backward compatibility
        quantity: Number(formData.quantity),
        supplier: formData.supplier
      });

      // Ma'lumotlarni yangilash
      queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-search'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-infinite'] });

      onSuccess();
      onClose();
      // Form ni tozalash
      setFormData({
        name: '',
        costPrice: '',
        costPriceDisplay: '',
        sellingPrice: '',
        sellingPriceDisplay: '',
        price: '',
        priceDisplay: '',
        quantity: '',
        supplier: ''
      });
      setErrors({});
    } catch (error: any) {
      console.error('Error creating spare part:', error);
      alert(error.response?.data?.message || t('Xatolik yuz berdi', language));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'costPrice') {
      // O'zini narxi formatini boshqarish
      const formatted = formatNumber(value);
      const numericValue = parseFormattedNumber(formatted);
      
      setFormData(prev => ({
        ...prev,
        costPrice: numericValue.toString(),
        costPriceDisplay: formatted
      }));
    } else if (name === 'sellingPrice') {
      // Sotish narxi formatini boshqarish
      const formatted = formatNumber(value);
      const numericValue = parseFormattedNumber(formatted);
      
      setFormData(prev => ({
        ...prev,
        sellingPrice: numericValue.toString(),
        sellingPriceDisplay: formatted
      }));
    } else if (name === 'price') {
      // Pul formatini boshqarish (deprecated)
      const formatted = formatNumber(value);
      const numericValue = parseFormattedNumber(formatted);
      
      setFormData(prev => ({
        ...prev,
        price: numericValue.toString(),
        priceDisplay: formatted
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Xatolikni tozalash
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden mx-2 sm:mx-0 my-4 sm:my-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-4 sm:py-5">
          <button onClick={onClose} className="absolute top-3 sm:top-4 right-3 sm:right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors">
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">{t('Yangi zapchast qo\'shish', language)}</h2>
              <p className="text-blue-100 text-xs sm:text-sm">{t("Zapchast ma'lumotlarini kiriting", language)}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Zapchast nomi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('Zapchast nomi', language)} *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-lg focus:outline-none transition-all text-sm sm:text-base ${
                errors.name 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-200 focus:border-blue-500'
              }`}
              placeholder={t('Masalan: Tormoz kolodkasi', language)}
            />
            {errors.name && (
              <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                {errors.name}
              </p>
            )}
          </div>

          {/* O'zini narxi va Sotish narxi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* O'zini narxi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("O'zini narxi", language)} ({t("so'm", language)})
              </label>
              <input
                type="text"
                name="costPrice"
                value={formData.costPriceDisplay}
                onChange={handleChange}
                autoComplete="off"
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-lg focus:outline-none transition-all text-sm sm:text-base ${
                  errors.costPrice 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-gray-200 focus:border-blue-500'
                }`}
                placeholder="800,000"
              />
              {errors.costPrice && (
                <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  {errors.costPrice}
                </p>
              )}
            </div>

            {/* Sotish narxi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('Sotish narxi', language)} ({t("so'm", language)})
              </label>
              <input
                type="text"
                name="sellingPrice"
                value={formData.sellingPriceDisplay}
                onChange={handleChange}
                autoComplete="off"
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-lg focus:outline-none transition-all text-sm sm:text-base ${
                  errors.sellingPrice 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-gray-200 focus:border-blue-500'
                }`}
                placeholder="1,000,000"
              />
              {errors.sellingPrice && (
                <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  {errors.sellingPrice}
                </p>
              )}
            </div>
          </div>

          {/* Foyda ko'rsatish */}
          {formData.costPrice && formData.sellingPrice && Number(formData.sellingPrice) >= Number(formData.costPrice) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">{t('Foyda', language)}:</span>
                <span className="text-base sm:text-lg font-bold text-green-600">
                  {formatNumber((Number(formData.sellingPrice) - Number(formData.costPrice)).toString())} {t("so'm", language)}
                </span>
              </div>
            </div>
          )}

          {/* Miqdor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('Miqdor', language)} *
            </label>
            <input
              type="number"
              name="quantity"
              required
              min="0"
              value={formData.quantity}
              onChange={handleChange}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-lg focus:outline-none transition-all text-sm sm:text-base ${
                errors.quantity 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-200 focus:border-blue-500'
              }`}
              placeholder="0"
            />
            {errors.quantity && (
              <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                {errors.quantity}
              </p>
            )}
          </div>

          {/* Kimdan olingan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('Kimdan olingan', language)} *
            </label>
            <input
              type="text"
              name="supplier"
              required
              value={formData.supplier}
              onChange={handleChange}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-lg focus:outline-none transition-all text-sm sm:text-base ${
                errors.supplier 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-200 focus:border-blue-500'
              }`}
              placeholder={t('Masalan: Avtomag do\'koni', language)}
            />
            {errors.supplier && (
              <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                {errors.supplier}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors order-2 sm:order-1"
            >
              {t('Bekor qilish', language)}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg order-1 sm:order-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('Saqlanmoqda...', language)}
                </span>
              ) : (
                t('Saqlash', language)
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSparePartModal;