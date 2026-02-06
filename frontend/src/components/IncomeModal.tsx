import React, { useState } from 'react';
import { X, DollarSign, FileText, CreditCard, ArrowLeft, User, CheckCircle, Car, Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useDebts, useAddPayment } from '@/hooks/useDebts';
import { useCarsNew } from '@/hooks/useCarsNew';
import { useCreateTransaction } from '@/hooks/useTransactions';
import toast from 'react-hot-toast';
import { t } from '@/lib/transliteration';
import { formatNumber, parseFormattedNumber, formatCurrency } from '@/lib/utils';
import CarPaymentModalHybrid from './CarPaymentModalHybrid';

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const IncomeModal: React.FC<IncomeModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'select' | 'form' | 'debtList' | 'carList'>('select');
  const [selectedType, setSelectedType] = useState<'debt' | 'car' | 'other'>('other');
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [carSearchQuery, setCarSearchQuery] = useState('');
  const [isCarPaymentModalOpen, setIsCarPaymentModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: 0,
    description: '',
    paymentMethod: 'cash' as 'cash' | 'card' | 'click'
  });
  const [amountDisplay, setAmountDisplay] = useState('');

  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // Qarzlar ro'yxatini olish - faqat Kassa qismida ko'rsatish uchun
  const debtsQuery = useDebts({ type: 'receivable' });
  const debtsLoading = debtsQuery.isLoading;
  const debtsError = debtsQuery.error;
  
  // Backend'dan kelgan ma'lumotni to'g'ri parse qilish
  // Backend { debts: [...] } formatida qaytaradi
  const allDebtsData = debtsQuery.data;
  const debtsArray = allDebtsData?.debts || [];
  
  // Debug ma'lumotlari
  console.log('💰 Debts debug:', {
    rawData: allDebtsData,
    debtsArray: debtsArray,
    debtsArrayLength: debtsArray?.length || 0,
    isLoading: debtsLoading,
    isArray: Array.isArray(debtsArray),
    error: debtsError
  });
  
  const debts = Array.isArray(debtsArray) 
    ? debtsArray.filter((debt: any) => {
        const remaining = debt.amount - (debt.paidAmount || 0);
        console.log(`🔍 Debt ${debt.creditorName}: amount=${debt.amount}, paid=${debt.paidAmount}, remaining=${remaining}`);
        return remaining > 0;
      })
    : [];
  
  console.log('✅ Final filtered debts:', debts.length);

  // Avtomobillar ro'yxatini olish
  const { cars: allCars, loading: carsLoading, isOnline: carsOnline } = useCarsNew();
  
  // Debug ma'lumotlari
  console.log('🚗 Cars debug:', {
    allCars: allCars?.length || 0,
    isLoading: carsLoading,
    isOnline: carsOnline,
    carsArray: Array.isArray(allCars) ? allCars.length : 'not array'
  });
  const carsArray = Array.isArray(allCars) ? allCars : [];
  
  // Qarzi bor mashina ID larini ajratib olish
  const carsWithDebtIds = new Set(
    debts
      .filter((debt: any) => debt.car && debt.car._id)
      .map((debt: any) => debt.car._id)
  );
  
  // 1. Avtomobil to'lovi uchun: FAQAT FAOL mashinalar (qarzi bo'lmagan)
  const activeCarsForPayment = carsArray.filter((car: any) => {
    // Arxivdagi mashinalarni chiqarib tashlash
    if (car.isDeleted || car.status === 'completed' || car.status === 'delivered') {
      return false;
    }
    
    // Qarzi bor mashinalarni chiqarib tashlash (ular qarzlar sahifasida)
    if (carsWithDebtIds.has(car._id)) {
      return false;
    }
    
    // Qarzi bor mashinalarni filtrlash (hali to'lanmagan)
    const totalPrice = car.totalEstimate || 0;
    const paidAmount = car.paidAmount || 0;
    const remaining = totalPrice - paidAmount;
    return remaining > 0; // Faqat qarzi bor mashinalar
  });
  
  // 2. Qarz to'lovi uchun: FAQAT qarzlar sahifasida mavjud mashinalar
  const carsWithDebtForPayment = carsArray.filter((car: any) => {
    return carsWithDebtIds.has(car._id);
  });
  
  // Qaysi ro'yxatni ishlatishni aniqlash
  const carsToShow = selectedType === 'car' ? activeCarsForPayment : carsWithDebtForPayment;
  
  // Avtomobillarni qidirish
  const filteredCars = carsToShow.filter((car: any) => {
    if (!carSearchQuery) return true;
    
    // Qidiruv so'zini tozalash (bo'shliqlar, kichik harflar, maxsus belgilar)
    const normalizeText = (text: string) => {
      return text
        .toLowerCase()
        .replace(/\s+/g, '') // Barcha bo'shliqlarni olib tashlash
        .replace(/[^a-z0-9]/g, ''); // Faqat harf va raqamlar
    };
    
    const query = normalizeText(carSearchQuery);
    const licensePlate = normalizeText(car.licensePlate || '');
    const make = normalizeText(car.make || '');
    const model = normalizeText(car.carModel || '');
    const owner = normalizeText(car.ownerName || '');
    
    return (
      licensePlate.includes(query) ||
      make.includes(query) ||
      model.includes(query) ||
      owner.includes(query)
    );
  });

  // Qarz to'lovi uchun mutation
  const createTransactionMutation = useCreateTransaction();
  const addPaymentMutation = useAddPayment();

  const handleClose = () => {
    setStep('select');
    setSelectedType('other');
    setSelectedDebt(null);
    setSelectedCar(null);
    setCarSearchQuery('');
    setFormData({
      amount: 0,
      description: '',
      paymentMethod: 'cash'
    });
    setAmountDisplay('');
    onClose();
  };

  const handleTypeSelect = (type: 'debt' | 'car' | 'other') => {
    setSelectedType(type);
    if (type === 'debt') {
      setStep('debtList');
    } else if (type === 'car') {
      setStep('carList');
    } else {
      setStep('form');
    }
  };

  const handleCarSelect = (car: any) => {
    setSelectedCar(car);
    setIsCarPaymentModalOpen(true);
  };

  const handleCarPaymentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['cars'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['transaction-summary'] });
    queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
    toast.success(t('To\'lov muvaffaqiyatli amalga oshirildi', language));
    handleClose();
  };

  const handleDebtSelect = (debt: any) => {
    setSelectedDebt(debt);
    setStep('form');
    const remaining = debt.amount - debt.paidAmount;
    setFormData(prev => ({
      ...prev,
      amount: remaining,
      description: `${debt.creditorName} qarzini to'lovi`
    }));
    setAmountDisplay(formatNumber(remaining.toString()));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatNumber(value);
    const numericValue = parseFormattedNumber(formatted);
    
    setAmountDisplay(formatted);
    setFormData(prev => ({ ...prev, amount: numericValue }));
  };

  const handleQuickAmount = (percentage: number) => {
    if (selectedDebt) {
      const remaining = selectedDebt.amount - selectedDebt.paidAmount;
      const quickAmount = Math.round((remaining * percentage) / 100);
      setAmountDisplay(formatNumber(quickAmount.toString()));
      setFormData(prev => ({ ...prev, amount: quickAmount }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (formData.amount <= 0) {
      toast.error(t('Summa 0 dan katta bo\'lishi kerak', language));
      return;
    }

    if (!formData.description.trim()) {
      toast.error(t('Izoh majburiy', language));
      return;
    }

    // Agar qarz to'lovi bo'lsa
    if (selectedType === 'debt' && selectedDebt) {
      const remaining = selectedDebt.amount - selectedDebt.paidAmount;
      
      if (formData.amount > remaining) {
        toast.error(t('Summa qolgan qarzdan oshmasligi kerak', language));
        return;
      }

      try {
        // Qarz to'lovini qo'shish (hybrid)
        await addPaymentMutation.mutateAsync({
          id: selectedDebt._id,
          amount: formData.amount,
          notes: `${t('To\'lov usuli', language)}: ${formData.paymentMethod === 'cash' ? t('Naqd', language) : formData.paymentMethod === 'card' ? t('Karta', language) : 'Click'}${formData.description ? ` - ${formData.description}` : ''}`
        });

        // Tranzaksiya yaratish (hybrid)
        await createTransactionMutation.mutateAsync({
          type: 'income',
          category: t('Qarz to\'lovi', language),
          amount: formData.amount,
          description: formData.description,
          paymentMethod: formData.paymentMethod,
          relatedTo: {
            type: 'debt',
            id: selectedDebt._id
          }
        });

        handleClose();
      } catch (error) {
        // Error handled by mutations
      }
    } else {
      // Oddiy kirim
      const categoryMap = {
        debt: t('Qarz to\'lovi', language),
        car: t('Mashina to\'lovi', language),
        other: t('Boshqa kirim', language)
      };

      try {
        await createTransactionMutation.mutateAsync({
          type: 'income',
          category: categoryMap[selectedType],
          amount: formData.amount,
          description: formData.description,
          paymentMethod: formData.paymentMethod,
          relatedTo: {
            type: selectedType,
            id: null
          }
        });

        handleClose();
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-t-2xl sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {step !== 'select' && (
                  <button
                    onClick={() => {
                      if (step === 'debtList') {
                        setStep('select');
                      } else if (step === 'carList') {
                        setStep('select');
                      } else if (step === 'form' && selectedType === 'debt') {
                        setStep('debtList');
                        setSelectedDebt(null);
                      } else {
                        setStep('select');
                      }
                    }}
                    className="text-white/80 hover:text-white p-1"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                <div className="bg-white/20 p-2 rounded-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {step === 'debtList' ? t('Qarz tanlash', language) : 
                   step === 'carList' ? t('Avtomobil tanlash', language) : 
                   t('Kirim qo\'shish', language)}
                  {!navigator.onLine && (
                    <span className="px-2 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                      Offline
                    </span>
                  )}
                </h3>
              </div>
              <button onClick={handleClose} className="text-white/80 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Step 1: Kirim turini tanlash */}
            {step === 'select' && (
              <div className="space-y-4">
                <p className="text-gray-600 text-sm mb-6">
                  {t('Kirim turini tanlang:', language)}
                </p>

                <button
                  onClick={() => handleTypeSelect('debt')}
                  className="w-full p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-500 p-3 rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {t('Qarz to\'lovi', language)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t('Kimdir qarzini to\'lasa', language)}
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleTypeSelect('car')}
                  className="w-full p-4 bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-purple-500 p-3 rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {t('Mashina to\'lovi', language)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t('Mashina puli berilsa', language)}
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleTypeSelect('other')}
                  className="w-full p-4 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-xl hover:border-green-400 hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-500 p-3 rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {t('Boshqa kirim', language)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t('Qandaydir sabab tufayli kirim', language)}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Step 2: Qarzlar ro'yxati */}
            {step === 'debtList' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  {t('Qarz to\'lovchini tanlang:', language)}
                </p>

                {debtsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('Yuklanmoqda...', language)}</p>
                  </div>
                ) : debtsError ? (
                  <div className="text-center py-8">
                    <p className="text-red-500">{t('Xatolik yuz berdi', language)}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {debtsError instanceof Error ? debtsError.message : t('Ma\'lumotlarni yuklashda xatolik', language)}
                    </p>
                  </div>
                ) : debts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">{t('Hozircha qarzlar yo\'q', language)}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {t('Qarzlar avtomatik yaratiladi', language)}
                    </p>
                    {debtsArray.length > 0 && (
                      <p className="text-xs text-orange-500 mt-2">
                        {t('Barcha qarzlar to\'liq to\'langan', language)} ({debtsArray.length} ta)
                      </p>
                    )}
                  </div>
                ) : (
                  debts.map((debt: any) => {
                    const remaining = debt.amount - debt.paidAmount;
                    return (
                      <button
                        key={debt._id}
                        onClick={() => handleDebtSelect(debt)}
                        className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 transition-all text-left group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors">
                              <User className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{debt.creditorName}</p>
                              {debt.creditorPhone && (
                                <p className="text-sm text-gray-600">{debt.creditorPhone}</p>
                              )}
                              <div className="mt-2 space-y-1">
                                <p className="text-xs text-gray-500">
                                  {t('Jami qarz', language)}: <span className="font-semibold">{formatCurrency(debt.amount)}</span>
                                </p>
                                <p className="text-xs text-gray-500">
                                  {t('To\'langan', language)}: <span className="font-semibold text-green-600">{formatCurrency(debt.paidAmount)}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-1">{t('Qolgan', language)}</p>
                            <p className="text-lg font-bold text-red-600">{formatCurrency(remaining)}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* Step 2.5: Avtomobillar ro'yxati */}
            {step === 'carList' && (
              <div className="space-y-3">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3">
                    {t('Avtomobilni tanlang:', language)}
                  </p>
                  
                  {/* Qidiruv */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={carSearchQuery}
                      onChange={(e) => setCarSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 transition-all"
                      placeholder={t('Davlat raqami, marka yoki egasi...', language)}
                    />
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {carsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">{t('Yuklanmoqda...', language)}</p>
                      {!carsOnline && (
                        <p className="text-xs text-orange-600 mt-2">
                          {t('Offline rejimda ma\'lumotlar yuklanmoqda...', language)}
                        </p>
                      )}
                    </div>
                  ) : filteredCars.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        {carSearchQuery 
                          ? t('Avtomobil topilmadi', language)
                          : selectedType === 'car' 
                            ? t('Faol avtomobillar yo\'q', language)
                            : t('Qarzi bor avtomobillar yo\'q', language)
                        }
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {selectedType === 'car' 
                          ? t('Barcha mashinalar arxivda yoki to\'liq to\'langan', language)
                          : t('Barcha mashinalar to\'liq to\'langan', language)
                        }
                      </p>
                    </div>
                  ) : (
                    filteredCars.map((car: any) => {
                      const totalPrice = car.totalEstimate || 0;
                      const paidAmount = car.paidAmount || 0;
                      const remaining = totalPrice - paidAmount;
                      const isPaid = remaining <= 0;
                      
                      return (
                        <button
                          key={car._id}
                          onClick={() => handleCarSelect(car)}
                          disabled={isPaid}
                          className={`w-full p-4 bg-white border-2 rounded-xl transition-all text-left group ${
                            isPaid 
                              ? 'border-green-200 bg-green-50 opacity-60 cursor-not-allowed' 
                              : 'border-gray-200 hover:border-purple-400'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className={`p-2 rounded-lg transition-colors ${
                                isPaid 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-purple-100 group-hover:bg-purple-500 group-hover:text-white'
                              }`}>
                                <Car className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-gray-900">
                                    {car.make} {car.carModel}
                                  </p>
                                  {isPaid && (
                                    <span className="px-2 py-0.5 text-xs font-semibold bg-green-500 text-white rounded-full">
                                      {t('Yopilgan', language)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm font-mono text-purple-600 font-bold">
                                  {car.licensePlate}
                                </p>
                                {car.ownerName && (
                                  <p className="text-sm text-gray-600">{car.ownerName}</p>
                                )}
                                {totalPrice > 0 && (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-xs text-gray-500">
                                      {t('Jami xizmat', language)}: <span className="font-semibold">{formatCurrency(totalPrice)}</span>
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {t('To\'langan', language)}: <span className="font-semibold text-green-600">{formatCurrency(paidAmount)}</span>
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              {isPaid ? (
                                <div className="flex flex-col items-end">
                                  <CheckCircle className="h-8 w-8 text-green-500 mb-1" />
                                  <p className="text-xs text-green-600 font-semibold">{t('To\'liq to\'langan', language)}</p>
                                </div>
                              ) : (
                                <>
                                  <p className="text-xs text-gray-500 mb-1">{t('Qolgan', language)}</p>
                                  <p className="text-lg font-bold text-red-600">{formatCurrency(remaining)}</p>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Step 3: To'lov formasi */}
            {step === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Agar qarz to'lovi bo'lsa, qarz ma'lumotlarini ko'rsatish */}
                {selectedDebt && (
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-gray-900">{selectedDebt.creditorName}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-600">{t('Jami qarz', language)}</div>
                        <div className="font-bold text-gray-900">{formatCurrency(selectedDebt.amount)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">{t('To\'langan', language)}</div>
                        <div className="font-bold text-green-600">{formatCurrency(selectedDebt.paidAmount)}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-gray-600">{t('Qolgan qarz', language)}</div>
                        <div className="text-xl font-bold text-red-600">{formatCurrency(selectedDebt.amount - selectedDebt.paidAmount)}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="label">
                    <DollarSign className="h-4 w-4 inline mr-1" />
                    {t('Summa (so\'m)', language)} *
                  </label>
                  <input
                    type="text"
                    value={amountDisplay}
                    onChange={handleAmountChange}
                    className="input"
                    placeholder="1.000.000"
                    required
                  />
                  
                  {/* Tez to'lov tugmalari (faqat qarz to'lovi uchun) */}
                  {selectedDebt && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickAmount(25)}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                      >
                        25%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAmount(50)}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAmount(75)}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                      >
                        75%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAmount(100)}
                        className="px-3 py-1 text-xs bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                      >
                        {t('To\'liq to\'lash', language)}
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">
                    <FileText className="h-4 w-4 inline mr-1" />
                    {t('Izoh', language)} *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="input"
                    rows={3}
                    placeholder={t('Kirim haqida ma\'lumot...', language)}
                    required
                  />
                </div>

                <div>
                  <label className="label">
                    <CreditCard className="h-4 w-4 inline mr-1" />
                    {t('To\'lov usuli', language)}
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as 'cash' | 'card' | 'click' }))}
                    className="input"
                  >
                    <option value="cash">{t('Naqd', language)}</option>
                    <option value="card">{t('Karta', language)}</option>
                    <option value="click">Click</option>
                  </select>
                </div>

                {/* Xulosa */}
                {formData.amount > 0 && (
                  <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-gray-900">{t('Xulosa', language)}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('Kirim miqdori', language)}:</span>
                        <span className="font-bold text-gray-900">{formatCurrency(formData.amount)}</span>
                      </div>
                      {selectedDebt && (
                        <div className="flex justify-between pt-2 border-t border-gray-300">
                          <span className="text-gray-600">{t('Qolgan qarz', language)}:</span>
                          <span className="font-bold text-red-600">
                            {formatCurrency((selectedDebt.amount - selectedDebt.paidAmount) - formData.amount)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedType === 'debt') {
                        setStep('debtList');
                        setSelectedDebt(null);
                      } else {
                        setStep('select');
                      }
                    }}
                    className="btn-secondary"
                  >
                    {t('Orqaga', language)}
                  </button>
                  <button
                    type="submit"
                    disabled={createTransactionMutation.isPending || addPaymentMutation.isPending}
                    className="btn-primary disabled:opacity-50"
                  >
                    {(createTransactionMutation.isPending || addPaymentMutation.isPending) ? t('Saqlanmoqda...', language) : t('Saqlash', language)}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* CarPaymentModalHybrid */}
      {selectedCar && (
        <CarPaymentModalHybrid
          isOpen={isCarPaymentModalOpen}
          onClose={() => {
            setIsCarPaymentModalOpen(false);
            setSelectedCar(null);
          }}
          car={selectedCar}
          onSuccess={handleCarPaymentSuccess}
        />
      )}
    </div>
  );
};

export default IncomeModal;