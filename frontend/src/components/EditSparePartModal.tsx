import React, { useState, useEffect } from 'react';
import { X, Edit3, AlertCircle, Package } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';
import api from '@/lib/api';

interface SparePart {
  _id: string;
  name: string;
  price?: number; // Optional - backward compatibility
  costPrice?: number; // O'zini narxi
  sellingPrice?: number; // Sotish narxi
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
  onSuccess: (updatedPart?: any) => void; // Yangilangan tovarni qaytarish
}

const EditSparePartModal: React.FC<EditSparePartModalProps> = ({ isOpen, onClose, sparePart, onSuccess }) => {
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currency, setCurrency] = useState<'UZS' | 'USD'>('UZS'); // Valyuta tanlash
  const [exchangeRate] = useState(12800); // 1 USD = 12,800 UZS (o'zgarmas)
  const [formData, setFormData] = useState({
    name: '',
    costPrice: '',
    costPriceDisplay: '',
    sellingPrice: '',
    sellingPriceDisplay: '',
    price: '',
    priceDisplay: '', // Formatli ko'rsatish uchun
    quantity: '',
    // Balon uchun qo'shimcha maydonlar
    category: 'zapchast' as 'balon' | 'zapchast' | 'boshqa',
    tireType: 'universal' as 'yozgi' | 'qishki' | 'universal',
    tireBrand: '',
    tireCategory: '', // Balon kategoriyasi (R60, R22.5 va h.k.)
    tireSize: '' // Aniq o'lcham
  });

  // Balon kategoriyalari va ularga tegishli o'lchamlar - TO'LIQ RO'YXAT
  const tireSizeOptions: Record<string, string[]> = {
    // R22.5 - Eng keng tarqalgan fura o'lchami (Standart fura)
    'R22.5': [
      '11R22.5',
      '12R22.5',
      '13R22.5',
      '215/75R22.5',
      '225/70R22.5',
      '235/75R22.5',
      '245/70R22.5',
      '255/70R22.5',
      '265/70R22.5',
      '275/70R22.5',
      '275/80R22.5',
      '285/70R22.5',
      '285/75R22.5',
      '295/60R22.5',
      '295/75R22.5',
      '295/80R22.5',
      '305/70R22.5',
      '315/60R22.5',
      '315/70R22.5',
      '315/80R22.5',
      '325/95R22.5',
      '355/50R22.5',
      '385/55R22.5',
      '385/65R22.5',
      '425/65R22.5',
      '445/65R22.5',
      '455/45R22.5',
      '495/45R22.5'
    ],
    
    // R24.5 - Katta fura va avtobus
    'R24.5': [
      '11R24.5',
      '12R24.5',
      '255/70R24.5',
      '275/70R24.5',
      '285/75R24.5',
      '295/75R24.5',
      '305/75R24.5'
    ],
    
    // R19.5 - O'rta fura va yengil yuk
    'R19.5': [
      '8R19.5',
      '225/70R19.5',
      '245/70R19.5',
      '265/70R19.5',
      '285/70R19.5'
    ],
    
    // R17.5 - Kichik fura va yengil yuk mashinalari
    'R17.5': [
      '215/75R17.5',
      '225/75R17.5',
      '235/75R17.5',
      '245/70R17.5',
      '265/70R17.5'
    ],
    
    // R20 - Yuk mashinalari (eski standart)
    'R20': [
      '7.50R20',
      '8.25R20',
      '9.00R20',
      '10.00R20',
      '11.00R20',
      '12.00R20',
      '13.00R20',
      '260/508R20',
      '275/80R20',
      '295/80R20',
      '315/80R20'
    ],
    
    // R16 - Yengil yuk va kichik fura
    'R16': [
      '6.50R16',
      '7.00R16',
      '7.50R16',
      '8.25R16',
      '9.00R16',
      '185/75R16',
      '195/75R16',
      '205/75R16',
      '215/75R16',
      '225/75R16',
      '235/85R16',
      '245/75R16'
    ],
    
    // R15 - Yengil yuk
    'R15': [
      '6.00R15',
      '6.50R15',
      '7.00R15',
      '185/80R15',
      '195/80R15',
      '205/80R15',
      '215/80R15'
    ],
    
    // R14 - Kichik yuk mashinalari
    'R14': [
      '185/80R14',
      '195/80R14',
      '205/80R14'
    ]
  };

  // O'lchamdan kategoriyani aniqlash
  const getTireCategoryFromSize = (size: string): string => {
    for (const [category, sizes] of Object.entries(tireSizeOptions)) {
      if (sizes.includes(size)) {
        return category;
      }
    }
    return '';
  };

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (sparePart) {
      // @ts-ignore - costPrice va sellingPrice yangi maydonlar
      const costPrice = sparePart.costPrice || sparePart.price || 0;
      // @ts-ignore
      const sellingPrice = sparePart.sellingPrice || sparePart.price || 0;
      const price = sparePart.price || sellingPrice || 0;
      
      const priceFormatted = formatNumber(price.toString());
      const costPriceFormatted = formatNumber(costPrice.toString());
      const sellingPriceFormatted = formatNumber(sellingPrice.toString());
      
      setFormData({
        name: sparePart.name,
        costPrice: costPrice.toString(),
        costPriceDisplay: costPriceFormatted,
        sellingPrice: sellingPrice.toString(),
        sellingPriceDisplay: sellingPriceFormatted,
        price: price.toString(),
        priceDisplay: priceFormatted,
        quantity: sparePart.quantity.toString(),
        // @ts-ignore - balon maydonlari
        category: sparePart.category || 'zapchast',
        // @ts-ignore
        tireType: sparePart.tireType || 'universal',
        // @ts-ignore
        tireBrand: sparePart.tireBrand || '',
        // @ts-ignore - tireSize'dan kategoriyani aniqlash
        tireCategory: sparePart.tireSize ? getTireCategoryFromSize(sparePart.tireSize) : '',
        // @ts-ignore
        tireSize: sparePart.tireSize || ''
      });
      
      // Modal ochilganda valyutani va previousCurrency ni reset qilish
      setCurrency('UZS');
      setPreviousCurrency('UZS');
    }
  }, [sparePart]);

  // Valyuta o'zgarganda narxlarni avtomatik konvertatsiya qilish
  const [previousCurrency, setPreviousCurrency] = useState<'UZS' | 'USD'>('UZS');
  
  useEffect(() => {
    // Agar valyuta o'zgarmagan bo'lsa, hech narsa qilmaslik
    if (currency === previousCurrency) return;
    
    const currentCostPrice = Number(formData.costPrice) || 0;
    const currentSellingPrice = Number(formData.sellingPrice) || 0;

    if (currentCostPrice === 0 && currentSellingPrice === 0) {
      setPreviousCurrency(currency);
      return;
    }

    // Valyuta o'zgarganda konvertatsiya qilish
    let newCostPrice = currentCostPrice;
    let newSellingPrice = currentSellingPrice;

    if (previousCurrency === 'UZS' && currency === 'USD') {
      // So'mdan dollarga o'tkazish (bo'lish)
      newCostPrice = currentCostPrice / exchangeRate;
      newSellingPrice = currentSellingPrice / exchangeRate;
    } else if (previousCurrency === 'USD' && currency === 'UZS') {
      // Dollardan so'mga o'tkazish (ko'paytirish)
      newCostPrice = currentCostPrice * exchangeRate;
      newSellingPrice = currentSellingPrice * exchangeRate;
    }

    // Yangi qiymatlarni formatlash
    // Agar butun son bo'lsa, nuqtadan keyin 0 larni ko'rsatmaslik
    let costPriceStr: string;
    let sellingPriceStr: string;
    let costPriceFormatted: string;
    let sellingPriceFormatted: string;
    
    if (currency === 'USD') {
      // Dollar uchun: nuqta bilan kasr (masalan: 3.91)
      costPriceStr = newCostPrice % 1 === 0 
        ? newCostPrice.toFixed(0) 
        : newCostPrice.toFixed(2);
      sellingPriceStr = newSellingPrice % 1 === 0 
        ? newSellingPrice.toFixed(0) 
        : newSellingPrice.toFixed(2);
      costPriceFormatted = costPriceStr;
      sellingPriceFormatted = sellingPriceStr;
    } else {
      // So'm uchun: vergul bilan formatlash
      costPriceStr = newCostPrice.toFixed(0);
      sellingPriceStr = newSellingPrice.toFixed(0);
      costPriceFormatted = formatNumber(costPriceStr);
      sellingPriceFormatted = formatNumber(sellingPriceStr);
    }

    setFormData(prev => ({
      ...prev,
      costPrice: costPriceStr,
      costPriceDisplay: costPriceFormatted,
      sellingPrice: sellingPriceStr,
      sellingPriceDisplay: sellingPriceFormatted
    }));

    // Avvalgi valyutani yangilash
    setPreviousCurrency(currency);
  }, [currency]); // Faqat currency o'zgarganda!

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

    // Balon uchun validatsiya
    if (formData.category === 'balon') {
      if (!formData.tireCategory) {
        newErrors.tireCategory = t("Balon turini tanlang", language);
      }
      if (!formData.tireSize || formData.tireSize.length < 2) {
        newErrors.tireSize = t("Balon o'lchamini tanlang", language);
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Agar faqat bitta narx kiritilgan bo'lsa, ikkinchisini avtomatik to'ldirish
    let costPrice = Number(formData.costPrice) || Number(formData.sellingPrice);
    let sellingPrice = Number(formData.sellingPrice) || Number(formData.costPrice);

    // Agar dollar tanlangan bo'lsa, so'mga o'tkazish
    if (currency === 'USD') {
      costPrice = costPrice * exchangeRate;
      sellingPrice = sellingPrice * exchangeRate;
    }

    // Optimistic update - darhol yangilangan ma'lumotni yaratish
    const optimisticUpdate = {
      ...sparePart,
      name: formData.name,
      costPrice: costPrice,
      sellingPrice: sellingPrice,
      price: sellingPrice,
      quantity: Number(formData.quantity),
      updatedAt: new Date().toISOString(),
      // @ts-ignore - balon maydonlari
      category: formData.category,
      // @ts-ignore
      tireSize: formData.tireSize,
      // @ts-ignore
      tireBrand: formData.tireBrand,
      // @ts-ignore
      tireType: formData.tireType
    };

    // Darhol UI'ni yangilash (backend'dan javob kutmasdan)
    onSuccess(optimisticUpdate);
    onClose();
    setErrors({});

    // Background'da backend'ga yuborish
    try {
      await api.put(`/spare-parts/${sparePart._id}`, {
        name: formData.name,
        costPrice: costPrice,
        sellingPrice: sellingPrice,
        price: sellingPrice,
        quantity: Number(formData.quantity),
        // Balon uchun qo'shimcha maydonlar
        category: formData.category,
        ...(formData.category === 'balon' && {
          tireSize: formData.tireSize,
          tireBrand: formData.tireBrand || undefined,
          tireType: formData.tireType
        })
      });
    } catch (error: any) {
      console.error('Error updating spare part:', error);
      // Xatolik bo'lsa, sahifani qayta yuklash
      window.location.reload();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'costPrice') {
      if (currency === 'USD') {
        // Dollar uchun: nuqta bilan kasr ruxsat etiladi (masalan: 3.91)
        const cleaned = value.replace(/[^\d.]/g, '');
        const parts = cleaned.split('.');
        const formatted = parts.length > 1 
          ? parts[0] + '.' + parts.slice(1).join('').slice(0, 2)
          : parts[0];
        
        setFormData(prev => ({
          ...prev,
          costPrice: formatted,
          costPriceDisplay: formatted
        }));
      } else {
        // So'm uchun: vergul bilan formatlash
        const formatted = formatNumber(value);
        const numericValue = parseFormattedNumber(formatted);
        
        setFormData(prev => ({
          ...prev,
          costPrice: numericValue.toString(),
          costPriceDisplay: formatted
        }));
      }
    } else if (name === 'sellingPrice') {
      if (currency === 'USD') {
        // Dollar uchun: nuqta bilan kasr ruxsat etiladi
        const cleaned = value.replace(/[^\d.]/g, '');
        const parts = cleaned.split('.');
        const formatted = parts.length > 1 
          ? parts[0] + '.' + parts.slice(1).join('').slice(0, 2)
          : parts[0];
        
        setFormData(prev => ({
          ...prev,
          sellingPrice: formatted,
          sellingPriceDisplay: formatted
        }));
      } else {
        // So'm uchun: vergul bilan formatlash
        const formatted = formatNumber(value);
        const numericValue = parseFormattedNumber(formatted);
        
        setFormData(prev => ({
          ...prev,
          sellingPrice: numericValue.toString(),
          sellingPriceDisplay: formatted
        }));
      }
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

          {/* Kategoriya tanlash */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('Kategoriya', language)} *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-all"
            >
              <option value="zapchast">{t('Zapchast', language)}</option>
              <option value="balon">{t('Balon', language)}</option>
              <option value="boshqa">{t('Boshqa', language)}</option>
            </select>
          </div>

          {/* Balon uchun qo'shimcha maydonlar */}
          {formData.category === 'balon' && (
            <div className="space-y-3 bg-blue-50 border-2 border-blue-200 rounded-xl p-3">
              <h3 className="text-xs font-bold text-blue-900 flex items-center gap-2">
                <Package className="h-3 w-3" />
                {t('Balon ma\'lumotlari', language)}
              </h3>
              
              {/* 1-bosqich: Balon kategoriyasi */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('Balon turi', language)} *
                </label>
                <select
                  name="tireCategory"
                  value={formData.tireCategory}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      tireCategory: e.target.value,
                      tireSize: '' // Kategoriya o'zgarganda o'lchamni tozalash
                    }));
                    if (errors.tireCategory) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.tireCategory;
                        return newErrors;
                      });
                    }
                  }}
                  className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none transition-all ${
                    errors.tireCategory 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-purple-500'
                  }`}
                >
                  <option value="">{t('Balon turini tanlang', language)}</option>
                  <option value="R22.5">R22.5 - Standart fura (28 ta o'lcham)</option>
                  <option value="R24.5">R24.5 - Katta fura (7 ta o'lcham)</option>
                  <option value="R19.5">R19.5 - O'rta fura (5 ta o'lcham)</option>
                  <option value="R17.5">R17.5 - Kichik fura (5 ta o'lcham)</option>
                  <option value="R20">R20 - Eski standart (11 ta o'lcham)</option>
                  <option value="R16">R16 - Yengil yuk (12 ta o'lcham)</option>
                  <option value="R15">R15 - Yengil yuk (7 ta o'lcham)</option>
                  <option value="R14">R14 - Kichik yuk (3 ta o'lcham)</option>
                </select>
                {errors.tireCategory && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.tireCategory}
                  </p>
                )}
              </div>

              {/* 2-bosqich: Aniq o'lcham (faqat kategoriya tanlanganda) */}
              {formData.tireCategory && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t('Aniq o\'lcham', language)} *
                  </label>
                  <select
                    name="tireSize"
                    value={formData.tireSize}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none transition-all ${
                      errors.tireSize 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-200 focus:border-purple-500'
                    }`}
                  >
                    <option value="">{t('O\'lchamni tanlang', language)}</option>
                    {tireSizeOptions[formData.tireCategory]?.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  {errors.tireSize && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.tireSize}
                    </p>
                  )}
                </div>
              )}

              {/* Balon turi */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('Balon turi', language)}
                </label>
                <select
                  name="tireType"
                  value={formData.tireType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-all"
                >
                  <option value="universal">{t('Universal', language)}</option>
                  <option value="yozgi">{t('Yozgi', language)}</option>
                  <option value="qishki">{t('Qishki', language)}</option>
                </select>
              </div>

              {/* Balon brendi - ENG OXIRIDA */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('Balon brendi', language)}
                </label>
                <select
                  name="tireBrand"
                  value={formData.tireBrand}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-all"
                >
                  <option value="">{t('Brend tanlang (ixtiyoriy)', language)}</option>
                  <optgroup label={t('Premium brendlar', language)}>
                    <option value="Michelin">Michelin (Fransiya)</option>
                    <option value="Bridgestone">Bridgestone (Yaponiya)</option>
                    <option value="Continental">Continental (Germaniya)</option>
                    <option value="Goodyear">Goodyear (AQSh)</option>
                    <option value="Pirelli">Pirelli (Italiya)</option>
                  </optgroup>
                  <optgroup label={t('O\'rta darajali brendlar', language)}>
                    <option value="Hankook">Hankook (Janubiy Koreya)</option>
                    <option value="Yokohama">Yokohama (Yaponiya)</option>
                    <option value="Kumho">Kumho (Janubiy Koreya)</option>
                    <option value="Dunlop">Dunlop (Buyuk Britaniya)</option>
                    <option value="Firestone">Firestone (AQSh)</option>
                    <option value="BFGoodrich">BFGoodrich (AQSh)</option>
                    <option value="Toyo">Toyo (Yaponiya)</option>
                    <option value="Nokian">Nokian (Finlandiya)</option>
                  </optgroup>
                  <optgroup label={t('Iqtisodiy brendlar', language)}>
                    <option value="Kama">Kama (Rossiya)</option>
                    <option value="Belshina">Belshina (Belarus)</option>
                    <option value="Matador">Matador (Slovakiya)</option>
                  </optgroup>
                  <optgroup label={t('Boshqa', language)}>
                    <option value="Boshqa">Boshqa brend</option>
                  </optgroup>
                </select>
              </div>
            </div>
          )}

          {/* Valyuta tanlash */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-700">{t('Valyuta', language)}:</span>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setCurrency('UZS')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  currency === 'UZS'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t("So'm", language)}
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  currency === 'USD'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                USD
              </button>
            </div>
            {currency === 'USD' && (
              <span className="text-[10px] text-gray-500">
                (1 USD = {exchangeRate.toLocaleString()})
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("O'zini narxi", language)} ({currency === 'UZS' ? t("so'm", language) : 'USD'})
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
                placeholder={currency === 'UZS' ? '800,000' : '62.50'}
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
                {t('Sotish narxi', language)} ({currency === 'UZS' ? t("so'm", language) : 'USD'})
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
                placeholder={currency === 'UZS' ? '1,000,000' : '78.13'}
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
                <div className="text-right">
                  {(() => {
                    const profit = Number(formData.sellingPrice) - Number(formData.costPrice);
                    const profitStr = currency === 'USD' 
                      ? (profit % 1 === 0 ? profit.toFixed(0) : profit.toFixed(2))
                      : profit.toFixed(0);
                    return (
                      <>
                        <span className="text-sm font-bold text-green-600">
                          {formatNumber(profitStr)} {currency === 'UZS' ? t("so'm", language) : 'USD'}
                        </span>
                        {currency === 'USD' && (
                          <div className="text-[10px] text-green-700 mt-0.5">
                            ≈ {formatNumber(Math.round(profit * exchangeRate).toString())} {t("so'm", language)}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
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
              className="flex-1 px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
            >
              {t('Saqlash', language)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSparePartModal;