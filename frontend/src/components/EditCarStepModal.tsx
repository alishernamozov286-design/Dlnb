import React, { useState, useEffect } from 'react';
import { X, Car, ArrowLeft, ArrowRight, Check, Plus, Trash2, Edit, Save, ClipboardList, Users, Calendar, AlertCircle } from 'lucide-react';
import { Car as CarType } from '@/types';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useCarTasks, useUpdateTask, useCreateTask } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { t } from '@/lib/transliteration';
import { format } from 'date-fns';
import { safeFormatDate } from '@/lib/utils';
import api from '@/lib/api';
import DeleteTaskModal from './DeleteTaskModal';

interface EditCarStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: CarType;
  updateCar: (id: string, carData: any) => Promise<any>;
}

interface Part {
  name: string;
  quantity: number;
  price: number;
}

interface ServiceItem {
  name: string;
  price: number;
  quantity: number;
  category: 'part' | 'material' | 'labor';
}

const EditCarStepModal: React.FC<EditCarStepModalProps> = ({ isOpen, onClose, car, updateCar }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { isOnline } = useBackendStatus();
  
  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);
  
  const [formData, setFormData] = useState({
    make: '',
    carModel: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    ownerName: '',
    ownerPhone: '',
    status: 'pending' as 'pending' | 'in-progress' | 'completed' | 'delivered'
  });
  const [parts, setParts] = useState<Part[]>([]);
  const [editingPartIndex, setEditingPartIndex] = useState<number | null>(null);
  const [newPart, setNewPart] = useState<Part>({
    name: '',
    quantity: 1,
    price: 0
  });
  
  // Autocomplete states - O'CHIRILDI
  // const [showSuggestions, setShowSuggestions] = useState(false);
  // const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  // const [selectedSparePartId, setSelectedSparePartId] = useState<string>('');
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null);
  const [newServiceItem, setNewServiceItem] = useState<ServiceItem>({
    name: '',
    price: 0,
    quantity: 1,
    category: 'labor'
  });
  
  const [isUpdating, setIsUpdating] = useState(false);

  // const updateCarMutation = useUpdateCar(); // O'chirildi - prop sifatida keladi
  // const incrementUsageMutation = useIncrementSparePartUsage();
  // const { data: searchResults } = useSearchSpareParts(newPart.name, showSuggestions && newPart.name.length >= 2);
  // const suggestions = searchResults?.spareParts || [];
  
  useBodyScrollLock(isOpen);

  // Ma'lumotlarni yuklash
  useEffect(() => {
    if (car && isOpen) {
      
      setFormData({
        make: car.make || '',
        carModel: car.carModel || '',
        year: car.year || new Date().getFullYear(),
        licensePlate: car.licensePlate || '',
        ownerName: car.ownerName || '',
        ownerPhone: car.ownerPhone || '',
        status: car.status || 'pending'
      });
      
      // Parts loading
      const carParts = car.parts || [];
      if (Array.isArray(carParts) && carParts.length > 0) {
        const validParts = carParts
          .filter(part => part && part.name && Number(part.quantity) > 0 && Number(part.price) >= 0)
          .map(part => ({
            name: String(part.name).trim(),
            quantity: Number(part.quantity),
            price: Number(part.price)
          }));
        setParts(validParts);
      } else {
        setParts([]);
      }
      
      // Service items loading
      const carServiceItems = (car as any).serviceItems || [];
      if (Array.isArray(carServiceItems) && carServiceItems.length > 0) {
        const validServiceItems = carServiceItems
          .filter((item: any) => item && item.name && Number(item.quantity) > 0 && Number(item.price) >= 0)
          .map((item: any) => ({
            name: String(item.name).trim(),
            price: Number(item.price),
            quantity: Number(item.quantity),
            category: item.category || 'labor'
          }));
        setServiceItems(validServiceItems);
      } else {
        setServiceItems([]);
      }
      
      setCurrentStep(1);
      setNewPart({ name: '', quantity: 1, price: 0 });
      setEditingPartIndex(null);
      setNewServiceItem({ name: '', price: 0, quantity: 1, category: 'labor' });
      setEditingServiceIndex(null);
    }
  }, [car, isOpen]);

  // Autocomplete functions - O'CHIRILDI, faqat oddiy input
  const handlePartNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPart(prev => ({ ...prev, name: value }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPart();
    }
  };

  const handleAddPart = () => {
    if (!newPart.name.trim()) {
      alert(t('Qism nomini kiriting', language));
      return;
    }
    if (newPart.quantity <= 0) {
      alert(t("Qism sonini to'g'ri kiriting (1 dan katta bo'lishi kerak)", language));
      return;
    }
    // Narx 0 bo'lsa ham qabul qilamiz, faqat manfiy bo'lmasin
    if (newPart.price < 0) {
      alert(t("Qism narxi manfiy bo'lmasligi kerak", language));
      return;
    }
    
    const newPartData = {
      name: String(newPart.name).trim(),
      quantity: Math.max(1, Number(newPart.quantity)),
      price: Math.max(0, Number(newPart.price)) // 0 ham qabul qilamiz
    };
    
    // Faqat "Keltirish" rejimi - usedSpareParts ga qo'shmaslik
    
    setParts([...parts, newPartData]);
    setNewPart({ name: '', quantity: 1, price: 0 });
  };

  const handleRemovePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handleEditPart = (index: number) => {
    const part = parts[index];
    setNewPart(part);
    setEditingPartIndex(index);
  };

  const handleUpdatePart = () => {
    if (editingPartIndex === null) return;
    
    if (!newPart.name || newPart.quantity <= 0 || newPart.price < 0) {
      alert(t("Qism ma'lumotlarini to'g'ri kiriting", language));
      return;
    }
    
    const updatedParts = [...parts];
    updatedParts[editingPartIndex] = { 
      name: String(newPart.name).trim(),
      quantity: Number(newPart.quantity),
      price: Number(newPart.price)
    };
    
    setParts(updatedParts);
    setNewPart({ name: '', quantity: 1, price: 0 });
    setEditingPartIndex(null);
  };

  const handleCancelEditPart = () => {
    setNewPart({ name: '', quantity: 1, price: 0 });
    setEditingPartIndex(null);
  };

  const handleAddServiceItem = () => {
    if (!newServiceItem.name.trim()) {
      alert(t('Xizmat nomini kiriting', language));
      return;
    }
    if (newServiceItem.quantity <= 0) {
      alert(t("Xizmat sonini to'g'ri kiriting (1 dan katta bo'lishi kerak)", language));
      return;
    }
    if (newServiceItem.price <= 0) {
      alert(t("Xizmat narxini to'g'ri kiriting (0 dan katta bo'lishi kerak)", language));
      return;
    }
    
    const newServiceData = {
      name: String(newServiceItem.name).trim(),
      price: Math.max(0, Number(newServiceItem.price)),
      quantity: Math.max(1, Number(newServiceItem.quantity)),
      category: newServiceItem.category
    };
    
    setServiceItems([...serviceItems, newServiceData]);
    setNewServiceItem({ name: '', price: 0, quantity: 1, category: 'labor' });
  };

  const handleRemoveServiceItem = (index: number) => {
    setServiceItems(serviceItems.filter((_, i) => i !== index));
  };

  const handleEditServiceItem = (index: number) => {
    const item = serviceItems[index];
    setNewServiceItem(item);
    setEditingServiceIndex(index);
  };

  const handleUpdateServiceItem = () => {
    if (editingServiceIndex === null) return;
    
    if (!newServiceItem.name || newServiceItem.quantity <= 0 || newServiceItem.price < 0) {
      alert(t("Xizmat ma'lumotlarini to'g'ri kiriting", language));
      return;
    }
    
    const updatedItems = [...serviceItems];
    updatedItems[editingServiceIndex] = {
      name: String(newServiceItem.name).trim(),
      price: Number(newServiceItem.price),
      quantity: Number(newServiceItem.quantity),
      category: newServiceItem.category
    };
    
    setServiceItems(updatedItems);
    setNewServiceItem({ name: '', price: 0, quantity: 1, category: 'labor' });
    setEditingServiceIndex(null);
  };

  const handleCancelEditServiceItem = () => {
    setNewServiceItem({ name: '', price: 0, quantity: 1, category: 'labor' });
    setEditingServiceIndex(null);
  };

  const handleSubmit = async () => {
    setIsUpdating(true);
    try {
      const finalParts = parts.map(part => ({
        name: String(part.name).trim(),
        quantity: Number(part.quantity) || 1,
        price: Number(part.price) || 0,
        status: 'needed'
      })).filter(part => 
        part.name && 
        part.name.length > 0 && 
        part.quantity > 0 && 
        part.price >= 0
      );

      const finalServiceItems = serviceItems.map(item => ({
        name: String(item.name).trim(),
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        category: item.category || 'labor'
      })).filter(item => 
        item.name && 
        item.name.length > 0 && 
        item.quantity > 0 && 
        item.price >= 0
      );

      const updateData = {
        make: formData.make.trim(),
        carModel: formData.carModel.trim(),
        year: Number(formData.year),
        licensePlate: formData.licensePlate.trim(),
        ownerName: formData.ownerName.trim(),
        ownerPhone: formData.ownerPhone.trim(),
        status: formData.status,
        parts: finalParts,
        serviceItems: finalServiceItems
      };
      
      await updateCar(car._id, updateData);
      
      onClose();
    } catch (error: any) {
      console.error('❌ Error updating car:', error);
      alert(t(`Xatolik: ${error.response?.data?.message || "Noma'lum xatolik"}`, language));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' ? Number(value) : value
    }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1980 + 1 }, (_, i) => currentYear - i);

  const carMakes = [
    'Toyota', 'Chevrolet', 'Daewoo', 'Hyundai', 'Kia', 'Nissan', 
    'Honda', 'Mazda', 'Ford', 'Volkswagen', 'BMW', 'Mercedes-Benz',
    'Audi', 'Lexus', 'Mitsubishi', 'Subaru', 'Suzuki', 'Lada',
    'UAZ', 'GAZ', 'Boshqa'
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col mx-2 sm:mx-0 my-4 sm:my-0">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-white/20 backdrop-blur-sm p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                <Car className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-white">{t('Mashina tahrirlash', language)}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1 sm:p-1.5 transition-all"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="bg-gray-50 border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 md:space-x-8 overflow-x-auto">
            {[
              { step: 1, title: t('Mashina', language) },
              { step: 2, title: t('Qismlar', language) },
              { step: 3, title: t('Ish haqi', language) },
              { step: 4, title: t('Vazifalar', language) }
            ].map(({ step, title }) => (
              <div key={step} className="flex items-center flex-shrink-0">
                <div className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-medium ${
                  step === currentStep 
                    ? 'bg-blue-600 text-white' 
                    : step < currentStep 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-300 text-gray-600'
                }`}>
                  {step < currentStep ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : step}
                </div>
                <span className={`ml-1 sm:ml-2 text-xs sm:text-sm font-medium ${
                  step === currentStep ? 'text-blue-600' : 'text-gray-500'
                } hidden sm:inline`}>
                  {title}
                </span>
                {step < 4 && (
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mx-1 sm:mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">{t("Mashina ma'lumotlari", language)}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('Marka', language)} *</label>
                  <select
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">{t('Tanlang', language)}</option>
                    {carMakes.map((make) => (
                      <option key={make} value={make}>{make}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('Model', language)} *</label>
                  <input
                    type="text"
                    name="carModel"
                    value={formData.carModel}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Lacetti"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('Yili', language)} *</label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('Davlat raqami', language)} *</label>
                  <input
                    type="text"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="01 A 123 BC"
                  />
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm sm:text-md font-medium text-gray-900 mb-3">{t('Egasi', language)}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Ism', language)} *</label>
                    <input
                      type="text"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t("To'liq ism", language)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Telefon', language)} *</label>
                    <input
                      type="tel"
                      name="ownerPhone"
                      value={formData.ownerPhone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+998 XX XXX XX XX"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{t("Qism qo'shish", language)}</h3>
                <span className="text-sm text-gray-500">{parts.length} {t('ta', language)}</span>
              </div>
              
              {/* Qism qo'shish formi */}
              <div className="bg-green-50 rounded-xl p-3 sm:p-4 border border-green-100">
                <div className="space-y-3">
                  {/* Qism nomi input - oddiy, autocomplete yo'q */}
                  <div>
                    <input
                      type="text"
                      value={newPart.name}
                      onChange={handlePartNameChange}
                      onKeyDown={handleKeyDown}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder={t('Qism nomi (mijoz keltiradi)', language) + ' *'}
                    />
                  </div>
                  
                  {/* Boshqa maydonlar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <input
                      type="number"
                      min="1"
                      value={newPart.quantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === '' ? 1 : Math.max(1, Number(value));
                        setNewPart({ ...newPart, quantity: numValue });
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder={t('Soni', language)}
                    />
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={newPart.price || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === '' ? 0 : Math.max(0, Number(value));
                        setNewPart({ ...newPart, price: numValue });
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder={t("Narx (so'm)", language) + ' *'}
                    />
                    <div className="flex items-center justify-center bg-gray-50 rounded-lg px-2 py-1 col-span-2 sm:col-span-1">
                      <span className="text-xs font-medium text-gray-600 text-center">
                        = {((newPart.quantity || 1) * (newPart.price || 0)).toLocaleString()} {t("so'm", language)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={editingPartIndex !== null ? handleUpdatePart : handleAddPart}
                      disabled={!newPart.name.trim() || newPart.quantity <= 0 || newPart.price < 0}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center justify-center py-2 px-3 col-span-2 sm:col-span-1"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      <span className="text-sm">{editingPartIndex !== null ? t('Saqlash', language) : t("Qo'shish", language)}</span>
                    </button>
                  </div>
                  {editingPartIndex !== null && (
                    <button
                      type="button"
                      onClick={handleCancelEditPart}
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white rounded-lg py-2 transition-all text-sm"
                    >
                      {t('Bekor qilish', language)}
                    </button>
                  )}
                </div>
              </div>

              {/* Qismlar ro'yxati */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">{t("Qismlar ro'yxati", language)}</h4>
                {parts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">{t("Qismlar qo'shilmagan", language)}</p>
                ) : (
                  parts.map((part, index) => {
                    return (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-gray-200 rounded-lg p-3 gap-3 sm:gap-0">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                            <Edit className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                              <h5 className="text-sm font-medium text-gray-900 truncate">{part.name}</h5>
                            </div>
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-gray-500 mt-1">
                              <span>{part.quantity} {t('dona', language)}</span>
                              <span className="hidden sm:inline">×</span>
                              <span className="text-green-600 font-medium">{part.price.toLocaleString()} {t("so'm", language)}</span>
                              <span className="hidden sm:inline">=</span>
                              <span className="font-medium">{(part.quantity * part.price).toLocaleString()} {t("so'm", language)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 self-end sm:self-auto flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditPart(index)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePart(index)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Jami */}
              {parts.length > 0 && (
                <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                    <span className="text-sm font-medium text-gray-700">{t('Jami qismlar:', language)}</span>
                    <span className="text-lg font-bold text-green-600">
                      {parts.reduce((sum, part) => sum + (part.quantity * part.price), 0).toLocaleString()} {t("so'm", language)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('Ish haqi va xizmatlar', language)}</h3>
                <span className="text-sm text-gray-500">{serviceItems.length} {t('ta', language)}</span>
              </div>
              
              {/* Xizmat qo'shish formi */}
              <div className="bg-purple-50 rounded-xl p-3 sm:p-4 border border-purple-100">
                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={newServiceItem.name}
                      onChange={(e) => setNewServiceItem({ ...newServiceItem, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder={t('Xizmat nomi', language) + ' *'}
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={newServiceItem.price || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === '' ? 0 : Math.max(0, Number(value));
                        setNewServiceItem({ ...newServiceItem, price: numValue });
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder={t("Narx (so'm)", language) + ' *'}
                    />
                    <input
                      type="number"
                      min="1"
                      value={newServiceItem.quantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === '' ? 1 : Math.max(1, Number(value));
                        setNewServiceItem({ ...newServiceItem, quantity: numValue });
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder={t('Soni', language) + ' *'}
                    />
                    <div className="flex items-center justify-center bg-gray-50 rounded-lg px-2 py-1 col-span-2 sm:col-span-1">
                      <span className="text-xs font-medium text-gray-600 text-center">
                        = {((newServiceItem.quantity || 1) * (newServiceItem.price || 0)).toLocaleString()} {t("so'm", language)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={editingServiceIndex !== null ? handleUpdateServiceItem : handleAddServiceItem}
                      disabled={!newServiceItem.name.trim() || newServiceItem.quantity <= 0}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center justify-center py-2 px-3 col-span-2 sm:col-span-1"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      <span className="text-sm">{editingServiceIndex !== null ? t('Saqlash', language) : t("Qo'shish", language)}</span>
                    </button>
                  </div>
                  {editingServiceIndex !== null && (
                    <button
                      type="button"
                      onClick={handleCancelEditServiceItem}
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white rounded-lg py-2 transition-all text-sm"
                    >
                      {t('Bekor qilish', language)}
                    </button>
                  )}
                </div>
              </div>

              {/* Xizmatlar ro'yxati */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">{t("Xizmatlar ro'yxati", language)}</h4>
                {serviceItems.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">{t("Xizmatlar qo'shilmagan", language)}</p>
                ) : (
                  serviceItems.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-gray-200 rounded-lg p-3 gap-3 sm:gap-0">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="bg-purple-100 p-2 rounded-lg flex-shrink-0">
                          <Edit className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <h5 className="text-sm font-medium text-gray-900 truncate">{item.name}</h5>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium self-start sm:self-auto bg-purple-100 text-purple-800">
                              {t('Ish haqi', language)}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-gray-500 mt-1">
                            <span>{item.quantity} {t('dona', language)}</span>
                            <span className="hidden sm:inline">×</span>
                            <span className="text-purple-600 font-medium">{item.price.toLocaleString()} {t("so'm", language)}</span>
                            <span className="hidden sm:inline">=</span>
                            <span className="font-medium">{(item.quantity * item.price).toLocaleString()} {t("so'm", language)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleEditServiceItem(index)}
                          className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveServiceItem(index)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Jami */}
              {serviceItems.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-3 sm:p-4 border border-purple-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                    <span className="text-sm font-medium text-gray-700">{t('Jami ish haqi:', language)}</span>
                    <span className="text-lg font-bold text-purple-600">
                      {serviceItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString()} {t("so'm", language)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ClipboardList className="h-5 w-5 mr-2 text-orange-600" />
                  {t('Vazifalar', language)}
                </h3>
              </div>

              {/* Mashina ma'lumotlari */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                <h4 className="text-sm font-medium text-gray-900 mb-2">{t("Mashina ma'lumotlari", language)}</h4>
                <p className="text-sm text-gray-600">{formData.make} {formData.carModel} ({formData.year})</p>
                <p className="text-sm text-gray-600">{formData.licensePlate}</p>
                <p className="text-sm text-gray-600">{formData.ownerName} - {formData.ownerPhone}</p>
              </div>

              {/* Vazifalar ro'yxati - faqat online rejimda */}
              {isOnline ? (
                <TasksSection carId={car._id} language={language} />
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                    <p className="text-sm text-yellow-800">
                      {t('Vazifalar bo\'limi offline rejimda mavjud emas', language)}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Qismlar va xizmatlar xulasasi */}
              <div className="space-y-3">
                {parts.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">{t('Qismlar', language)} ({parts.length} {t('ta', language)})</h4>
                    {parts.slice(0, 3).map((part, index) => (
                      <div key={index} className="flex justify-between text-xs text-gray-600 mb-1">
                        <span className="truncate">{part.name} ({part.quantity})</span>
                        <span className="ml-2 flex-shrink-0">{(part.quantity * part.price).toLocaleString()} {t("so'm", language)}</span>
                      </div>
                    ))}
                    {parts.length > 3 && (
                      <p className="text-xs text-gray-500 mt-1">+ {parts.length - 3} {t('ta yana', language)}</p>
                    )}
                    <div className="border-t border-gray-300 pt-2 mt-2">
                      <div className="flex justify-between text-sm font-medium text-gray-900">
                        <span>{t('Jami:', language)}</span>
                        <span>{parts.reduce((sum, part) => sum + (part.quantity * part.price), 0).toLocaleString()} {t("so'm", language)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {serviceItems.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">{t('Xizmatlar', language)} ({serviceItems.length} {t('ta', language)})</h4>
                    {serviceItems.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex justify-between text-xs text-gray-600 mb-1">
                        <span className="truncate">{item.name} ({item.quantity})</span>
                        <span className="ml-2 flex-shrink-0">{(item.quantity * item.price).toLocaleString()} {t("so'm", language)}</span>
                      </div>
                    ))}
                    {serviceItems.length > 3 && (
                      <p className="text-xs text-gray-500 mt-1">+ {serviceItems.length - 3} {t('ta yana', language)}</p>
                    )}
                    <div className="border-t border-gray-300 pt-2 mt-2">
                      <div className="flex justify-between text-sm font-medium text-gray-900">
                        <span>{t('Jami:', language)}</span>
                        <span>{serviceItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString()} {t("so'm", language)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Umumiy jami */}
                {(parts.length > 0 || serviceItems.length > 0) && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex justify-between text-base font-bold text-blue-900">
                      <span>{t('Umumiy jami:', language)}</span>
                      <span>
                        {(
                          parts.reduce((sum, part) => sum + (part.quantity * part.price), 0) +
                          serviceItems.reduce((sum, item) => sum + (item.quantity * item.price), 0)
                        ).toLocaleString()} {t("so'm", language)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('Orqaga', language)}
          </button>
          
          <div className="flex items-center space-x-2 sm:space-x-3 order-1 sm:order-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
            >
              {t('Bekor qilish', language)}
            </button>
            
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center px-4 sm:px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
              >
                {t('Keyingi', language)}
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isUpdating}
                className="flex items-center px-4 sm:px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-1" />
                {isUpdating ? t('Saqlanmoqda...', language) : t('Saqlash', language)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// TasksSection component - vazifalarni ko'rsatish va tahrirlash
const TasksSection: React.FC<{ carId: string; language: 'latin' | 'cyrillic' }> = ({ carId, language }) => {
  const { isOnline } = useBackendStatus();
  
  // Hook'larni doimo chaqirish, lekin offline bo'lsa yoki temp ID bo'lsa natijalarni ignore qilish
  const shouldFetchTasks = carId && !carId.startsWith('temp_');
  const { data: tasksData, isLoading } = useCarTasks(shouldFetchTasks ? carId : '');
  const { data: apprenticesData } = useUsers();
  const updateTaskMutation = useUpdateTask();
  const createTaskMutation = useCreateTask();
  
  const tasks = isOnline && shouldFetchTasks ? (tasksData?.tasks || []) : [];
  const apprentices = isOnline ? (apprenticesData?.users || []) : [];
  
  // Mashina xizmatlarini yuklash
  const [carServices, setCarServices] = React.useState<any[]>([]);
  
  React.useEffect(() => {
    if (!isOnline || !carId) {
      setCarServices([]);
      return;
    }
    
    const loadServices = async () => {
      try {
        const response = await api.get(`/cars/${carId}/services`);
        setCarServices(response.data.services || []);
      } catch (error) {
        console.error('Error loading services:', error);
        setCarServices([]);
      }
    };
    
    loadServices();
  }, [carId, isOnline]);
  
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null);
  const [editingTask, setEditingTask] = React.useState<any>(null);
  const [isAddingNew, setIsAddingNew] = React.useState(false);
  const [taskToDelete, setTaskToDelete] = React.useState<string | null>(null);
  const [newTask, setNewTask] = React.useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    estimatedHours: 1,
    payment: 0,
    service: '', // Xizmat ID
    assignments: [] as any[]
  });

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'in-progress': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getTaskStatusText = (status: string) => {
    switch (status) {
      case 'assigned': return t('Berilgan', language);
      case 'in-progress': return t('Jarayonda', language);
      case 'completed': return t('Tugallangan', language);
      case 'approved': return t('Tasdiqlangan', language);
      case 'rejected': return t('Rad etilgan', language);
      default: return status;
    }
  };

  const handleEditTask = (task: any) => {
    setEditingTaskId(task._id);
    setEditingTask({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate && !isNaN(new Date(task.dueDate).getTime()) ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
      priority: task.priority || 'medium',
      estimatedHours: task.estimatedHours || 1,
      payment: task.payment || 0,
      service: task.service?._id || task.service || '', // Xizmat ID
      assignments: task.assignments || []
    });
  };

  // Tahrirlashda xizmat tanlanganda avtomatik to'ldirish
  const handleEditServiceSelect = (serviceId: string) => {
    const selectedService = carServices.find(s => s._id === serviceId);
    if (selectedService) {
      setEditingTask({
        ...editingTask,
        service: serviceId,
        title: selectedService.name,
        description: selectedService.description || '',
        payment: selectedService.price || 0
      });
    }
  };

  const handleSaveTask = async () => {
    if (!editingTaskId || !editingTask) return;
    
    try {
      // Assignments ni to'g'ri formatga o'tkazish
      const formattedAssignments = editingTask.assignments.map((assignment: any) => ({
        apprenticeId: assignment.apprenticeId || assignment.apprentice?._id || assignment.apprentice,
        percentage: assignment.percentage || 50
      }));

      await updateTaskMutation.mutateAsync({
        id: editingTaskId,
        data: {
          ...editingTask,
          service: editingTask.service || undefined, // Xizmat ID (agar tanlangan bo'lsa)
          assignments: formattedAssignments
        }
      });
      setEditingTaskId(null);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTaskToDelete(taskId);
  };

  // These functions are used by DeleteTaskModal internally
  // const confirmDeleteTask = async () => {
  //   if (!taskToDelete) return;
  //   
  //   try {
  //     await deleteTaskMutation.mutateAsync(taskToDelete);
  //     setTaskToDelete(null);
  //   } catch (error) {
  //     console.error('Error deleting task:', error);
  //   }
  // };

  const handleAddNewTask = async () => {
    if (!newTask.title.trim()) {
      alert(t('Vazifa nomini kiriting', language));
      return;
    }
    
    try {
      // Assignments ni to'g'ri formatga o'tkazish
      const formattedAssignments = newTask.assignments
        .filter((a: any) => a.apprenticeId) // Faqat shogird tanlangan bo'lsa
        .map((assignment: any) => ({
          apprenticeId: assignment.apprenticeId,
          percentage: assignment.percentage || 50
        }));

      await createTaskMutation.mutateAsync({
        ...newTask,
        car: carId,
        assignments: formattedAssignments
      });
      setIsAddingNew(false);
      setNewTask({
        title: '',
        description: '',
        dueDate: '',
        priority: 'medium',
        estimatedHours: 1,
        payment: 0,
        service: '',
        assignments: []
      });
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  // Xizmat tanlanganda avtomatik to'ldirish
  const handleServiceSelect = (serviceId: string) => {
    const selectedService = carServices.find(s => s._id === serviceId);
    if (selectedService) {
      setNewTask({
        ...newTask,
        service: serviceId,
        title: selectedService.name,
        description: selectedService.description || '',
        payment: selectedService.price || 0
      });
    }
  };

  const handleAddApprentice = (taskData: any, setTaskData: (data: any) => void) => {
    setTaskData({
      ...taskData,
      assignments: [
        ...taskData.assignments,
        {
          apprenticeId: '',
          percentage: 50
        }
      ]
    });
  };

  const handleRemoveApprentice = (taskData: any, setTaskData: (data: any) => void, index: number) => {
    setTaskData({
      ...taskData,
      assignments: taskData.assignments.filter((_: any, i: number) => i !== index)
    });
  };

  const handleUpdateApprentice = (taskData: any, setTaskData: (data: any) => void, index: number, field: string, value: any) => {
    const updatedAssignments = [...taskData.assignments];
    
    // Agar shogird tanlanayotgan bo'lsa, uning foizini avtomatik olish
    if (field === 'apprenticeId' && value) {
      const selectedApprentice = apprentices.find((app: any) => app._id === value);
      updatedAssignments[index] = {
        ...updatedAssignments[index],
        apprenticeId: value,
        percentage: selectedApprentice?.percentage || 50 // Shogirdning ustoz bergan foizi
      };
    } else {
      updatedAssignments[index] = {
        ...updatedAssignments[index],
        [field]: value
      };
    }
    
    setTaskData({
      ...taskData,
      assignments: updatedAssignments
    });
  };

  if (isLoading) {
    return (
      <div className="bg-orange-50 rounded-lg p-4 border border-orange-100 text-center">
        <p className="text-sm text-gray-600">{t('Vazifalar yuklanmoqda...', language)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Yangi vazifa qo'shish tugmasi */}
      {!isAddingNew && (
        <button
          onClick={() => setIsAddingNew(true)}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg transition-all border border-orange-200"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm font-medium">{t('Yangi vazifa qo\'shish', language)}</span>
        </button>
      )}

      {/* Yangi vazifa qo'shish formasi */}
      {isAddingNew && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('Yangi vazifa', language)}</h4>
          <div className="space-y-2">
            {/* Xizmat tanlash */}
            {carServices.length > 0 && (() => {
              // Allaqachon berilgan xizmatlar ID larini olish
              const assignedServiceIds = tasks
                .filter((task: any) => task.service)
                .map((task: any) => {
                  // service obyekt yoki string bo'lishi mumkin
                  if (typeof task.service === 'string') {
                    return task.service;
                  }
                  return task.service._id || task.service;
                });
              
              console.log('🔍 Berilgan xizmatlar:', assignedServiceIds);
              console.log('📋 Barcha xizmatlar:', carServices.map((s: any) => s._id));
              
              // Berilmagan xizmatlarni filtrlash
              const availableServices = carServices.filter(
                (service: any) => !assignedServiceIds.includes(service._id)
              );
              
              console.log('✅ Mavjud xizmatlar:', availableServices.map((s: any) => s._id));
              
              if (availableServices.length === 0) {
                return (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-700">
                    {t('Barcha xizmatlar allaqachon berilgan', language)}
                  </div>
                );
              }
              
              return (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t('Xizmat tanlash (ixtiyoriy)', language)}
                  </label>
                  <select
                    value={newTask.service}
                    onChange={(e) => handleServiceSelect(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="">{t('Xizmat tanlang yoki qo\'lda kiriting', language)}</option>
                    {availableServices.map((service: any) => (
                      <option key={service._id} value={service._id}>
                        {service.name} - {service.price?.toLocaleString()} {t("so'm", language)}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })()}
            
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder={t('Vazifa nomi', language)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder={t('Tavsif', language)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
              <div className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 font-medium text-gray-700">
                {newTask.payment ? newTask.payment.toLocaleString() : 0} {t("so'm", language)}
              </div>
            </div>
            
            {/* Shogirdlar */}
            <div className="space-y-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">{t('Shogirdlar', language)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddApprentice(newTask, setNewTask)}
                  className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium"
                >
                  <Plus className="h-3 w-3" />
                  <span>{t('Qo\'shish', language)}</span>
                </button>
              </div>
              
              {newTask.assignments.length === 0 ? (
                <div className="text-center py-3 text-xs text-gray-500">
                  {t('Shogird qo\'shing', language)}
                </div>
              ) : (
                newTask.assignments.map((assignment: any, index: number) => (
                  <div key={index} className="flex items-center space-x-2 bg-white rounded-lg p-2 border border-blue-200">
                    <div className="flex-1">
                      <select
                        value={assignment.apprenticeId}
                        onChange={(e) => handleUpdateApprentice(newTask, setNewTask, index, 'apprenticeId', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">{t('Shogird tanlang', language)}</option>
                        {apprentices.map((app: any) => (
                          <option key={app._id} value={app._id}>
                            {app.name} ({app.percentage || 50}%)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-16 px-2 py-1.5 text-xs border border-gray-200 rounded bg-gray-50 text-center font-medium text-gray-700">
                      {assignment.percentage || 0}%
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveApprentice(newTask, setNewTask, index)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={handleAddNewTask}
                className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
              >
                {t('Saqlash', language)}
              </button>
              <button
                onClick={() => {
                  setIsAddingNew(false);
                  setNewTask({
                    title: '',
                    description: '',
                    dueDate: '',
                    priority: 'medium',
                    estimatedHours: 1,
                    payment: 0,
                    service: '',
                    assignments: []
                  });
                }}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
              >
                {t('Bekor qilish', language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vazifalar ro'yxati */}
      {tasks.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">{t('Vazifalar yo\'q', language)}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task: any) => (
            <div key={task._id} className="bg-white rounded-lg p-3 border border-gray-200">
              {editingTaskId === task._id ? (
                // Tahrirlash rejimi
                <div className="space-y-2">
                  {/* Xizmat tanlash - faqat berilmagan xizmatlar */}
                  {carServices.length > 0 && (() => {
                    // Allaqachon berilgan xizmatlar (hozirgi vazifadan tashqari)
                    const assignedServiceIds = tasks
                      .filter((t: any) => t._id !== task._id && t.service)
                      .map((t: any) => {
                        // service obyekt yoki string bo'lishi mumkin
                        if (typeof t.service === 'string') {
                          return t.service;
                        }
                        return t.service._id || t.service;
                      });
                    
                    console.log('🔍 Tahrirlash - Berilgan xizmatlar:', assignedServiceIds);
                    
                    // Berilmagan xizmatlar
                    const availableServices = carServices.filter(
                      (service: any) => !assignedServiceIds.includes(service._id)
                    );
                    
                    console.log('✅ Tahrirlash - Mavjud xizmatlar:', availableServices.map((s: any) => s._id));
                    
                    if (availableServices.length === 0 && !editingTask.service) {
                      return (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-700">
                          {t('Barcha xizmatlar allaqachon berilgan', language)}
                        </div>
                      );
                    }
                    
                    return (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {t('Xizmat (ixtiyoriy)', language)}
                        </label>
                        <select
                          value={editingTask.service || ''}
                          onChange={(e) => handleEditServiceSelect(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">{t('Xizmat tanlang yoki qo\'lda kiriting', language)}</option>
                          {availableServices.map((service: any) => (
                            <option key={service._id} value={service._id}>
                              {service.name} - {service.price?.toLocaleString()} {t("so'm", language)}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}
                  
                  <input
                    type="text"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    placeholder={t('Vazifa nomi', language)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                  <textarea
                    value={editingTask.description}
                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                    placeholder={t('Tavsif', language)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={editingTask.dueDate}
                      onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                    <div className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 font-medium text-gray-700">
                      {editingTask.payment ? editingTask.payment.toLocaleString() : 0} {t("so'm", language)}
                    </div>
                  </div>
                  
                  {/* Shogirdlar tahrirlash */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">{t('Shogirdlar', language)}</span>
                      <button
                        onClick={() => handleAddApprentice(editingTask, setEditingTask)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        + {t('Qo\'shish', language)}
                      </button>
                    </div>
                    {editingTask.assignments.map((assignment: any, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <select
                          value={assignment.apprenticeId || assignment.apprentice?._id}
                          onChange={(e) => handleUpdateApprentice(editingTask, setEditingTask, index, 'apprenticeId', e.target.value)}
                          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                        >
                          <option value="">{t('Tanlang', language)}</option>
                          {apprentices.map((app: any) => (
                            <option key={app._id} value={app._id}>{app.name}</option>
                          ))}
                        </select>
                        <div className="w-16 px-2 py-1 text-xs border border-gray-200 rounded bg-gray-50 text-center font-medium text-gray-700">
                          {assignment.percentage || 0}%
                        </div>
                        <button
                          onClick={() => handleRemoveApprentice(editingTask, setEditingTask, index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      onClick={handleSaveTask}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      {t('Saqlash', language)}
                    </button>
                    <button
                      onClick={() => {
                        setEditingTaskId(null);
                        setEditingTask(null);
                      }}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                    >
                      {t('Bekor qilish', language)}
                    </button>
                  </div>
                </div>
              ) : (
                // Ko'rish rejimi
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-semibold text-gray-900 truncate">{task.title}</h5>
                      {task.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ml-2 flex-shrink-0 ${getTaskStatusColor(task.status)}`}>
                      {getTaskStatusText(task.status)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    {task.dueDate && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{safeFormatDate(task.dueDate)}</span>
                      </div>
                    )}
                    {task.payment > 0 && (
                      <span className="font-semibold text-green-600">
                        {task.payment.toLocaleString()} {t("so'm", language)}
                      </span>
                    )}
                  </div>

                  {task.assignments && task.assignments.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {task.assignments.map((assignment: any, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-700"
                        >
                          <Users className="h-3 w-3 mr-1" />
                          {assignment.apprentice?.name || t('Noma\'lum', language)}
                          {assignment.percentage && (
                            <span className="ml-1 text-blue-500">({assignment.percentage}%)</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center space-x-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-medium"
                    >
                      <Edit className="h-3 w-3" />
                      <span>{t('Tahrirlash', language)}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-medium"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Delete Task Modal */}
      <DeleteTaskModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        task={taskToDelete}
      />
    </div>
  );
};

export default EditCarStepModal;