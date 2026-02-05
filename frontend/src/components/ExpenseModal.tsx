import React, { useState } from 'react';
import { 
  X, TrendingDown, Grid3X3,
  ShoppingCart, Home, Zap, Users, Truck, Megaphone,
  Monitor, FileText, DollarSign, CreditCard, Wallet,
  Building, Car, Fuel, Wrench, Package, Phone,
  Wifi, Lightbulb, Calculator, Briefcase
} from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';
import { t } from '@/lib/transliteration';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { Transaction } from '@/types';
import SalaryExpenseModal from './SalaryExpenseModal';
import SparePartExpenseModal from './SparePartExpenseModal';
import toast from 'react-hot-toast';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose }) => {
  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const [step, setStep] = useState<'categories' | 'form'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isSparePartModalOpen, setIsSparePartModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    amountDisplay: '',
    description: '',
    paymentMethod: 'cash' as 'cash' | 'card' | 'click'
  });

  const createTransactionMutation = useCreateTransaction();
  const expenseCategoriesQuery = useExpenseCategories();
  const { isOnline } = useBackendStatus();
  const categories = expenseCategoriesQuery.data?.categories || [];
  const categoriesLoading = expenseCategoriesQuery.isLoading;
  
  // Debug logging
  console.log('ExpenseModal Debug:', {
    data: expenseCategoriesQuery.data,
    categories,
    isArray: Array.isArray(categories),
    loading: categoriesLoading
  });
  
  // Zapchastlar kategoriyasini filter qilish
  const filteredCategories = Array.isArray(categories) ? categories.filter((category: any) => {
    // Zapchastlar kategoriyasini chiqarib tashlash
    const categoryName = category.nameUz?.toLowerCase() || '';
    return !categoryName.includes('zapchast') && 
           !categoryName.includes('ehtiyot qism') &&
           !categoryName.includes('spare part');
  }) : [];

  // Modal ochilganda body scroll ni bloklash
  useBodyScrollLock(isOpen);

  // Icon komponentini olish
  const getIconComponent = (iconName: string, size: 'sm' | 'lg' = 'lg') => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      ShoppingCart, Home, Zap, Users, Truck, Megaphone,
      Monitor, FileText, DollarSign, CreditCard, Wallet,
      Building, Car, Fuel, Wrench, Package, Phone,
      Wifi, Lightbulb, Calculator, Briefcase
    };
    
    const IconComponent = iconMap[iconName] || Package;
    const iconSize = size === 'sm' ? 'h-5 w-5' : 'h-8 w-8';
    return <IconComponent className={`${iconSize} text-white`} />;
  };

  if (!isOpen) return null;

  const handleClose = () => {
    setStep('categories');
    setSelectedCategory(null);
    setIsSalaryModalOpen(false);
    setIsSparePartModalOpen(false);
    setFormData({
      amount: '',
      amountDisplay: '',
      description: '',
      paymentMethod: 'cash'
    });
    setErrors({});
    onClose();
  };

  const handleCategorySelect = (category: any) => {
    setSelectedCategory(category);
    
    // Agar "Maosh" kategoriyasi bo'lsa, maxsus modal ochish
    if (category.nameUz === 'Oyliklar' || category.nameUz.toLowerCase().includes('maosh') || category.nameUz.toLowerCase().includes('oylik')) {
      setIsSalaryModalOpen(true);
    } 
    // Agar "Zapchastlar" kategoriyasi bo'lsa, zapchast qo'shish modali ochish
    else if (category.nameUz === 'Zapchastlar' || category.nameUz.toLowerCase().includes('zapchast') || category.nameUz.toLowerCase().includes('ehtiyot qism')) {
      setIsSparePartModalOpen(true);
    } 
    else {
      setStep('form');
    }
  };

  const handleSalarySuccess = async (salaryData: any) => {
    setLoading(true);
    try {
      await createTransactionMutation.mutateAsync({
        type: 'expense',
        category: 'salary',
        categoryId: selectedCategory._id,
        amount: salaryData.amount,
        description: salaryData.description,
        paymentMethod: salaryData.paymentMethod,
        apprenticeId: salaryData.apprenticeId,
        relatedTo: {
          type: 'expense_category',
          id: selectedCategory._id
        }
      } as Partial<Transaction>);

      handleClose();
    } catch (error: any) {
      console.error('Error creating salary expense:', error);
      toast.error(error.response?.data?.message || t('Xatolik yuz berdi', language));
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedCategory) {
      newErrors.category = t("Kategoriya tanlanmagan", language);
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      newErrors.amount = t("Summa 0 dan katta bo'lishi kerak", language);
    }

    if (formData.description.length < 2) {
      newErrors.description = t("Izoh kamida 2 ta belgidan iborat bo'lishi kerak", language);
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
      await createTransactionMutation.mutateAsync({
        type: 'expense',
        category: selectedCategory.nameUz,
        categoryId: selectedCategory._id,
        amount: Number(formData.amount),
        description: formData.description,
        paymentMethod: formData.paymentMethod,
        relatedTo: {
          type: 'expense_category',
          id: selectedCategory._id
        }
      } as Partial<Transaction>);

      handleClose();
    } catch (error: any) {
      console.error('Error creating expense:', error);
      toast.error(error.response?.data?.message || t('Xatolik yuz berdi', language));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      // Pul formatini boshqarish
      const formatted = formatNumber(value);
      const numericValue = parseFormattedNumber(formatted);
      
      setFormData(prev => ({
        ...prev,
        amount: numericValue.toString(),
        amountDisplay: formatted
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden mx-2 sm:mx-0 my-4 sm:my-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 px-4 py-3">
          <button onClick={handleClose} className="absolute top-2 right-2 text-white/80 hover:text-white rounded-lg p-1 transition-colors">
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-white" />
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {step === 'categories' ? t('Xarajat turi', language) : t('Chiqim qo\'shish', language)}
              {!isOnline && (
                <span className="px-2 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                  Offline
                </span>
              )}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[calc(95vh-80px)] overflow-y-auto">
          {step === 'categories' ? (
            // Step 1: Kategoriyalar ro'yxati
            <div className="space-y-4">
              {categoriesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-600"></div>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="text-center py-12">
                  <Grid3X3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">{t('Xarajat kategoriyalari topilmadi', language)}</p>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    {t('Yopish', language)}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCategories.map((category: any) => (
                    <button
                      key={category._id}
                      onClick={() => handleCategorySelect(category)}
                      className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all text-left border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: category.color === 'blue' ? '#3b82f6' : 
                                                   category.color === 'green' ? '#10b981' :
                                                   category.color === 'yellow' ? '#f59e0b' :
                                                   category.color === 'purple' ? '#8b5cf6' :
                                                   category.color === 'red' ? '#ef4444' :
                                                   category.color === 'indigo' ? '#6366f1' :
                                                   category.color === 'pink' ? '#ec4899' :
                                                   category.color === 'gray' ? '#6b7280' : '#ef4444' }}
                        >
                          {getIconComponent(category.icon, 'sm')}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-gray-900">
                            {category.nameUz}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {category.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Step 2: Chiqim formasi
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Tanlangan kategoriya */}
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: selectedCategory?.color === 'blue' ? '#3b82f6' : 
                                               selectedCategory?.color === 'green' ? '#10b981' :
                                               selectedCategory?.color === 'yellow' ? '#f59e0b' :
                                               selectedCategory?.color === 'purple' ? '#8b5cf6' :
                                               selectedCategory?.color === 'red' ? '#ef4444' :
                                               selectedCategory?.color === 'indigo' ? '#6366f1' :
                                               selectedCategory?.color === 'pink' ? '#ec4899' :
                                               selectedCategory?.color === 'gray' ? '#6b7280' : '#ef4444' }}
                    >
                      {selectedCategory && getIconComponent(selectedCategory.icon, 'sm')}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {selectedCategory?.nameUz}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('categories')}
                    className="text-red-600 hover:text-red-700 font-medium text-xs"
                  >
                    {t('O\'zgartirish', language)}
                  </button>
                </div>
              </div>

              {/* Summa */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t("Summa", language)} *
                </label>
                <input
                  type="text"
                  name="amount"
                  required
                  value={formData.amountDisplay}
                  onChange={handleChange}
                  autoComplete="off"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none transition-all text-sm ${
                    errors.amount 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-300 focus:border-red-500'
                  }`}
                  placeholder="1,000,000"
                />
                {errors.amount && (
                  <p className="mt-1 text-xs text-red-600">{errors.amount}</p>
                )}
              </div>

              {/* Izoh */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('Izoh', language)} *
                </label>
                <textarea
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none transition-all text-sm resize-none ${
                    errors.description 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-300 focus:border-red-500'
                  }`}
                  placeholder={t('Chiqim haqida...', language)}
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-600">{errors.description}</p>
                )}
              </div>

              {/* To'lov usuli */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t("To'lov usuli", language)} *
                </label>
                <select
                  name="paymentMethod"
                  required
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 transition-all text-sm"
                >
                  <option value="cash">{t('Naqd', language)}</option>
                  <option value="card">{t('Karta', language)}</option>
                  <option value="click">Click</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setStep('categories')}
                  className="flex-1 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('Orqaga', language)}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all"
                >
                  {loading ? t('Saqlanmoqda...', language) : t("Chiqim qo'shish", language)}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Salary Expense Modal */}
      {isSalaryModalOpen && selectedCategory && (
        <SalaryExpenseModal
          isOpen={isSalaryModalOpen}
          onClose={() => {
            setIsSalaryModalOpen(false);
            setSelectedCategory(null);
            setStep('categories');
          }}
          onSuccess={handleSalarySuccess}
          category={selectedCategory}
        />
      )}

      {/* Spare Part Modal */}
      {isSparePartModalOpen && (
        <SparePartExpenseModal
          isOpen={isSparePartModalOpen}
          createExpense={true}
          onClose={() => {
            setIsSparePartModalOpen(false);
            setSelectedCategory(null);
            setStep('categories');
          }}
          onSuccess={(_data) => {
            // Chiqim yaratildi, modal yopiladi
            setIsSparePartModalOpen(false);
            setSelectedCategory(null);
            setStep('categories');
            handleClose();
            // Sahifani yangilash
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default ExpenseModal;
