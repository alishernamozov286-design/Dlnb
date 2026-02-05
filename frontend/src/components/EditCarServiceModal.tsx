import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Car, Wrench, DollarSign, Box, Briefcase, ChevronRight, ChevronLeft, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useCarsNew } from '@/hooks/useCarsNew';
import { useApprentices } from '@/hooks/useUsers';
import { Car as CarType } from '@/types';

interface ServicePart {
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: 'part' | 'material' | 'labor';
}

interface TaskData {
  _id?: string;
  title: string;
  description: string;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  estimatedHours: number;
  car: string;
  payment: number;
}

interface EditCarServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  carService: any;
  onSuccess: () => void;
}

const EditCarServiceModal: React.FC<EditCarServiceModalProps> = ({ isOpen, onClose, carService, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [items, setItems] = useState<ServicePart[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemCategory, setItemCategory] = useState<'part' | 'material'>('part');
  const [taskData, setTaskData] = useState<TaskData>({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: '',
    estimatedHours: 1,
    car: '',
    payment: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const { cars } = useCarsNew();
  const { data: apprenticesData } = useApprentices();
  const apprentices = (apprenticesData as any)?.users || [];

  useEffect(() => {
    if (carService) {
      setItems(carService.items || []);
      // Vazifalarni yuklash
      fetchTasks();
    }
  }, [carService]);

  const fetchTasks = async () => {
    if (!carService?.car?._id) return;
    
    try {
      const response = await fetch(`/api/tasks?car=${carService.car._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // Ish haqi o'zgarganda to'lov va vazifa nomi avtomatik yangilansin
  React.useEffect(() => {
    const laborItems = items.filter(item => item.category === 'labor');
    const laborTotal = laborItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const laborNames = laborItems.map(item => item.name).join(', ');
    
    setTaskData(prev => ({ 
      ...prev, 
      payment: laborTotal,
      title: laborNames || prev.title,
      car: carService?.car?._id || prev.car
    }));
  }, [items, carService]);

  if (!isOpen) return null;

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addItem = () => {
    if (itemName && itemPrice && parseFloat(itemPrice) > 0) {
      const quantity = parseInt(itemQuantity) || 1;
      setItems(prev => [...prev, {
        name: itemName,
        description: itemDescription,
        price: parseFloat(itemPrice),
        quantity: quantity,
        category: currentStep === 1 ? itemCategory : 'labor'
      }]);
      setItemName('');
      setItemDescription('');
      setItemPrice('');
      setItemQuantity('1');
    }
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const addTask = () => {
    if (!taskData.assignedTo || !taskData.dueDate) {
      alert('Shogird va muddat majburiy');
      return;
    }
    if (!taskData.car) {
      alert('Mashina ma\'lumoti topilmadi');
      return;
    }
    if (!taskData.title) {
      alert('Iltimos, avval ish haqi qo\'shing (2-qism)');
      return;
    }
    
    setTasks(prev => [...prev, taskData]);
    
    const laborItems = items.filter(item => item.category === 'labor');
    const laborTotal = laborItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const laborNames = laborItems.map(item => item.name).join(', ');
    
    setTaskData({
      title: laborNames,
      description: '',
      assignedTo: '',
      priority: 'medium',
      dueDate: '',
      estimatedHours: 1,
      car: carService?.car?._id || '',
      payment: laborTotal
    });
  };

  const removeTask = (index: number) => {
    setTasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      alert('Kamida bitta qism qo\'shing');
      return;
    }

    setIsLoading(true);

    try {
      // Update service
      const response = await fetch(`/api/car-services/${carService._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          items,
          totalPrice: calculateTotalPrice()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || 'Xatolik yuz berdi');
        setIsLoading(false);
        return;
      }

      // Save new tasks if any
      const newTasks = tasks.filter(task => !task._id);
      if (newTasks.length > 0) {
        for (const task of newTasks) {
          const taskToSave = {
            title: task.title,
            description: task.description || 'Vazifa tavsifi',
            assignedTo: task.assignedTo,
            car: task.car,
            priority: task.priority,
            dueDate: task.dueDate,
            estimatedHours: task.estimatedHours,
            payment: task.payment || 0
          };
          
          await fetch('/api/tasks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(taskToSave)
          });
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating service:', error);
      alert('Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
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

  const partsAndMaterials = items.filter(item => item.category !== 'labor');
  const laborItems = items.filter(item => item.category === 'labor');

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Xizmatni tahrirlash</h3>
                  <p className="text-sm text-blue-100">
                    {currentStep === 1 ? 'Qism 1: Ehtiyot qismlar' : 
                     currentStep === 2 ? 'Qism 2: Ish haqi' : 
                     'Qism 3: Vazifa berish'}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-white/80 hover:text-white p-1">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-center space-x-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === 1 ? 'bg-blue-600 text-white' : currentStep > 1 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  {currentStep > 1 ? '✓' : '1'}
                </div>
                <span className={`ml-2 text-xs font-medium ${currentStep === 1 ? 'text-blue-600' : 'text-gray-600'}`}>
                  Qismlar
                </span>
              </button>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === 2 ? 'bg-blue-600 text-white' : currentStep > 2 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  {currentStep > 2 ? '✓' : '2'}
                </div>
                <span className={`ml-2 text-xs font-medium ${currentStep === 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                  Ish haqi
                </span>
              </button>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === 3 ? 'bg-blue-600 text-white' : currentStep > 3 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  {currentStep > 3 ? '✓' : '3'}
                </div>
                <span className={`ml-2 text-xs font-medium ${currentStep === 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                  Vazifalar
                </span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {currentStep === 3 ? (
              // VAZIFALAR QISMI
              <>
                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-5 w-5 text-orange-600" />
                    <h4 className="font-bold text-orange-900">Vazifa qo'shish</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={taskData.title}
                        readOnly
                        placeholder="Vazifa nomi (ish haqi nomidan avtomatik)"
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                        Avtomatik
                      </div>
                    </div>

                    <textarea
                      value={taskData.description}
                      onChange={(e) => setTaskData({...taskData, description: e.target.value})}
                      placeholder="Tavsif (ixtiyoriy)"
                      rows={2}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <select
                          value={taskData.car}
                          disabled
                          className="px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed w-full"
                        >
                          <option value="">Mashina tanlang *</option>
                          {cars.map((car: CarType) => (
                            <option key={car._id} value={car._id}>
                              {car.make} {car.carModel} - {car.licensePlate}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                          Avtomatik
                        </div>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          value={taskData.payment > 0 ? formatCurrency(taskData.payment) : '0 so\'m'}
                          readOnly
                          className="px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed w-full"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                          Avtomatik
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={taskData.assignedTo}
                        onChange={(e) => setTaskData({...taskData, assignedTo: e.target.value})}
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                      >
                        <option value="">Shogird tanlang</option>
                        {apprentices.map((apprentice: any) => (
                          <option key={apprentice._id} value={apprentice._id}>
                            {apprentice.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={taskData.priority}
                        onChange={(e) => setTaskData({...taskData, priority: e.target.value as any})}
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                      >
                        <option value="low">Past</option>
                        <option value="medium">O'rta</option>
                        <option value="high">Yuqori</option>
                        <option value="urgent">Shoshilinch</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="date"
                        value={taskData.dueDate}
                        onChange={(e) => setTaskData({...taskData, dueDate: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        value={taskData.estimatedHours}
                        onChange={(e) => setTaskData({...taskData, estimatedHours: Number(e.target.value)})}
                        placeholder="Soat"
                        min="0.5"
                        step="0.5"
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={addTask}
                        disabled={!taskData.assignedTo || !taskData.dueDate}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Qo'shish
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tasks List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-gray-700" />
                      <h4 className="font-bold text-gray-900">Vazifalar ro'yxati</h4>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      {tasks.length} ta
                    </span>
                  </div>
                  
                  {tasks.length > 0 ? (
                    <div className="space-y-2">
                      {tasks.map((task, index) => (
                        <div key={index} className="bg-white border-2 border-gray-100 hover:border-gray-300 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <FileText className="h-4 w-4 text-orange-600" />
                                <p className="font-semibold text-gray-900">{task.title}</p>
                              </div>
                              {task.description && (
                                <p className="text-sm text-gray-600 mb-2 ml-6">{task.description}</p>
                              )}
                              <div className="flex items-center gap-3 ml-6 flex-wrap">
                                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700">
                                  {apprentices.find((a: any) => a._id === task.assignedTo)?.name || 'Shogird'}
                                </span>
                                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-700">
                                  {cars.find((c: CarType) => c._id === task.car)?.licensePlate || 'Mashina'}
                                </span>
                                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-green-100 text-green-700">
                                  {formatCurrency(task.payment)}
                                </span>
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                  task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                  task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {task.priority === 'urgent' ? 'Shoshilinch' :
                                   task.priority === 'high' ? 'Yuqori' :
                                   task.priority === 'medium' ? 'O\'rta' : 'Past'}
                                </span>
                                <span className="text-xs text-gray-600">
                                  {new Date(task.dueDate).toLocaleDateString('uz-UZ')}
                                </span>
                                <span className="text-xs text-gray-600">
                                  {task.estimatedHours} soat
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeTask(index)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg ml-2"
                              title="O'chirish"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Vazifalar qo'shilmagan</p>
                    </div>
                  )}
                </div>
              </>
            ) : currentStep === 1 ? (
              // STEP 1: Ehtiyot qismlar
              <>
                {/* Car Info */}
                {carService?.car && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Car className="h-8 w-8 text-blue-600" />
                      <div>
                        <h4 className="font-bold text-blue-900">
                          {carService.car.make} {carService.car.carModel} ({carService.car.year})
                        </h4>
                        <p className="text-sm text-blue-700">{carService.car.licensePlate}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add Parts Form */}
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Plus className="h-5 w-5 text-green-600" />
                    <h4 className="font-bold text-green-900">Ehtiyot qism qo'shish</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addItem()}
                        placeholder="Qism nomi *"
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <select
                        value={itemCategory}
                        onChange={(e) => setItemCategory(e.target.value as 'part' | 'material')}
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      >
                        <option value="part">Ehtiyot qism</option>
                        <option value="material">Material</option>
                      </select>
                    </div>

                    <input
                      type="text"
                      value={itemDescription}
                      onChange={(e) => setItemDescription(e.target.value)}
                      placeholder="Tavsif (ixtiyoriy)"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />

                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="number"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(e.target.value)}
                        placeholder="Soni"
                        min="1"
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addItem()}
                        placeholder="Narx *"
                        min="0"
                        step="1000"
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={addItem}
                        disabled={!itemName || !itemPrice || parseFloat(itemPrice) <= 0}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Qo'shish
                      </button>
                    </div>
                  </div>
                </div>

                {/* Parts List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-gray-700" />
                      <h4 className="font-bold text-gray-900">Qo'shilgan qismlar</h4>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      {partsAndMaterials.length} ta
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {partsAndMaterials.map((item) => {
                      const actualIndex = items.findIndex(i => i === item);
                      return (
                        <div key={actualIndex} className="bg-white border-2 border-gray-100 hover:border-gray-300 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`p-1 rounded ${getCategoryColor(item.category)}`}>
                                  {getCategoryIcon(item.category)}
                                </div>
                                <p className="font-semibold text-gray-900">{item.name}</p>
                              </div>
                              {item.description && (
                                <p className="text-sm text-gray-600 mb-2 ml-8">{item.description}</p>
                              )}
                              <div className="flex items-center gap-3 ml-8">
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getCategoryColor(item.category)}`}>
                                  {item.category === 'part' ? 'Qism' : 'Material'}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {item.quantity} x {formatCurrency(item.price)}
                                </span>
                                <span className="text-sm font-bold text-gray-900">
                                  = {formatCurrency(item.price * item.quantity)}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(actualIndex)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg ml-2"
                              title="O'chirish"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {partsAndMaterials.length === 0 && (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <Wrench className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Qismlar qo'shilmagan</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : currentStep === 2 ? (
              // STEP 2: Ish haqi
              <>
                {/* Car Info */}
                {carService?.car && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Car className="h-8 w-8 text-blue-600" />
                      <div>
                        <h4 className="font-bold text-blue-900">
                          {carService.car.make} {carService.car.carModel} ({carService.car.year})
                        </h4>
                        <p className="text-sm text-blue-700">{carService.car.licensePlate}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add Labor Form */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-5 w-5 text-purple-600" />
                    <h4 className="font-bold text-purple-900">Ish haqi qo'shish</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addItem()}
                      placeholder="Ish nomi (masalan: Dvigatel ta'mirlash) *"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />

                    <input
                      type="text"
                      value={itemDescription}
                      onChange={(e) => setItemDescription(e.target.value)}
                      placeholder="Tavsif (ixtiyoriy)"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />

                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="number"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(e.target.value)}
                        placeholder="Soat"
                        min="1"
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addItem()}
                        placeholder="Narx *"
                        min="0"
                        step="1000"
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={addItem}
                        disabled={!itemName || !itemPrice || parseFloat(itemPrice) <= 0}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Qo'shish
                      </button>
                    </div>
                  </div>
                </div>

                {/* Labor List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-gray-700" />
                      <h4 className="font-bold text-gray-900">Ish haqi ro'yxati</h4>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      {laborItems.length} ta
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {laborItems.map((item) => {
                      const actualIndex = items.findIndex(i => i === item);
                      return (
                        <div key={actualIndex} className="bg-white border-2 border-gray-100 hover:border-gray-300 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`p-1 rounded ${getCategoryColor(item.category)}`}>
                                  {getCategoryIcon(item.category)}
                                </div>
                                <p className="font-semibold text-gray-900">{item.name}</p>
                              </div>
                              {item.description && (
                                <p className="text-sm text-gray-600 mb-2 ml-8">{item.description}</p>
                              )}
                              <div className="flex items-center gap-3 ml-8">
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getCategoryColor(item.category)}`}>
                                  Ish haqi
                                </span>
                                <span className="text-sm text-gray-600">
                                  {item.quantity} soat x {formatCurrency(item.price)}
                                </span>
                                <span className="text-sm font-bold text-gray-900">
                                  = {formatCurrency(item.price * item.quantity)}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(actualIndex)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg ml-2"
                              title="O'chirish"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {laborItems.length === 0 && (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <Briefcase className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Ish haqi qo'shilmagan</p>
                        <p className="text-xs text-gray-400 mt-1">Ixtiyoriy - keyinroq qo'shishingiz mumkin</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}

            {/* Total */}
            {currentStep !== 3 && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-100">Jami to'lov</p>
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(calculateTotalPrice())}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 bg-gray-50 border-t flex justify-between">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Orqaga
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
              >
                Bekor qilish
              </button>
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
                >
                  Keyingi
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || items.length === 0}
                  className="px-5 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Saqlanmoqda...
                    </>
                  ) : (
                    'Saqlash'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCarServiceModal;
