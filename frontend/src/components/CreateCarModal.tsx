import React, { useState } from 'react';
import { X, Car, Package, Plus, Trash2, ChevronRight, Wrench, Box, Briefcase, FileText, User, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { useCarsNew } from '@/hooks/useCarsNew';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useUsers } from '@/hooks/useUsers';
import { useCreateTask } from '@/hooks/useTasks';
import { formatCurrency } from '@/lib/utils';
import { t } from '@/lib/transliteration';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface CreateCarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Part {
  name: string;
  quantity: number;
  price: number;
  category: 'part' | 'material' | 'labor';
  source: 'available' | 'tobring'; // Yangi field: bizda bor yoki keltirish
}

interface UsedSparePart {
  sparePartId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ApprenticeAssignment {
  id: string;
  apprenticeId: string;
  percentage: number;
}

interface TaskItem {
  id: string;
  service: string;
  assignments: ApprenticeAssignment[];
  title: string;
  description: string;
  priority: string;
  dueDate: string;
  estimatedHours: number;
  payment: number;
}



const CreateCarModal: React.FC<CreateCarModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  
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
    ownerPhone: ''
  });
  
  // Ehtiyot qismlar va materiallar
  const [items, setItems] = useState<Part[]>([]);
  const [usedSpareParts, setUsedSpareParts] = useState<UsedSparePart[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [displayItemPrice, setDisplayItemPrice] = useState('0');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [tobringPrice, setTobringPrice] = useState(''); // Keltirish uchun pul
  const [displayTobringPrice, setDisplayTobringPrice] = useState('0'); // Keltirish uchun ko'rsatiladigan pul
  
  // Vazifalar (Step 4)
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [carServices, setCarServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);

  const { isOnline } = useCarsNew();
  const createTaskMutation = useCreateTask();
  const { data: usersData, isLoading: usersLoading } = useUsers();
  
  // Faqat shogirtlarni filtrlash
  const apprentices = React.useMemo(() => {
    const users = usersData?.users || [];
    const filtered = users.filter((u: any) => u.role === 'apprentice');
    console.log('👥 Shogirtlar:', filtered);
    return filtered;
  }, [usersData]);
  
  useBodyScrollLock(isOpen);

  // Modal ochilganda state'larni tozalash
  React.useEffect(() => {
    if (isOpen) {
      // Barcha state'larni tozalash
      setCurrentStep(1);
      setFormData({
        make: '',
        carModel: '',
        year: new Date().getFullYear(),
        licensePlate: '',
        ownerName: '',
        ownerPhone: ''
      });
      setItems([]);
      setUsedSpareParts([]);
      setTasks([]);
      setCarServices([]);
      setItemName('');
      setItemPrice('');
      setDisplayItemPrice('0');
      setItemQuantity('1');
      setTobringPrice('');
      setDisplayTobringPrice('0');
    }
  }, [isOpen]);

  // laborItems va partsAndMaterials ni olish
  const partsAndMaterials = items.filter(item => item.category !== 'labor');
  const laborItems = items.filter(item => item.category === 'labor');

  // Step 4 ga o'tganda xizmatlarni yuklash
  React.useEffect(() => {
    const loadCarServices = async () => {
      if (currentStep === 4) {
        setLoadingServices(true);
        try {
          // YANGI MASHINA QO'SHAYOTGANDA - faqat laborItems dan olish
          // createdCarId faqat mashina yaratilgandan KEYIN to'ldiriladi
          console.log('� LaborItems dan xizmatlar olinmoqda');
          const currentLaborItems = items.filter(item => item.category === 'labor');
          const services = currentLaborItems.map((item, index) => ({
            _id: `temp-${index}`, // Vaqtinchalik ID
            name: item.name,
            description: 'Ish haqi',
            price: item.price,
            category: 'labor',
            quantity: 1
          }));
          console.log('✅ Xizmatlar tayyor:', services);
          setCarServices(services);
        } catch (error: any) {
          console.error('❌ Xizmatlarni yuklashda xatolik:', error);
          setCarServices([]);
        } finally {
          setLoadingServices(false);
        }
      }
    };

    loadCarServices();
  }, [currentStep, items]); // items dependency qo'shamiz

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\./g, '');
    const numValue = parseInt(value) || 0;
    
    setItemPrice(numValue.toString());
    setDisplayItemPrice(numValue === 0 ? '0' : formatNumber(numValue));
  };

  const handlePriceFocus = () => {
    if (itemPrice === '0' || !itemPrice) {
      setDisplayItemPrice('');
    }
  };

  const handlePriceBlur = () => {
    if (displayItemPrice === '' || itemPrice === '0' || !itemPrice) {
      setDisplayItemPrice('0');
      setItemPrice('0');
    }
  };

  // Autocomplete functions - O'CHIRILDI, faqat oddiy input
  const handleItemNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setItemName(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addItem();
    }
  };

  // Ish haqi o'zgarganda to'lov avtomatik yangilansin - olib tashlandi

  const addItem = () => {
    if (itemName && itemPrice !== undefined && itemPrice !== null) {
      const quantity = parseInt(itemQuantity) || 1;
      
      // Faqat "Keltirish" rejimi, hech qanday tekshiruv kerak emas
      const price = parseFloat(tobringPrice) || 0;
      
      // Items ga qo'shish (UI uchun)
      setItems(prev => [...prev, {
        name: itemName,
        description: '',
        price: price,
        quantity: quantity,
        category: 'part', // Har doim part
        source: 'tobring' // Har doim keltirish
      }]);
      
      // Reset form
      setItemName('');
      setItemPrice('');
      setDisplayItemPrice('0');
      setItemQuantity('1');
      setTobringPrice(''); // Keltirish pulini tozalash
      setDisplayTobringPrice('0'); // Keltirish ko'rsatiladigan pulini tozalash
      
      // Success message
      toast.success(t('Qism qo\'shildi', language));
    }
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Task functions (Step 4)
  const addTask = () => {
    const newTask: TaskItem = {
      id: Date.now().toString(),
      service: '',
      assignments: [],
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      estimatedHours: 1,
      payment: 0
    };
    setTasks([...tasks, newTask]);
  };

  const addApprentice = (taskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          assignments: [
            ...task.assignments,
            {
              id: Date.now().toString(),
              apprenticeId: '',
              percentage: 50
            }
          ]
        };
      }
      return task;
    }));
  };

  const removeApprentice = (taskId: string, assignmentId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          assignments: task.assignments.filter(a => a.id !== assignmentId)
        };
      }
      return task;
    }));
  };

  const updateApprentice = (taskId: string, assignmentId: string, field: 'apprenticeId' | 'percentage', value: any) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          assignments: task.assignments.map(assignment => {
            if (assignment.id === assignmentId) {
              if (field === 'apprenticeId' && value) {
                const selectedApprentice = apprentices.find((a: any) => a._id === value);
                const apprenticePercentage = selectedApprentice?.percentage || 50;
                return { 
                  ...assignment, 
                  apprenticeId: value,
                  percentage: apprenticePercentage 
                };
              }
              return assignment;
            }
            return assignment;
          })
        };
      }
      return task;
    }));
  };

  const removeTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const updateTask = (taskId: string, field: keyof TaskItem, value: any) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const updatedTask = { ...task, [field]: value };
        
        if (field === 'service' && value) {
          const selectedService = carServices.find(service => service._id === value);
          if (selectedService) {
            updatedTask.payment = selectedService.price;
            updatedTask.title = selectedService.name;
          }
        }
        
        return updatedTask;
      }
      return task;
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'part': return <Wrench className="h-4 w-4" />;
      case 'material': return <Box className="h-4 w-4" />;
      case 'labor': return <Briefcase className="h-4 w-4" />;
      default: return <Wrench className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'part': return 'bg-blue-100 text-blue-700';
      case 'material': return 'bg-green-100 text-green-700';
      case 'labor': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validatsiya
    if (!formData.make || !formData.carModel || !formData.licensePlate || !formData.ownerName || !formData.ownerPhone) {
      alert('Barcha maydonlarni to\'ldiring');
      return;
    }

    const phoneDigits = formData.ownerPhone.replace(/\D/g, '');
    if (phoneDigits.length !== 12 || !phoneDigits.startsWith('998')) {
      alert('Telefon raqami +998 XX XXX XX XX formatida bo\'lishi kerak');
      return;
    }

    const plateClean = formData.licensePlate.replace(/\s/g, '');
    const isOldFormat = /^[0-9]{2}[A-Z]{1}[0-9]{3}[A-Z]{2}$/.test(plateClean);
    const isNewFormat = /^[0-9]{5}[A-Z]{3}$/.test(plateClean);
    
    if (!isOldFormat && !isNewFormat) {
      alert('Davlat raqami noto\'g\'ri formatda. Masalan: 01 A 123 BC yoki 01 123 ABC');
      return;
    }
    
    // Vazifalar validatsiyasi (agar qo'shilgan bo'lsa)
    if (tasks.length > 0) {
      for (const task of tasks) {
        if (!task.title || !task.dueDate || task.assignments.length === 0) {
          alert(`Vazifa "${task.title || 'Noma\'lum'}" uchun barcha majburiy maydonlarni to'ldiring`);
          return;
        }
        
        for (const assignment of task.assignments) {
          if (!assignment.apprenticeId) {
            alert(`Vazifa "${task.title}" uchun barcha shogirdlarni tanlang`);
            return;
          }
        }
      }
    }
    
    try {
      // 1. Mashinani yaratish
      const totalEstimate = partsAndMaterials.reduce((sum, part) => sum + (part.price * part.quantity), 0) +
                           laborItems.reduce((sum, item) => sum + item.price, 0);
      
      const carData = {
        make: formData.make,
        carModel: formData.carModel,
        year: formData.year,
        licensePlate: formData.licensePlate,
        ownerName: formData.ownerName,
        ownerPhone: formData.ownerPhone,
        status: 'pending' as const,
        paymentStatus: 'pending' as const,
        totalEstimate,
        paidAmount: 0,
        parts: partsAndMaterials.map(part => ({
          name: part.name,
          quantity: part.quantity,
          price: part.price,
          status: 'needed' as const
        })),
        serviceItems: laborItems.map(item => ({
          name: item.name,
          description: 'Ish haqi',
          price: item.price,
          quantity: 1,
          category: 'labor' as const
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 1. Mashinani yaratish
      console.log('📤 Mashina yaratilmoqda:', carData);
      
      let carId: string;
      
      // To'g'ridan-to'g'ri API ga so'rov yuborish (optimistic update o'rniga)
      try {
        const response = await api.post('/cars', carData);
        carId = response.data.car._id;
        console.log('✅ Mashina yaratildi, ID:', carId);
      } catch (err: any) {
        console.error('❌ Mashina yaratishda xatolik:', err);
        throw err;
      }
      
      if (!carId) {
        throw new Error('Mashina yaratildi, lekin ID topilmadi');
      }

      // 2. Agar vazifalar bo'lsa, ularni yaratish
      if (tasks.length > 0) {
        setIsCreatingTasks(true);
        for (const task of tasks) {
          const taskData: any = {
            title: task.title,
            description: task.description || task.title,
            car: carId,
            // Faqat haqiqiy service ID bo'lsa yuborish (temp- bilan boshlanmasa)
            service: task.service && !task.service.startsWith('temp-') ? task.service : undefined,
            priority: task.priority,
            dueDate: task.dueDate,
            estimatedHours: task.estimatedHours,
            payment: task.payment
          };
          
          // Assignments formatini to'g'rilash
          if (task.assignments && task.assignments.length > 0) {
            taskData.assignments = task.assignments.map(a => ({
              apprenticeId: a.apprenticeId
            }));
          }
          
          console.log('📤 Vazifa yuborilmoqda:', taskData);
          
          await createTaskMutation.mutateAsync(taskData);
        }
        setIsCreatingTasks(false);
        
        toast.success(t(`Mashina va ${tasks.length} ta vazifa yaratildi!`, language));
      } else {
        toast.success(t('Mashina muvaffaqiyatli yaratildi!', language));
      }

      // Reset
      setFormData({
        make: '',
        carModel: '',
        year: new Date().getFullYear(),
        licensePlate: '',
        ownerName: '',
        ownerPhone: ''
      });
      setItems([]);
      setUsedSpareParts([]);
      setTasks([]);
      setCurrentStep(1);
      
      onClose();
      window.location.reload();
    } catch (error: any) {
      console.error('Error creating car:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map((err: any) => err.msg).join(', ');
        toast.error(`Xatolik: ${errorMessages}`);
      } else if (error.response?.data?.message) {
        toast.error(`Xatolik: ${error.response.data.message}`);
      } else {
        toast.error(error.message || 'Xatolik yuz berdi');
      }
    }
  };



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'ownerPhone') {
      // Telefon raqamini formatlash
      const phoneValue = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [name]: phoneValue
      }));
    } else if (name === 'licensePlate') {
      // Davlat raqamini formatlash
      const plateValue = formatLicensePlate(value);
      setFormData(prev => ({
        ...prev,
        [name]: plateValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'year' ? Number(value) : value
      }));
    }
  };

  const formatLicensePlate = (value: string) => {
    // Faqat raqam va harflarni qoldirish
    const cleanValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    // O'zbekiston davlat raqami formatlari:
    // Eski format: 01A123BC (2 raqam + 1 harf + 3 raqam + 2 harf)
    // Yangi format: 01123ABC (2 raqam + 3 raqam + 3 harf)
    
    if (cleanValue.length <= 8) {
      // Eski format: 01A123BC
      if (cleanValue.length >= 2) {
        let formatted = cleanValue.slice(0, 2); // 01
        if (cleanValue.length > 2) {
          formatted += ' ' + cleanValue.slice(2, 3); // A
        }
        if (cleanValue.length > 3) {
          formatted += ' ' + cleanValue.slice(3, 6); // 123
        }
        if (cleanValue.length > 6) {
          formatted += ' ' + cleanValue.slice(6, 8); // BC
        }
        return formatted;
      }
    } else {
      // Yangi format: 01123ABC
      if (cleanValue.length >= 2) {
        let formatted = cleanValue.slice(0, 2); // 01
        if (cleanValue.length > 2) {
          formatted += ' ' + cleanValue.slice(2, 5); // 123
        }
        if (cleanValue.length > 5) {
          formatted += ' ' + cleanValue.slice(5, 8); // ABC
        }
        return formatted;
      }
    }
    
    return cleanValue;
  };

  const formatPhoneNumber = (value: string) => {
    // Faqat raqamlarni qoldirish
    const phoneNumber = value.replace(/\D/g, '');
    
    // Agar 998 bilan boshlanmasa, avtomatik qo'shish
    let formattedNumber = phoneNumber;
    if (!phoneNumber.startsWith('998') && phoneNumber.length > 0) {
      formattedNumber = '998' + phoneNumber;
    }
    
    // Formatni qo'llash: +998 XX XXX XX XX
    if (formattedNumber.length >= 3) {
      let formatted = '+998';
      if (formattedNumber.length > 3) {
        formatted += ' ' + formattedNumber.slice(3, 5);
      }
      if (formattedNumber.length > 5) {
        formatted += ' ' + formattedNumber.slice(5, 8);
      }
      if (formattedNumber.length > 8) {
        formatted += ' ' + formattedNumber.slice(8, 10);
      }
      if (formattedNumber.length > 10) {
        formatted += ' ' + formattedNumber.slice(10, 12);
      }
      return formatted;
    }
    
    return formattedNumber.length > 0 ? '+' + formattedNumber : '';
  };

  if (!isOpen) return null;

  // Yil variantlari
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1980 + 1 }, (_, i) => currentYear - i);

  // Yuk mashinalari markalari (dunyodagi barcha mashhur markalar)
  const carMakes = [
    // Xitoy markalari
    'FAW', 'Foton', 'Howo', 'Shacman', 'Dongfeng', 'JAC', 'Beiben', 'Camc', 'Sinotruk',
    // Yevropa markalari
    'Mercedes-Benz', 'MAN', 'Scania', 'Volvo', 'DAF', 'Iveco', 'Renault', 'Isuzu',
    // Amerika markalari
    'Freightliner', 'Kenworth', 'Peterbilt', 'Mack', 'International', 'Western Star',
    // Yaponiya markalari
    'Hino', 'Mitsubishi Fuso', 'UD Trucks', 'Isuzu',
    // Rossiya va MDH markalari
    'Kamaz', 'MAZ', 'Ural', 'GAZ', 'ZIL', 'KrAZ',
    // Koreya markalari
    'Hyundai', 'Kia', 'Daewoo',
    // Boshqa
    'Tata', 'Ashok Leyland', 'Eicher', 'Boshqa'
  ].sort();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 mx-2 sm:mx-0 my-4 sm:my-0">
        {/* Header - Dynamic gradient based on step */}
        <div className={`relative px-6 py-4 ${
          currentStep === 1 ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500' :
          currentStep === 2 ? 'bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500' :
          currentStep === 3 ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500' :
          'bg-gradient-to-r from-cyan-600 via-blue-500 to-indigo-600'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                {currentStep === 1 && <Car className="h-5 w-5 text-white" />}
                {currentStep === 2 && <Package className="h-5 w-5 text-white" />}
                {currentStep === 3 && <Briefcase className="h-5 w-5 text-white" />}
                {currentStep === 4 && <FileText className="h-5 w-5 text-white" />}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  {currentStep === 1 && t('Yangi mashina', language)}
                  {currentStep === 2 && t('Zapchastlar', language)}
                  {currentStep === 3 && t('Ish haqi', language)}
                  {currentStep === 4 && t('Vazifalar', language)}
                  {(!isOnline) && (
                    <span className="px-2 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                      Offline
                    </span>
                  )}
                </h2>
                <p className="text-xs text-white/80">
                  {currentStep === 1 && t('Mashina ma\'lumotlarini kiriting', language)}
                  {currentStep === 2 && t('Kerakli zapchastlarni qo\'shing', language)}
                  {currentStep === 3 && t('Ish haqi summalarini belgilang', language)}
                  {currentStep === 4 && t('Shogirdlarga vazifa topshiring', language)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Progress Steps - Colorful */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-3 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between sm:justify-center sm:space-x-3 overflow-x-auto">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex flex-col sm:flex-row items-center hover:scale-105 transition-transform flex-shrink-0 group"
            >
              <div className={`flex items-center justify-center w-12 h-12 sm:w-10 sm:h-10 rounded-full ${
                currentStep === 1 ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/50' : 
                currentStep > 1 ? 'bg-gradient-to-br from-green-500 to-emerald-400 text-white shadow-md' : 
                'bg-gray-200 text-gray-500'
              } font-bold transition-all`}>
                {currentStep > 1 ? '✓' : <Car className="h-5 w-5" />}
              </div>
              <span className={`mt-1 sm:mt-0 sm:ml-2 text-[10px] sm:text-xs font-semibold ${
                currentStep === 1 ? 'text-blue-600' : currentStep > 1 ? 'text-green-600' : 'text-gray-500'
              } whitespace-nowrap`}>
                {t('Mashina', language)}
              </span>
            </button>
            
            <div className={`h-1 w-8 sm:w-12 rounded-full ${currentStep > 1 ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gray-300'} transition-all`} />
            
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex flex-col sm:flex-row items-center hover:scale-105 transition-transform flex-shrink-0 group"
            >
              <div className={`flex items-center justify-center w-12 h-12 sm:w-10 sm:h-10 rounded-full ${
                currentStep === 2 ? 'bg-gradient-to-br from-green-600 to-teal-500 text-white shadow-lg shadow-green-500/50' : 
                currentStep > 2 ? 'bg-gradient-to-br from-green-500 to-emerald-400 text-white shadow-md' : 
                'bg-gray-200 text-gray-500'
              } font-bold transition-all`}>
                {currentStep > 2 ? '✓' : <Package className="h-5 w-5" />}
              </div>
              <span className={`mt-1 sm:mt-0 sm:ml-2 text-[10px] sm:text-xs font-semibold ${
                currentStep === 2 ? 'text-green-600' : currentStep > 2 ? 'text-green-600' : 'text-gray-400'
              } whitespace-nowrap`}>
                {t('Qismlar', language)}
              </span>
            </button>
            
            <div className={`h-1 w-8 sm:w-12 rounded-full ${currentStep > 2 ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gray-300'} transition-all`} />
            
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="flex flex-col sm:flex-row items-center hover:scale-105 transition-transform flex-shrink-0 group"
            >
              <div className={`flex items-center justify-center w-12 h-12 sm:w-10 sm:h-10 rounded-full ${
                currentStep === 3 ? 'bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/50' : 
                currentStep > 3 ? 'bg-gradient-to-br from-green-500 to-emerald-400 text-white shadow-md' : 
                'bg-gray-200 text-gray-500'
              } font-bold transition-all`}>
                {currentStep > 3 ? '✓' : <Briefcase className="h-5 w-5" />}
              </div>
              <span className={`mt-1 sm:mt-0 sm:ml-2 text-[10px] sm:text-xs font-semibold ${
                currentStep === 3 ? 'text-purple-600' : currentStep > 3 ? 'text-green-600' : 'text-gray-400'
              } whitespace-nowrap`}>
                {t('Ish haqi', language)}
              </span>
            </button>
            
            <div className={`h-1 w-8 sm:w-12 rounded-full ${currentStep > 3 ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gray-300'} transition-all`} />
            
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="flex flex-col sm:flex-row items-center hover:scale-105 transition-transform flex-shrink-0 group"
            >
              <div className={`flex items-center justify-center w-12 h-12 sm:w-10 sm:h-10 rounded-full ${
                currentStep === 4 ? 'bg-gradient-to-br from-cyan-600 to-blue-500 text-white shadow-lg shadow-cyan-500/50' : 
                'bg-gray-200 text-gray-500'
              } font-bold transition-all`}>
                <FileText className="h-5 w-5" />
              </div>
              <span className={`mt-1 sm:mt-0 sm:ml-2 text-[10px] sm:text-xs font-semibold ${
                currentStep === 4 ? 'text-cyan-600' : 'text-gray-400'
              } whitespace-nowrap`}>
                {t('Vazifalar', language)}
              </span>
            </button>
          </div>
        </div>

        {/* Content - Compact */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 1 ? (
            // TAB 1: Mashina ma'lumotlari
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg shadow-md">
                    <Car className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900 text-lg">{t("Mashina ma'lumotlari", language)}</h4>
                    <p className="text-sm text-blue-600">{t("Asosiy ma'lumotlarni kiriting", language)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    {t('Marka', language)} *
                  </label>
                  <select
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">{t('Tanlang', language)}</option>
                    {carMakes.map((make) => (
                      <option key={make} value={make}>{make}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    {t('Model', language)} *
                  </label>
                  <input
                    type="text"
                    name="carModel"
                    value={formData.carModel}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Lacetti"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    {t('Yili', language)} *
                  </label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    {t('Davlat raqami', language)} *
                  </label>
                  <input
                    type="text"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    maxLength={11}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="01 A 123 BC"
                  />
                </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-500 rounded-lg shadow-md">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-900 text-lg">{t('Egasi', language)}</h4>
                    <p className="text-sm text-indigo-600">{t("Mashina egasi haqida ma'lumot", language)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      {t('Ism', language)} *
                    </label>
                    <input
                      type="text"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder={t("To'liq ism", language)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      {t('Telefon', language)} *
                    </label>
                    <input
                      type="tel"
                      name="ownerPhone"
                      value={formData.ownerPhone}
                      onChange={handleChange}
                      maxLength={17}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="+998 XX XXX XX XX"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : currentStep === 2 ? (
            // QISM 2: Ehtiyot qismlar va materiallar
            <>
              {/* Ixtiyoriy xabar */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700 font-medium">
                      {t('Bu qism ixtiyoriy', language)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {t('Zapchast qo\'shmasangiz ham keyingi qismga o\'tishingiz mumkin', language)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-300 rounded-xl p-5 mb-4 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-500 rounded-lg shadow-md">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-green-900 text-lg">{t("Zapchast qo'shish", language)}</h4>
                    <p className="text-sm text-green-600">{t("Kerakli qismlarni ro'yxatga oling (ixtiyoriy)", language)}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {/* Mahsulot nomi - oddiy input, autocomplete yo'q */}
                  <div>
                    <input
                      type="text"
                      value={itemName} 
                      onChange={handleItemNameChange}
                      onKeyDown={handleKeyDown}
                      placeholder={t("Qism nomi", language) + " *"}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  {/* Keltirish uchun pul kiritish maydoni */}
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3">
                    <label className="block text-xs font-semibold text-orange-700 mb-2">
                       {t('Mijoz keltirish uchun pul berdi (ixtiyoriy)', language)}
                    </label>
                    <input
                      type="text"
                      value={displayTobringPrice}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\./g, '');
                        const numValue = parseInt(value) || 0;
                        setTobringPrice(numValue.toString());
                        setDisplayTobringPrice(numValue === 0 ? '0' : formatNumber(numValue));
                      }}
                      onFocus={() => {
                        if (tobringPrice === '0' || !tobringPrice) {
                          setDisplayTobringPrice('');
                        }
                      }}
                      onBlur={() => {
                        if (displayTobringPrice === '' || tobringPrice === '0' || !tobringPrice) {
                          setDisplayTobringPrice('0');
                          setTobringPrice('0');
                        }
                      }}
                      placeholder="0 so'm (bo'sh qoldirish mumkin)"
                      className="w-full px-3 py-2 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <p className="text-xs text-orange-600 mt-1">
                      ℹ️ {t('Agar mijoz pul bermagan bo\'lsa, 0 so\'m bo\'ladi', language)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(e.target.value)}
                      placeholder={t("Soni", language) + " *"}
                      min="1"
                      className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={addItem}
                      disabled={!itemName}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      {t("Qo'shish", language)}
                    </button>
                  </div>
                </div>
              </div>

              {/* Parts List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900">{t("Qismlar ro'yxati", language)}</h4>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                    {partsAndMaterials.length} ta
                  </span>
                </div>
                
                {partsAndMaterials.length > 0 ? (
                  <div className="space-y-2">
                    {partsAndMaterials.map((item, index) => {
                      // Ushbu item zapchast ekanligini tekshirish
                      const correspondingUsedPart = usedSpareParts.find(up => up.name === item.name);
                      const isFromSpareParts = !!correspondingUsedPart;
                      const isToBring = item.source === 'tobring';
                      
                      return (
                        <div key={index} className={`bg-white border-2 ${isToBring ? 'border-orange-200 bg-orange-50' : 'border-gray-100'} hover:border-gray-300 rounded-lg p-3`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getCategoryIcon(item.category)}
                                <p className="font-semibold text-gray-900">{item.name}</p>
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getCategoryColor(item.category)}`}>
                                  {item.category === 'part' ? t('Qism', language) : t('Material', language)}
                                </span>
                                {isToBring ? (
                                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-orange-100 text-orange-700">
                                    🚚 {t('Keltirish', language)}
                                  </span>
                                ) : isFromSpareParts && (
                                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700">
                                    📦 Zapchast
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 ml-6">
                                <span className="text-xs text-gray-600">{item.quantity} dona</span>
                                <span className="text-xs text-gray-400">×</span>
                                <span className={`text-xs font-bold ${isToBring ? 'text-orange-600' : 'text-green-600'}`}>
                                  {isToBring 
                                    ? (item.price > 0 
                                        ? `${formatCurrency(item.price)} (keltirish uchun berildi)` 
                                        : t('Mijoz keltiradi (0 so\'m)', language))
                                    : formatCurrency(item.price)
                                  }
                                </span>
                                {!isToBring && (
                                  <>
                                    <span className="text-xs text-gray-400">=</span>
                                    <span className="text-sm font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                                  </>
                                )}
                                {isToBring && item.price > 0 && (
                                  <>
                                    <span className="text-xs text-gray-400">=</span>
                                    <span className="text-sm font-bold text-orange-600">{formatCurrency(item.price * item.quantity)}</span>
                                  </>
                                )}
                                {isFromSpareParts && !isToBring && (
                                  <span className="text-xs text-blue-600 font-medium">
                                    (Zapchastlar sonidan kamayadi)
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(items.indexOf(item))}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg ml-2"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">{t('Jami:', language)}</span>
                        <span className="text-xl font-bold text-green-600">
                          {formatCurrency(partsAndMaterials.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Package className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">{t("Qismlar qo'shilmagan", language)}</p>
                  </div>
                )}
              </div>
            </>
          ) : currentStep === 3 ? (
            // QISM 3: Ish haqi
            <>
              {/* Ixtiyoriy xabar */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700 font-medium">
                      {t('Bu qism ixtiyoriy', language)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {t('Ish haqi qo\'shmasangiz ham keyingi qismga o\'tishingiz mumkin', language)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <Briefcase className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-900 text-lg">{t("Ish haqi qo'shish", language)}</h4>
                    <p className="text-sm text-purple-600">{t("Bajarilgan ishlar uchun to'lov (ixtiyoriy)", language)}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-purple-700 mb-1.5">
                        {t('Ish nomi', language)} *
                      </label>
                      <input
                        type="text"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        placeholder={t("Masalan: Dvigatel ta'mirlash", language)}
                        className="w-full px-3 py-2.5 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-purple-700 mb-1.5">
                        {t("To'lov summasi", language)} *
                      </label>
                      <input
                        type="text"
                        value={displayItemPrice}
                        onChange={handlePriceChange}
                        onFocus={handlePriceFocus}
                        onBlur={handlePriceBlur}
                        placeholder="0"
                        className="w-full px-3 py-2.5 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (itemName) {
                        // Agar pul kiritilmagan bo'lsa, 0 qo'yamiz
                        const price = itemPrice && parseFloat(itemPrice) > 0 ? parseFloat(itemPrice) : 0;
                        
                        setItems(prev => [...prev, {
                          name: itemName,
                          description: '',
                          price: price,
                          quantity: 1,
                          category: 'labor',
                          source: 'available' // Ish haqi har doim bizda bor
                        }]);
                        setItemName('');
                        setItemPrice('');
                        setDisplayItemPrice('0');
                      }
                    }}
                    disabled={!itemName}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Plus className="h-5 w-5" />
                    {t("Ish haqi qo'shish", language)}
                  </button>
                </div>
              </div>

              {/* Labor Items List - Yaxshilangan dizayn */}
              {laborItems.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-purple-600" />
                      <h4 className="font-bold text-gray-900">{t("Ish haqi ro'yxati", language)}</h4>
                    </div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                      {laborItems.length} ta
                    </span>
                  </div>
                  <div className="space-y-2">
                    {laborItems.map((item, index) => (
                      <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-600 rounded-lg">
                              <Briefcase className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{item.name}</p>
                              <p className="text-xs text-purple-600">{t('Ish haqi', language)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-purple-600">{formatCurrency(item.price)}</span>
                            <button
                              type="button"
                              onClick={() => removeItem(items.indexOf(item))}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                              title="O'chirish"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Jami ish haqi */}
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 border-2 border-purple-300">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-900">{t('Jami ish haqi:', language)}</span>
                        <span className="text-2xl font-bold text-purple-600">
                          {formatCurrency(laborItems.reduce((sum, item) => sum + item.price, 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : currentStep === 4 ? (
            // QISM 4: Vazifalar
            <>
              {/* Ixtiyoriy xabar */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700 font-medium">
                      {t('Bu qism ixtiyoriy', language)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {t('Vazifa qo\'shmasangiz ham mashinani saqlashingiz mumkin', language)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vazifalar qo'shish */}
              <div className="bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 border-2 border-cyan-300 rounded-xl p-5 mb-4 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-cyan-600 to-blue-500 rounded-lg shadow-md">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-cyan-900 text-lg">{t("Vazifalar (ixtiyoriy)", language)}</h4>
                    <p className="text-sm text-cyan-600">{t("Shogirdlarga vazifa topshirish", language)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addTask}
                  className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
                >
                  <Plus className="h-5 w-5" />
                  {t("Vazifa qo'shish", language)}
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-cyan-300 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50">
                  <div className="inline-block p-4 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-full mb-4">
                    <FileText className="h-12 w-12 text-cyan-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">{t("Vazifalar qo'shilmagan", language)}</p>
                  <p className="text-xs text-gray-500 mb-4">{t("Bu qadam ixtiyoriy - o'tkazib yuborishingiz mumkin", language)}</p>
                  
                  {/* Xizmatlar haqida ma'lumot */}
                  {loadingServices ? (
                    <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg max-w-md mx-auto">
                      <div className="flex items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <p className="text-sm font-semibold text-blue-700">
                          {t("Xizmatlar yuklanmoqda...", language)}
                        </p>
                      </div>
                    </div>
                  ) : carServices.length > 0 ? (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
                      <p className="text-xs font-semibold text-blue-700 mb-2">
                        ✅ {carServices.length} ta xizmat mavjud
                      </p>
                      <div className="text-xs text-blue-600 space-y-1">
                        {carServices.slice(0, 3).map((service: any) => (
                          <div key={service._id} className="flex items-center justify-between">
                            <span>• {service.name}</span>
                            <span className="font-semibold">{service.price.toLocaleString()} {t("so'm", language)}</span>
                          </div>
                        ))}
                        {carServices.length > 3 && (
                          <p className="text-blue-500 font-medium">+{carServices.length - 3} ta yana...</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg max-w-md mx-auto">
                      <p className="text-xs text-amber-700">
                        ⚠️ {t("Bu mashina uchun xizmatlar topilmadi", language)}
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        {t("Zapchastlar va ish haqi qo'shilganmi tekshiring", language)}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task, index) => (
                    <div key={task.id} className="border-2 border-cyan-300 rounded-xl p-4 space-y-3 bg-gradient-to-br from-white via-cyan-50 to-blue-50 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gradient-to-br from-cyan-600 to-blue-500 rounded-lg">
                            <FileText className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm font-bold text-cyan-700">
                            {t('Vazifa', language)} #{index + 1}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTask(task.id)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-100 rounded-lg transition-all transform hover:scale-110"
                          title={t("Vazifani o'chirish", language)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Xizmat tanlash */}
                      {carServices.length > 0 ? (
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            <Wrench className="h-3 w-3 inline mr-1" />
                            {t('Xizmat (ixtiyoriy)', language)}
                          </label>
                          <select
                            value={task.service}
                            onChange={(e) => updateTask(task.id, 'service', e.target.value)}
                            className="w-full px-3 py-2 text-sm border-2 border-cyan-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white hover:border-cyan-400 transition-colors"
                          >
                            <option value="">{t('Xizmat tanlanmagan', language)}</option>
                            {carServices.map((service: any) => (
                              <option key={service._id} value={service._id}>
                                {service.name} - {service.price.toLocaleString()} {t("so'm", language)}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-cyan-600 mt-1">
                            💡 {t('Xizmat tanlasangiz, narx avtomatik to\'ldiriladi', language)}
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50 border-2 border-amber-200 rounded-lg">
                          <p className="text-xs text-amber-700 font-medium">
                            ⏳ {t("Xizmatlar yuklanmoqda...", language)}
                          </p>
                        </div>
                      )}

                      {/* Vazifa nomi */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          {t('Vazifa nomi', language)} *
                        </label>
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                          placeholder={t("Masalan: Dvigatel ta'mirlash", language)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white"
                        />
                      </div>

                      {/* Shogirdlar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-gray-600">
                            <User className="h-3 w-3 inline mr-1" />
                            {t('Shogirdlar', language)}
                          </label>
                          <button
                            type="button"
                            onClick={() => addApprentice(task.id)}
                            className="px-2 py-1 text-xs bg-cyan-600 text-white rounded hover:bg-cyan-700 flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            {t("Shogird qo'shish", language)}
                          </button>
                        </div>

                        {task.assignments.length === 0 ? (
                          <div className="text-center py-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border-2 border-dashed border-blue-300">
                            <User className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-600 font-medium">{t("Shogird qo'shing", language)}</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {task.assignments.map((assignment, idx) => {
                              const allocatedAmount = task.payment / task.assignments.length;
                              const earning = (allocatedAmount * assignment.percentage) / 100;
                              const masterShare = allocatedAmount - earning;

                              return (
                                <div key={assignment.id} className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 shadow-sm">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1 bg-gradient-to-br from-blue-600 to-indigo-500 rounded">
                                        <User className="h-3 w-3 text-white" />
                                      </div>
                                      <span className="text-xs font-bold text-blue-700">{t('Shogird', language)} #{idx + 1}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeApprentice(task.id, assignment.id)}
                                      className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-100 rounded transition-all"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <select
                                        value={assignment.apprenticeId}
                                        onChange={(e) => updateApprentice(task.id, assignment.id, 'apprenticeId', e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                                        disabled={usersLoading}
                                      >
                                        <option value="">
                                          {usersLoading ? t('Yuklanmoqda...', language) : t('Tanlang', language)}
                                        </option>
                                        {apprentices.map((apprentice: any) => (
                                          <option key={apprentice._id} value={apprentice._id}>
                                            {apprentice.name} ({apprentice.percentage || 50}%)
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <input
                                        type="number"
                                        value={assignment.percentage}
                                        readOnly
                                        disabled
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100 text-gray-600 cursor-not-allowed"
                                        placeholder={t("Foiz %", language)}
                                        title={t("Ustoz tomonidan belgilangan foiz", language)}
                                      />
                                    </div>
                                  </div>

                                  {task.payment > 0 && assignment.percentage > 0 && (
                                    <div className="mt-2 p-2 bg-white rounded text-xs space-y-1">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">{t('Ajratilgan:', language)}</span>
                                        <span className="font-bold">{allocatedAmount.toLocaleString()} {t("so'm", language)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-green-600">{t('Shogird', language)} ({assignment.percentage}%):</span>
                                        <span className="font-bold text-green-700">{earning.toLocaleString()} {t("so'm", language)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-blue-600">{t('Ustoz:', language)}</span>
                                        <span className="font-bold text-blue-700">{masterShare.toLocaleString()} {t("so'm", language)}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Qo'shimcha ma'lumotlar */}
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                            {t('Muhimlik', language)}
                          </label>
                          <select
                            value={task.priority}
                            onChange={(e) => updateTask(task.id, 'priority', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                          >
                            <option value="low">{t('Past', language)}</option>
                            <option value="medium">{t("O'rta", language)}</option>
                            <option value="high">{t('Yuqori', language)}</option>
                            <option value="urgent">{t('Shoshilinch', language)}</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {t('Muddat', language)}
                          </label>
                          <input
                            type="date"
                            value={task.dueDate}
                            onChange={(e) => updateTask(task.id, 'dueDate', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {t('Soat', language)}
                          </label>
                          <input
                            type="number"
                            value={task.estimatedHours}
                            onChange={(e) => updateTask(task.id, 'estimatedHours', Number(e.target.value))}
                            min="0.5"
                            step="0.5"
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">💰 {t("To'lov", language)}</label>
                          <input
                            type="number"
                            value={task.payment}
                            onChange={(e) => updateTask(task.id, 'payment', Number(e.target.value))}
                            min="0"
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer - Colorful */}
        <div className={`border-t-2 px-6 py-4 flex items-center justify-between ${
          currentStep === 1 ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200' :
          currentStep === 2 ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' :
          currentStep === 3 ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200' :
          'bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200'
        }`}>
          {/* Left side - Back button (only show if not on first step) */}
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center space-x-2 ${
                  currentStep === 2 ? 'text-blue-700 hover:bg-blue-100 border-2 border-blue-300' :
                  currentStep === 3 ? 'text-green-700 hover:bg-green-100 border-2 border-green-300' :
                  'text-purple-700 hover:bg-purple-100 border-2 border-purple-300'
                }`}
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                <span>{t('Orqaga', language)}</span>
              </button>
            )}
          </div>

          {/* Right side - Cancel and Next/Save buttons */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-white border-2 border-gray-300 rounded-lg transition-all"
            >
              {t('Bekor qilish', language)}
            </button>
            
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={async () => {
                  // Validate current step before moving to next
                  if (currentStep === 1) {
                    if (!formData.make || !formData.carModel || !formData.licensePlate || !formData.ownerName || !formData.ownerPhone) {
                      alert('Barcha maydonlarni to\'ldiring');
                      return;
                    }
                    const phoneDigits = formData.ownerPhone.replace(/\D/g, '');
                    if (phoneDigits.length !== 12 || !phoneDigits.startsWith('998')) {
                      alert('Telefon raqami +998 XX XXX XX XX formatida bo\'lishi kerak');
                      return;
                    }
                    const plateClean = formData.licensePlate.replace(/\s/g, '');
                    const isOldFormat = /^[0-9]{2}[A-Z]{1}[0-9]{3}[A-Z]{2}$/.test(plateClean);
                    const isNewFormat = /^[0-9]{5}[A-Z]{3}$/.test(plateClean);
                    if (!isOldFormat && !isNewFormat) {
                      alert('Davlat raqami noto\'g\'ri formatda. Masalan: 01 A 123 BC yoki 01 123 ABC');
                      return;
                    }
                  }
                  
                  // Faqat keyingi stepga o'tish (mashina yaratmasdan)
                  setCurrentStep(currentStep + 1);
                }}
                className={`px-6 py-2.5 text-sm font-bold text-white rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 transform hover:scale-105 ${
                  currentStep === 1 ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600' :
                  currentStep === 2 ? 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600' :
                  'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600'
                }`}
              >
                <span>{t('Keyingi', language)}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isCreatingTasks}
                className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 hover:from-green-700 hover:via-emerald-600 hover:to-teal-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isCreatingTasks ? t('Saqlanmoqda...', language) : (tasks.length > 0 ? t('Vazifalarni saqlash', language) : t('Tugatish', language))}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCarModal;