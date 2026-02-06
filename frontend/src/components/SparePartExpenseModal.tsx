import React, { useState } from 'react';
import { X, ShoppingCart, AlertCircle } from 'lucide-react';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';
import { t } from '@/lib/transliteration';
import api from '@/lib/api';

interface SparePartExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  createExpense?: boolean; // Chiqim yaratish kerakmi?
}

const SparePartExpenseModal: React.FC<SparePartExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  createExpense = false // Default: chiqim yaratilmasin
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    costPrice: '',
    costPriceDisplay: '',
    sellingPrice: '',
    sellingPriceDisplay: '',
    quantity: '',
    supplier: '',
    paymentMethod: 'cash' as 'cash' | 'card'
  });

  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

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

      if (createExpense) {
        // Kassa sahifasidan: Zapchast + Chiqim yaratish
        const response = await api.post('/spare-parts/with-expense', {
          name: formData.name,
          costPrice: costPrice,
          sellingPrice: sellingPrice,
          price: sellingPrice,
          quantity: Number(formData.quantity),
          supplier: formData.supplier,
          paymentMethod: formData.paymentMethod
        });

        // Success callback
        onSuccess({
          transaction: response.data.transaction,
          sparePart: response.data.sparePart
        });
      } else {
        // Zapchastlar sahifasidan: Faqat zapchast yaratish
        await api.post('/spare-parts', {
          name: formData.name,
          costPrice: costPrice,
          sellingPrice: sellingPrice,
          price: sellingPrice,
          quantity: Number(formData.quantity),
          supplier: formData.supplier
        });

        // Success callback
        onSuccess({
          sparePart: { name: formData.name }
        });
      }

      // Form ni tozalash
      setFormData({
        name: '',
        costPrice: '',
        costPriceDisplay: '',
        sellingPrice: '',
        sellingPriceDisplay: '',
        quantity: '',
        supplier: '',
        paymentMethod: 'cash'
      });
      setErrors({});
    } catch (error: any) {
      console.error('Error creating spare part:', error);
      alert(error.response?.data?.message || t('Xatolik yuz berdi', language));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'costPrice') {
      const formatted = formatNumber(value);
      const numericValue = parseFormattedNumber(formatted);
      
      setFormData(prev => ({
        ...prev,
        costPrice: numericValue.toString(),
        costPriceDisplay: formatted
      }));
    } else if (name === 'sellingPrice') {
      const formatted = formatNumber(value);
      const numericValue = parseFormattedNumber(formatted);
      
      setFormData(prev => ({
        ...prev,
        sellingPrice: numericValue.toString(),
        sellingPriceDisplay: formatted
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {t('Yangi zapchast qo\'shish', language)}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    {t('Zapchast ma\'lumotlarini kiriting', language)}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-white/80 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all ${
                    errors.name 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder={t('Masalan: Tormoz kolodkasi', language)}
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* O'zini narxi va Sotish narxi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all ${
                      errors.costPrice 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                    placeholder="800,000"
                  />
                  {errors.costPrice && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
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
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all ${
                      errors.sellingPrice 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                    placeholder="1,000,000"
                  />
                  {errors.sellingPrice && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {errors.sellingPrice}
                    </p>
                  )}
                </div>
              </div>

              {/* Foyda ko'rsatish */}
              {formData.costPrice && formData.sellingPrice && Number(formData.sellingPrice) >= Number(formData.costPrice) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">{t('Foyda', language)}:</span>
                    <span className="text-lg font-bold text-green-600">
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
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all ${
                    errors.quantity 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="0"
                />
                {errors.quantity && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
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
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all ${
                    errors.supplier 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder={t('Masalan: Avtomag do\'koni', language)}
                />
                {errors.supplier && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.supplier}
                  </p>
                )}
              </div>

              {/* To'lov usuli */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("To'lov usuli", language)} *
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                  required
                >
                  <option value="cash">{t('Naqd', language)}</option>
                  <option value="card">{t('Karta', language)}</option>
                </select>
              </div>

              {/* Jami summa */}
              {formData.costPrice && formData.quantity && Number(formData.costPrice) > 0 && Number(formData.quantity) > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">{t('Jami xarajat', language)}:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatNumber((Number(formData.costPrice) * Number(formData.quantity)).toString())} {t("so'm", language)}
                    </span>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  {t('Bekor qilish', language)}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl font-medium"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
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
      </div>
    </div>
  );
};

export default SparePartExpenseModal;