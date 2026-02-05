import React, { useState } from 'react';
import { X, Plus, ShoppingCart, Home, Zap, Users, DollarSign, Package, Truck, Wrench, Settings } from 'lucide-react';
import { useCreateExpenseCategory } from '@/hooks/useExpenseCategories';
import { t } from '@/lib/transliteration';

interface AddExpenseCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconOptions = [
  { name: 'ShoppingCart', icon: ShoppingCart, label: 'Savdo' },
  { name: 'Home', icon: Home, label: 'Uy' },
  { name: 'Zap', icon: Zap, label: 'Elektr' },
  { name: 'Users', icon: Users, label: 'Odamlar' },
  { name: 'DollarSign', icon: DollarSign, label: 'Pul' },
  { name: 'Package', icon: Package, label: 'Paket' },
  { name: 'Truck', icon: Truck, label: 'Transport' },
  { name: 'Wrench', icon: Wrench, label: 'Asbob' },
  { name: 'Settings', icon: Settings, label: 'Sozlamalar' }
];

const colorOptions = [
  { name: 'blue', class: 'bg-blue-500', label: 'Ko\'k' },
  { name: 'green', class: 'bg-green-500', label: 'Yashil' },
  { name: 'yellow', class: 'bg-yellow-500', label: 'Sariq' },
  { name: 'purple', class: 'bg-purple-500', label: 'Binafsha' },
  { name: 'red', class: 'bg-red-500', label: 'Qizil' },
  { name: 'indigo', class: 'bg-indigo-500', label: 'Indigo' },
  { name: 'pink', class: 'bg-pink-500', label: 'Pushti' },
  { name: 'gray', class: 'bg-gray-500', label: 'Kulrang' }
];

const AddExpenseCategoryModal: React.FC<AddExpenseCategoryModalProps> = ({
  isOpen,
  onClose
}) => {
  const [formData, setFormData] = useState({
    nameUz: '',
    description: '',
    icon: 'DollarSign',
    color: 'blue'
  });
  const [errors, setErrors] = useState<any>({});

  const createCategoryMutation = useCreateExpenseCategory();

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: any = {};
    if (!formData.nameUz.trim()) newErrors.nameUz = t('O\'zbek nomi majburiy', language);
    if (!formData.description.trim()) newErrors.description = t('Tavsif majburiy', language);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Backend uchun name maydonini qo'shamiz
      const categoryData = {
        ...formData,
        name: formData.nameUz // Inglizcha nom sifatida o'zbek nomini ishlatamiz
      };
      
      await createCategoryMutation.mutateAsync(categoryData);
      
      // Reset form
      setFormData({
        nameUz: '',
        description: '',
        icon: 'DollarSign',
        color: 'blue'
      });
      
      onClose();
    } catch (error: any) {
      console.error('Kategoriya yaratishda xatolik:', error);
      setErrors({ 
        submit: error.response?.data?.message || t('Xatolik yuz berdi', language) 
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  const selectedIcon = iconOptions.find(icon => icon.name === formData.icon);
  const selectedColor = colorOptions.find(color => color.name === formData.color);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t("Yangi xarajat manbasini qo'shish", language)}</h2>
                <p className="text-red-100 text-sm">
                  {t("Maxsus xarajat kategoriyasini yarating", language)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Preview */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-3">{t("Oldindan ko'rish", language)}</h3>
            <div className={`p-4 rounded-lg bg-gradient-to-br ${
              selectedColor?.name === 'blue' ? 'from-blue-50 to-blue-100 border-blue-200' :
              selectedColor?.name === 'green' ? 'from-green-50 to-green-100 border-green-200' :
              selectedColor?.name === 'yellow' ? 'from-yellow-50 to-yellow-100 border-yellow-200' :
              selectedColor?.name === 'purple' ? 'from-purple-50 to-purple-100 border-purple-200' :
              selectedColor?.name === 'red' ? 'from-red-50 to-red-100 border-red-200' :
              selectedColor?.name === 'indigo' ? 'from-indigo-50 to-indigo-100 border-indigo-200' :
              selectedColor?.name === 'pink' ? 'from-pink-50 to-pink-100 border-pink-200' :
              'from-gray-50 to-gray-100 border-gray-200'
            } border`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 ${selectedColor?.class} rounded-lg`}>
                  {selectedIcon && <selectedIcon.icon className="h-5 w-5 text-white" />}
                </div>
              </div>
              <h4 className="font-bold text-sm mb-1">
                {formData.nameUz || t('Kategoriya nomi', language)}
              </h4>
              <p className="text-xs text-gray-600 mb-3">
                {formData.description || t('Kategoriya tavsifi', language)}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-red-600">0 so'm</span>
                <span className="text-xs text-gray-500">0 ta</span>
              </div>
            </div>
          </div>

          {/* Name (Uzbek) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("Kategoriya nomi", language)} *
            </label>
            <input
              type="text"
              value={formData.nameUz}
              onChange={(e) => handleChange('nameUz', e.target.value)}
              placeholder={t("Tovar sotib olish, Ijara, Kommunal to'lovlar...", language)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${
                errors.nameUz ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
            />
            {errors.nameUz && (
              <p className="text-red-600 text-sm mt-1">{errors.nameUz}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("Tavsif", language)} *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={t("Bu kategoriya qanday xarajatlar uchun ishlatiladi?", language)}
              rows={3}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none ${
                errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              {t("Ikon tanlang", language)}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {iconOptions.map((icon) => (
                <button
                  key={icon.name}
                  type="button"
                  onClick={() => handleChange('icon', icon.name)}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                    formData.icon === icon.name
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <icon.icon className={`h-5 w-5 ${
                    formData.icon === icon.name ? 'text-red-600' : 'text-gray-600'
                  }`} />
                  <span className={`text-xs font-medium ${
                    formData.icon === icon.name ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {t(icon.label, language)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              {t("Rang tanlang", language)}
            </label>
            <div className="grid grid-cols-4 gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => handleChange('color', color.name)}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                    formData.color === color.name
                      ? 'border-gray-800 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-6 h-6 ${color.class} rounded-full`}></div>
                  <span className={`text-xs font-medium ${
                    formData.color === color.name ? 'text-gray-800' : 'text-gray-600'
                  }`}>
                    {t(color.label, language)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 font-medium">{errors.submit}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              disabled={createCategoryMutation.isPending}
            >
              {t("Bekor qilish", language)}
            </button>
            <button
              type="submit"
              disabled={createCategoryMutation.isPending}
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold rounded-xl hover:from-red-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
            >
              {createCategoryMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>{t("Yaratilmoqda...", language)}</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>{t("Yaratish", language)}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseCategoryModal;