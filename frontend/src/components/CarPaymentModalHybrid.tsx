import React, { useState, useEffect, useMemo } from 'react';
import { X, DollarSign, AlertCircle, CheckCircle, Car } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { formatCurrency, formatNumber, parseFormattedNumber } from '@/lib/utils';
import { useCarsNew } from '@/hooks/useCarsNew';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { useCarServices } from '@/hooks/useCarServices';
// import { IndexedDBManager } from '@/lib/storage/IndexedDBManager'; // Not used
import toast from 'react-hot-toast';

interface CarPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: any;
  onSuccess: () => void;
}

const CarPaymentModalHybrid: React.FC<CarPaymentModalProps> = ({ isOpen, onClose, car, onSuccess }) => {
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const [cashAmount, setCashAmount] = useState('');
  const [cashAmountDisplay, setCashAmountDisplay] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [cardAmountDisplay, setCardAmountDisplay] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const { updateCar } = useCarsNew();
  const createTransactionMutation = useCreateTransaction();
  
  // ⚡ INSTANT LOADING: useCarServices hook bilan xizmatlarni cache'dan yuklash
  const { data: carServicesData } = useCarServices({ carId: car?._id });
  
  // Xizmatlarni olish va eng oxirgisini tanlash
  const carService = useMemo(() => {
    if (!carServicesData?.services) return null;
    const services = carServicesData.services;
    // Eng oxirgi xizmatni olish (delivered bo'lmagan)
    return services.find((s: any) => s.status !== 'delivered') || null;
  }, [carServicesData]);
  
  const loadingService = !carServicesData && isOpen; // Faqat birinchi marta yuklanayotganda

  useBodyScrollLock(isOpen);

  // Online/Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ⚡ Mashina xizmati yuklanganida qolgan to'lovni o'rnatish
  useEffect(() => {
    if (car && isOpen && carService) {
      const remaining = carService.totalPrice - (carService.paidAmount || 0);
      const formatted = formatNumber(remaining.toString());
      setCashAmount(remaining.toString());
      setCashAmountDisplay(formatted);
      setCardAmount('');
      setCardAmountDisplay('');
    } else if (car && isOpen && !carService && !loadingService) {
      // Agar xizmat topilmasa, mashina narxini o'rnatish
      const carTotal = car.totalEstimate || 0;
      const formatted = formatNumber(carTotal.toString());
      setCashAmount(carTotal.toString());
      setCashAmountDisplay(formatted);
      setCardAmount('');
      setCardAmountDisplay('');
    }
  }, [car, isOpen, carService, loadingService]);

  if (!isOpen || !car) return null;

  const totalPrice = carService?.totalPrice || car.totalEstimate || 0;
  const paidAmount = carService?.paidAmount || 0;
  const remaining = totalPrice - paidAmount;

  if (loadingService) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full mx-2 sm:mx-0 p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('Yuklanmoqda...', language)}</p>
          </div>
        </div>
      </div>
    );
  }

  if (totalPrice === 0) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full mx-2 sm:mx-0 p-6">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 rounded-lg p-1.5 transition-colors">
            <X className="h-5 w-5" />
          </button>
          <div className="text-center py-8">
            <div className="bg-yellow-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t("Xizmat narxi topilmadi", language)}</h3>
            <p className="text-gray-600 mb-6">{t("Bu mashina uchun hali xizmat narxi belgilanmagan.", language)}</p>
            <button onClick={onClose} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              {t("Yopish", language)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const cash = Number(cashAmount) || 0;
    const card = Number(cardAmount) || 0;
    const totalPayment = cash + card;

    if (totalPayment <= 0) {
      newErrors.payment = t("Kamida bitta to'lov miqdorini kiriting", language);
    } else if (totalPayment > remaining) {
      newErrors.payment = t("To'lov miqdori qolgan summadan oshmasligi kerak", language);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCashAmountChange = (value: string) => {
    const formatted = formatNumber(value);
    const numericValue = parseFormattedNumber(formatted);
    setCashAmount(numericValue.toString());
    setCashAmountDisplay(formatted);
    if (errors.payment) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.payment;
        return newErrors;
      });
    }
  };

  const handleCardAmountChange = (value: string) => {
    const formatted = formatNumber(value);
    const numericValue = parseFormattedNumber(formatted);
    setCardAmount(numericValue.toString());
    setCardAmountDisplay(formatted);
    if (errors.payment) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.payment;
        return newErrors;
      });
    }
  };

  const handleQuickAmount = (percentage: number, type: 'cash' | 'card') => {
    const quickAmount = Math.round((remaining * percentage) / 100);
    if (type === 'cash') {
      handleCashAmountChange(quickAmount.toString());
      setCardAmount('0');
      setCardAmountDisplay('0');
    } else {
      handleCardAmountChange(quickAmount.toString());
      setCashAmount('0');
      setCashAmountDisplay('0');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const cash = Number(cashAmount) || 0;
    const card = Number(cardAmount) || 0;
    const totalPayment = cash + card;
    
    // ⚡ INSTANT UI UPDATE: Darhol modal yopish va success ko'rsatish
    toast.success(t('To\'lov qabul qilindi', language));
    
    // Reset form
    setCashAmount('');
    setCashAmountDisplay('');
    setCardAmount('');
    setCardAmountDisplay('');
    setErrors({});
    
    // Darhol modal yopish va success callback
    onSuccess();
    onClose();

    // 🔥 BACKGROUND: To'lovni backend'ga yuborish (foydalanuvchi kutmaydi)
    try {
      console.log('🔵 To\'lov yuborilmoqda (background):', {
        carService: carService?._id,
        cashAmount: cash,
        cardAmount: card,
        totalPayment,
        isOnline
      });

      if (isOnline) {
        // Online rejim - API ishlatish
        const { api } = await import('@/lib/api');
        
        // ✨ YANGI: Agar CarService yo'q bo'lsa, avtomatik yaratish
        let serviceToUse = carService;
        
        if (!serviceToUse) {
          console.log('⚠️ CarService topilmadi, yangi yaratilmoqda...');
          
          const parts = car.parts || [];
          const serviceItems = car.serviceItems || [];
          
          if (parts.length === 0 && serviceItems.length === 0) {
            console.error('❌ Mashina uchun qismlar yoki ish haqi topilmadi');
            return;
          }
          
          const allItems = [
            ...parts.map((p: any) => ({
              name: p.name,
              description: p.description || '',
              price: p.price,
              quantity: p.quantity || 1,
              category: p.category || 'part'
            })),
            ...serviceItems.map((s: any) => ({
              name: s.name,
              description: s.description || 'Ish haqi',
              price: s.price,
              quantity: s.quantity || 1,
              category: s.category || 'labor'
            }))
          ];
          
          const createServiceResponse = await api.post('/car-services', {
            carId: car._id,
            parts: allItems
          });
          
          serviceToUse = createServiceResponse.data.service;
          console.log('✅ Yangi CarService yaratildi:', serviceToUse._id);
        }

        // To'lovlarni qo'shish
        if (serviceToUse) {
          // Naqd to'lovni qo'shish
          if (cash > 0) {
            await api.post(`/car-services/${serviceToUse._id}/payment`, {
              amount: cash,
              paymentMethod: 'cash',
              notes: t('Naqd', language)
            });
            console.log(`💵 Naqd to'lov qo'shildi: ${cash} so'm`);
            
            // ✨ YANGI: Tranzaksiya yaratish (kassa sahifasida ko'rinishi uchun)
            await createTransactionMutation.mutateAsync({
              type: 'income',
              category: t('Mashina to\'lovi', language),
              amount: cash,
              description: `${car.make} ${car.carModel} - ${car.licensePlate} (${t('Naqd', language)})`,
              paymentMethod: 'cash',
              relatedTo: {
                type: 'car',
                id: car._id
              }
            });
            console.log(`✅ Naqd tranzaksiya yaratildi: ${cash} so'm`);
          }
          
          // Plastik to'lovni qo'shish
          if (card > 0) {
            await api.post(`/car-services/${serviceToUse._id}/payment`, {
              amount: card,
              paymentMethod: 'card',
              notes: t('Plastik', language)
            });
            console.log(`💳 Plastik to'lov qo'shildi: ${card} so'm`);
            
            // ✨ YANGI: Tranzaksiya yaratish (kassa sahifasida ko'rinishi uchun)
            await createTransactionMutation.mutateAsync({
              type: 'income',
              category: t('Mashina to\'lovi', language),
              amount: card,
              description: `${car.make} ${car.carModel} - ${car.licensePlate} (${t('Plastik', language)})`,
              paymentMethod: 'card',
              relatedTo: {
                type: 'car',
                id: car._id
              }
            });
            console.log(`✅ Plastik tranzaksiya yaratildi: ${card} so'm`);
          }
        }
      } else {
        // Offline rejim - IndexedDB ishlatish
        console.log('🔴 Offline rejimda to\'lov');
        
        // Tranzaksiyalar yaratish
        if (cash > 0) {
          await createTransactionMutation.mutateAsync({
            type: 'income',
            category: t('Mashina to\'lovi', language),
            amount: cash,
            description: `${car.make} ${car.carModel} - ${car.licensePlate} (${t('Naqd', language)})`,
            paymentMethod: 'cash',
            relatedTo: {
              type: 'car',
              id: car._id
            }
          });
        }
        
        if (card > 0) {
          await createTransactionMutation.mutateAsync({
            type: 'income',
            category: t('Mashina to\'lovi', language),
            amount: card,
            description: `${car.make} ${car.carModel} - ${car.licensePlate} (${t('Plastik', language)})`,
            paymentMethod: 'card',
            relatedTo: {
              type: 'car',
              id: car._id
            }
          });
        }
        
        // Mashinaning to'langan miqdorini yangilash
        const updatedCar = {
          ...car,
          paidAmount: (car.paidAmount || 0) + cash + card
        };
        
        await updateCar(car._id, updatedCar);
      }
      
      console.log('✅ To\'lov muvaffaqiyatli saqlandi (background)');
    } catch (error: any) {
      console.error('❌ To\'lov xatosi (background):', error);
      // Xatolik bo'lsa ham foydalanuvchi ko'rmaydi, chunki modal allaqachon yopilgan
    }
  };

  const totalPaymentAmount = (Number(cashAmount) || 0) + (Number(cardAmount) || 0);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-0 my-4 sm:my-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors">
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {t("Xizmat to'lovi", language)}
                {!isOnline && (
                  <span className="px-2 py-1 text-xs bg-orange-500 text-white rounded-full">
                    Offline
                  </span>
                )}
              </h2>
              <p className="text-white/90 text-sm flex items-center gap-2">
                <Car className="h-4 w-4" />
                {car.make} {car.carModel} - {car.licensePlate}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Xizmat ma'lumotlari */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-500">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">{t('Jami xizmat', language)}</div>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(totalPrice)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">{t("To'langan", language)}</div>
                <div className="text-xl font-bold text-green-600">{formatCurrency(paidAmount)}</div>
              </div>
              <div className="col-span-2">
                <div className="text-sm text-gray-600 mb-1">{t('Qolgan summa', language)}</div>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(remaining)}</div>
              </div>
            </div>
          </div>

          {/* Naqd to'lov */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span>{t("Naqd to'lov", language)}</span>
            </label>
            <input
              type="text"
              value={cashAmountDisplay}
              onChange={(e) => handleCashAmountChange(e.target.value)}
              autoComplete="off"
              className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:border-green-500 transition-all text-lg font-semibold"
              placeholder="0"
            />
            
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => handleQuickAmount(25, 'cash')} className="px-3 py-1.5 text-sm bg-green-100 hover:bg-green-200 rounded-lg font-medium transition-colors">
                25%
              </button>
              <button type="button" onClick={() => handleQuickAmount(50, 'cash')} className="px-3 py-1.5 text-sm bg-green-100 hover:bg-green-200 rounded-lg font-medium transition-colors">
                50%
              </button>
              <button type="button" onClick={() => handleQuickAmount(75, 'cash')} className="px-3 py-1.5 text-sm bg-green-100 hover:bg-green-200 rounded-lg font-medium transition-colors">
                75%
              </button>
              <button type="button" onClick={() => handleQuickAmount(100, 'cash')} className="px-3 py-1.5 text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                {t("To'liq", language)}
              </button>
            </div>
          </div>

          {/* Plastik to'lov */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💳 {t("Plastik to'lov", language)}
            </label>
            <input
              type="text"
              value={cardAmountDisplay}
              onChange={(e) => handleCardAmountChange(e.target.value)}
              autoComplete="off"
              className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 transition-all text-lg font-semibold"
              placeholder="0"
            />
            
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => handleQuickAmount(25, 'card')} className="px-3 py-1.5 text-sm bg-purple-100 hover:bg-purple-200 rounded-lg font-medium transition-colors">
                25%
              </button>
              <button type="button" onClick={() => handleQuickAmount(50, 'card')} className="px-3 py-1.5 text-sm bg-purple-100 hover:bg-purple-200 rounded-lg font-medium transition-colors">
                50%
              </button>
              <button type="button" onClick={() => handleQuickAmount(75, 'card')} className="px-3 py-1.5 text-sm bg-purple-100 hover:bg-purple-200 rounded-lg font-medium transition-colors">
                75%
              </button>
              <button type="button" onClick={() => handleQuickAmount(100, 'card')} className="px-3 py-1.5 text-sm bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                {t("To'liq", language)}
              </button>
            </div>
            
            {errors.payment && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {errors.payment}
              </p>
            )}
          </div>

          {/* Xulosa */}
          {totalPaymentAmount > 0 && totalPaymentAmount <= remaining && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-500">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-gray-900">{t("To'lov xulosasi", language)}</span>
              </div>
              <div className="space-y-2 text-sm">
                {Number(cashAmount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span>{t("Naqd", language)}:</span>
                    </span>
                    <span className="font-bold text-green-600">{formatCurrency(Number(cashAmount))}</span>
                  </div>
                )}
                {Number(cardAmount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">💳 {t("Plastik", language)}:</span>
                    <span className="font-bold text-purple-600">{formatCurrency(Number(cardAmount))}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-gray-600">{t("Jami to'lov", language)}:</span>
                  <span className="font-bold text-blue-600">{formatCurrency(totalPaymentAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("Qolgan summa", language)}:</span>
                  <span className="font-bold text-red-600">{formatCurrency(remaining - totalPaymentAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tugmalar */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('Bekor qilish', language)}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:shadow-lg transition-all"
            >
              {t("To'lovni tasdiqlash", language)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CarPaymentModalHybrid;