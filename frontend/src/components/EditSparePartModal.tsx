import React, { useState, useEffect } from 'react';
import { X, Edit3, AlertCircle } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface SparePart {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  supplier: string;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EditSparePartModalProps {
  isOpen: boolean;
  onClose: () => void;
  sparePart: SparePart;
  onSuccess: () => void;
}

const EditSparePartModal: React.FC<EditSparePartModalProps> = ({ isOpen, onClose, sparePart, onSuccess }) => {
  const queryClient = useQueryClient();
  
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    costPrice: '',
    costPriceDisplay: '',
    sellingPrice: '',
    sellingPriceDisplay: '',
    price: '',
    priceDisplay: '', // Formatli ko'rsatish uchun
    quantity: '',
    supplier: ''
  });

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (sparePart) {
      const priceFormatted = formatNumber(sparePart.price.toString());
      // @ts-ignore - costPrice va sellingPrice yangi maydonlar
      const costPriceFormatted = formatNumber((sparePart.costPrice || sparePart.price).toString());
      // @ts-ignore
      const sellingPriceFormatted = formatNumber((sparePart.sellingPrice || sparePart.price).toString());
      
      setFormData({
        name: sparePart.name,
        // @ts-ignore
        costPrice: (sparePart.costPrice || sparePart.price).toString(),
        costPriceDisplay: costPriceFormatted,
        // @ts-ignore
        sellingPrice: (sparePart.sellingPrice || sparePart.price).toString(),
        sellingPriceDisplay: sellingPriceFormatted,
        price: sparePart.price.toString(),
        priceDisplay: priceFormatted,
        quantity: sparePart.quantity.toString(),
        supplier: sparePart.supplier
      });
    }
  }, [sparePart]);

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

      await api.put(`/spare-parts/${sparePart._id}`, {
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
      setErrors({});
    } catch (error: any) {
      console.error('Error updating spare part:', error);
      alert(error.response?.data?.message || t('Xatolik yuz berdi', language));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[95vh] overflow-hidden mx-2">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3">
          <button onClick={onClose} className="absolute top-3 right-3 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
              <Edit3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{t('Zapchastni tahrirlash', language)}</h2>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto max-h-[calc(95vh-80px)] scrollbar-hide">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('Zapchast nomi', language)} *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none transition-all ${
                errors.name 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-200 focus:border-purple-500'
              }`}
              placeholder={t('Masalan: Tormoz kolodkasi', language)}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("O'zini narxi", language)} ({t("so'm", language)})
              </label>
              <input
                type="text"
                name="costPrice"
                value={formData.costPriceDisplay}
                onChange={handleChange}
                autoComplete="off"
                className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none transition-all ${
                  errors.costPrice 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-gray-200 focus:border-purple-500'
                }`}
                placeholder="800,000"
              />
              {errors.costPrice && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.costPrice}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('Sotish narxi', language)} ({t("so'm", language)})
              </label>
              <input
                type="text"
                name="sellingPrice"
                value={formData.sellingPriceDisplay}
                onChange={handleChange}
                autoComplete="off"
                className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none transition-all ${
                  errors.sellingPrice 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-gray-200 focus:border-purple-500'
                }`}
                placeholder="1,000,000"
              />
              {errors.sellingPrice && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.sellingPrice}
                </p>
              )}
            </div>
          </div>

          {formData.costPrice && formData.sellingPrice && Number(formData.sellingPrice) >= Number(formData.costPrice) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-green-800">{t('Foyda', language)}:</span>
                <span className="text-sm font-bold text-green-600">
                  {formatNumber((Number(formData.sellingPrice) - Number(formData.costPrice)).toString())} {t("so'm", language)}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('Miqdor', language)} *
              </label>
              <input
                type="number"
                name="quantity"
                required
                min="0"
                value={formData.quantity}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none transition-all ${
                  errors.quantity 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-gray-200 focus:border-purple-500'
                }`}
                placeholder="0"
              />
              {errors.quantity && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.quantity}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('Kimdan olingan', language)} *
              </label>
              <input
                type="text"
                name="supplier"
                required
                value={formData.supplier}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none transition-all ${
                  errors.supplier 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-gray-200 focus:border-purple-500'
                }`}
                placeholder={t('Masalan: Avtomag', language)}
              />
              {errors.supplier && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.supplier}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('Bekor qilish', language)}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
            >
              {loading ? t('Saqlanmoqda...', language) : t('Saqlash', language)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSparePartModal;