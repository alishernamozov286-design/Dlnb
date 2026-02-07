import React, { useState } from 'react';
import { X, Plus, AlertCircle, Package } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface CreateSparePartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPart?: any) => void; // Yangi tovarni qaytarish
}

const CreateSparePartModal: React.FC<CreateSparePartModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  
  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currency, setCurrency] = useState<'UZS' | 'USD'>('UZS'); // Valyuta tanlash
  const [exchangeRate] = useState(12800); // 1 USD = 12,800 UZS (o'zgarmas)
  const [formData, setFormData] = useState({
    name: '',
    costPrice: '', // O'zini narxi
    costPriceDisplay: '', // Formatli ko'rsatish
    sellingPrice: '', // Sotish narxi
    sellingPriceDisplay: '', // Formatli ko'rsatish
    price: '', // Deprecated - backward compatibility
    priceDisplay: '',
    currency: 'UZS', // Valyuta turi
    quantity: '',
    // Balon uchun qo'shimcha maydonlar
    category: 'zapchast' as 'balon' | 'zapchast' | 'boshqa',
    tireType: 'universal' as 'yozgi' | 'qishki' | 'universal',
    tireBrand: '',
    tireCategory: '', // Balon kategoriyasi (R60, R22.5 va h.k.)
    tireSize: '' // Aniq o'lcham
  });

  // Balon uchun avtomatik nom yaratish
  const generateTireName = () => {
    if (formData.category !== 'balon') return '';
    
    const parts = [];
    
    // 1. O'lcham (majburiy)
    if (formData.tireSize) parts.push(formData.tireSize);
    
    // 2. Balon turi
    const typeMap = {
      'yozgi': t('Yozgi', language),
      'qishki': t('Qishki', language),
      'universal': t('Universal', language)
    };
    parts.push(typeMap[formData.tireType]);
    
    // 3. Brend (oxirida, ixtiyoriy)
    if (formData.tireBrand) parts.push(`(${formData.tireBrand})`);
    
    return parts.join(' ');
  };

  // Balon ma'lumotlari o'zgarganda nomni avtomatik yangilash
  React.useEffect(() => {
    if (formData.category === 'balon' && formData.tireSize) {
      const autoName = generateTireName();
      if (autoName) {
        setFormData(prev => ({ ...prev, name: autoName }));
      }
    }
  }, [formData.category, formData.tireSize, formData.tireBrand, formData.tireType]);

  // Kategoriya o'zgarganda nomni tozalash
  React.useEffect(() => {
    if (formData.category !== 'balon') {
      setFormData(prev => ({ ...prev, name: '' }));
    }
  }, [formData.category]);

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

    // Yangi tovar obyektini yaratish (optimistic)
    const newPart = {
      _id: 'temp-' + Date.now(), // Vaqtinchalik ID
      name: formData.category === 'balon' 
        ? formData.name 
        : `${formData.category === 'zapchast' ? t('Zapchast', language) : t('Boshqa', language)} ${formData.name}`,
      costPrice: costPrice,
      sellingPrice: sellingPrice,
      price: sellingPrice,
      currency: currency,
      quantity: Number(formData.quantity),
      category: formData.category,
      tireSize: formData.tireSize,
      tireBrand: formData.tireBrand || '',
      tireType: formData.tireType,
      supplier: '',
      usageCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1. DARHOL modal yopish va UI'ga qo'shish (optimistic update)
    onSuccess(newPart);
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
      currency: 'UZS',
      quantity: '',
      category: 'zapchast',
      tireType: 'universal',
      tireBrand: '',
      tireCategory: '',
      tireSize: ''
    });
    setCurrency('UZS');
    setErrors({});

    // 2. Background'da API so'rovini yuborish
    try {
      // Kategoriya nomini qo'shish
      let finalName = formData.name;
      if (formData.category === 'zapchast') {
        finalName = `${t('Zapchast', language)} ${formData.name}`;
      } else if (formData.category === 'boshqa') {
        finalName = `${t('Boshqa', language)} ${formData.name}`;
      }
      
      const response = await api.post('/spare-parts', {
        name: finalName,
        costPrice: costPrice,
        sellingPrice: sellingPrice,
        price: sellingPrice,
        currency: currency,
        quantity: Number(formData.quantity),
        category: formData.category,
        ...(formData.category === 'balon' && {
          tireSize: formData.tireSize,
          tireBrand: formData.tireBrand || undefined,
          tireType: formData.tireType
        })
      });

      const realPart = response.data.sparePart || response.data;
      
      // Real ID bilan yangilash
      queryClient.setQueryData(['spare-parts', {}], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          spareParts: oldData.spareParts.map((part: any) => 
            part._id === newPart._id ? { ...part, ...realPart } : part
          )
        };
      });
    } catch (error: any) {
      console.error('Error creating spare part:', error);
      // Xatolik bo'lsa, sahifani qayta yuklash
      window.location.reload();
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* IXCHAM MODAL - Scroll kerak emas */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-hidden mx-2">
        {/* Header - IXCHAM */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2.5">
          <button onClick={onClose} className="absolute top-2 right-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
              <Plus className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{t('Yangi zapchast', language)}</h2>
              <p className="text-blue-100 text-[10px]">{t("Ma'lumotlarni kiriting", language)}</p>
            </div>
          </div>
        </div>

        {/* Form - IXCHAM - Barcha maydonlar kichik */}
        <form onSubmit={handleSubmit} className="p-2.5 space-y-2 max-h-[calc(92vh-70px)] overflow-y-auto [&_label]:text-[11px] [&_label]:mb-0.5 [&_input]:px-2 [&_input]:py-1.5 [&_input]:text-xs [&_select]:px-2 [&_select]:py-1.5 [&_select]:text-xs [&_.text-xs]:text-[10px] [&_.text-sm]:text-xs [&_.gap-2]:gap-1 [&_.space-y-4]:space-y-2 [&_.p-4]:p-2 [&_.p-3]:p-2 [&_.rounded-xl]:rounded-lg [&_.mb-2]:mb-0.5 [&_.mt-2]:mt-1">
          {/* Kategoriya tanlash */}
          <div>
            <label className="block font-medium text-gray-700">
              {t('Kategoriya', language)} *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border-2 border-gray-200 rounded-md focus:outline-none focus:border-blue-500 transition-all"
            >
              <option value="zapchast">{t('Zapchast', language)}</option>
              <option value="balon">{t('Balon', language)}</option>
              <option value="boshqa">{t('Boshqa', language)}</option>
            </select>
          </div>

          {/* Balon uchun qo'shimcha maydonlar - STEP BY STEP */}
          {formData.category === 'balon' && (
            <div className="space-y-2.5 bg-blue-50 border-2 border-blue-200 rounded-lg p-2.5">
              <h3 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" />
                {t('Balon ma\'lumotlari', language)}
              </h3>
              
              {/* 1-QADAM: Balon kategoriyasi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('1-qadam: Balon turi', language)} *
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
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-lg focus:outline-none transition-all text-sm sm:text-base ${
                    errors.tireCategory 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-blue-500'
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
                  <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    {errors.tireCategory}
                  </p>
                )}
              </div>

              {/* 2-QADAM: Aniq o'lcham (faqat kategoriya tanlanganda) */}
              {formData.tireCategory && (
                <div className="transition-all duration-300 ease-in-out">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('2-qadam: Aniq o\'lcham', language)} *
                  </label>
                  <select
                    name="tireSize"
                    value={formData.tireSize}
                    onChange={handleChange}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-lg focus:outline-none transition-all text-sm sm:text-base ${
                      errors.tireSize 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                  >
                    <option value="">{t('O\'lchamni tanlang', language)}</option>
                    {tireSizeOptions[formData.tireCategory]?.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  {errors.tireSize && (
                    <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      {errors.tireSize}
                    </p>
                  )}
                </div>
              )}

              {/* 3-QADAM: Balon mavsumi (faqat o'lcham tanlanganda) */}
              {formData.tireSize && (
                <div className="transition-all duration-300 ease-in-out">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('3-qadam: Balon mavsumi', language)} *
                  </label>
                  <select
                    name="tireType"
                    value={formData.tireType}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all text-sm sm:text-base"
                  >
                    <option value="universal">{t('Universal', language)}</option>
                    <option value="yozgi">{t('Yozgi', language)}</option>
                    <option value="qishki">{t('Qishki', language)}</option>
                  </select>
                </div>
              )}

              {/* 4-QADAM: Balon brendi (faqat mavsumi tanlanganda) */}
              {formData.tireSize && formData.tireType && (
                <div className="transition-all duration-300 ease-in-out">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('4-qadam: Balon brendi', language)} ({t('ixtiyoriy', language)})
                  </label>
                  <select
                    name="tireBrand"
                    value={formData.tireBrand}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all text-sm sm:text-base"
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
              )}

              {/* Avtomatik yaratilgan nom ko'rsatish - faqat brend tanlangandan keyin */}
              {formData.tireSize && formData.tireType && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-green-700 mb-1">
                    {t('Avtomatik yaratilgan nom:', language)}
                  </p>
                  <p className="text-sm font-bold text-green-900">
                    {generateTireName() || t('Ma\'lumotlar to\'liq emas', language)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Zapchast nomi - IXCHAM */}
          {formData.category !== 'balon' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {formData.category === 'zapchast' ? t('Zapchast nomi', language) : t('Tovar nomi', language)} *
              </label>
              <div className="flex gap-2">
                <div className="flex-shrink-0 px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg font-medium text-blue-700">
                  {formData.category === 'zapchast' ? t('Zapchast', language) : t('Boshqa', language)}
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none transition-all ${
                    errors.name 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder={formData.category === 'zapchast' ? t('Masalan: Tormoz kolodkasi', language) : t('Masalan: Yog\'', language)}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-[10px] text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-2.5 w-2.5" />
                  {errors.name}
                </p>
              )}
              {/* Avtomatik yaratilgan nom ko'rsatish */}
              {formData.name && (
                <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-2">
                  <p className="text-xs font-semibold text-green-700 mb-1">
                    {t('Saqlanadigan nom:', language)}
                  </p>
                  <p className="text-sm font-bold text-green-900">
                    {formData.category === 'zapchast' ? t('Zapchast', language) : t('Boshqa', language)} {formData.name}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 5-QADAM: Narxlar - IXCHAM (faqat balon turi tanlangandan keyin) */}
          {((formData.category === 'balon' && formData.tireSize && formData.tireType) || (formData.category !== 'balon' && formData.name.length >= 2)) && (
            <div className="transition-all duration-300 ease-in-out">
              {/* Valyuta */}
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs font-medium text-gray-700">{t('Valyuta', language)}:</span>
                <div className="flex bg-gray-100 rounded p-0.5">
                  <button
                    type="button"
                    onClick={() => setCurrency('UZS')}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                      currency === 'UZS'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600'
                    }`}
                  >
                    {t("So'm", language)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                      currency === 'USD'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600'
                    }`}
                  >
                    USD
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* O'zini narxi */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t("O'zini narxi", language)}
                  </label>
                  <input
                    type="text"
                    name="costPrice"
                    value={formData.costPriceDisplay}
                    onChange={handleChange}
                    autoComplete="off"
                    className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:outline-none transition-all ${
                      errors.costPrice 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                    placeholder={currency === 'UZS' ? '800,000' : '62.50'}
                  />
                </div>

                {/* Sotish narxi */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t('Sotish narxi', language)}
                  </label>
                  <input
                    type="text"
                    name="sellingPrice"
                    value={formData.sellingPriceDisplay}
                    onChange={handleChange}
                    autoComplete="off"
                    className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:outline-none transition-all ${
                      errors.sellingPrice 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                    placeholder={currency === 'UZS' ? '1,000,000' : '78.13'}
                  />
                </div>
              </div>

              {/* Foyda */}
              {formData.costPrice && formData.sellingPrice && Number(formData.sellingPrice) >= Number(formData.costPrice) && (
                <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-green-800">{t('Foyda', language)}:</span>
                    <span className="text-sm font-bold text-green-600">
                      {formatNumber((Number(formData.sellingPrice) - Number(formData.costPrice)).toString())} {currency === 'UZS' ? t("so'm", language) : 'USD'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6-QADAM: Miqdor - IXCHAM */}
          {(formData.costPrice || formData.sellingPrice) && (
            <div className="transition-all duration-300 ease-in-out">
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
                className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:outline-none transition-all ${
                  errors.quantity 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-gray-200 focus:border-blue-500'
                }`}
                placeholder="0"
              />
              {errors.quantity && (
                <p className="mt-1 text-[10px] text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-2.5 w-2.5" />
                  {errors.quantity}
                </p>
              )}
            </div>
          )}

          {/* Buttons - IXCHAM */}
          <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('Bekor qilish', language)}
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              {t('Saqlash', language)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSparePartModal;