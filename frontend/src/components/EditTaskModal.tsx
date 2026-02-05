import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertTriangle, User, Car, FileText, Wrench, DollarSign, Plus, Trash2 } from 'lucide-react';
import { useUpdateTask } from '@/hooks/useTasks';
import { useCarsNew } from '@/hooks/useCarsNew';
import { useApprentices } from '@/hooks/useUsers';
import { Task } from '@/types';
import api from '@/lib/api';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onUpdate?: () => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ isOpen, onClose, task, onUpdate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    car: '',
    service: '',
    priority: 'medium',
    dueDate: '',
    estimatedHours: 1,
    payment: 0
  });

  const [assignments, setAssignments] = useState<Array<{
    apprenticeId: string;
    percentage: number;
    earning: number;
  }>>([]);

  const [carServices, setCarServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const updateTaskMutation = useUpdateTask();
  const { cars: carsData } = useCarsNew();
  const { data: apprenticesData } = useApprentices();

  // Task ma'lumotlarini formga yuklash
  useEffect(() => {
    if (task && isOpen) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assignedTo: task.assignedTo && typeof task.assignedTo === 'object' ? task.assignedTo._id : (task.assignedTo || ''),
        car: task.car && typeof task.car === 'object' ? task.car._id : (task.car || ''),
        service: task.service || '',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        estimatedHours: task.estimatedHours || 1,
        payment: task.payment || 0
      });

      // Assignments'ni yuklash
      if (task.assignments && task.assignments.length > 0) {
        setAssignments(task.assignments.map((a: any) => ({
          apprenticeId: typeof a.apprentice === 'object' ? a.apprentice._id : a.apprentice,
          percentage: a.percentage || 50,
          earning: a.earning || 0
        })));
      } else {
        setAssignments([]);
      }
    }
  }, [task, isOpen]);

  // Mashina tanlanganda ishlarni yuklash
  useEffect(() => {
    const fetchCarServices = async () => {
      if (formData.car) {
        setLoadingServices(true);
        try {
          const response = await api.get(`/cars/${formData.car}/services`);
          setCarServices(response.data.services || []);
        } catch (error) {
          console.error('Ishlarni yuklashda xatolik:', error);
          setCarServices([]);
        } finally {
          setLoadingServices(false);
        }
      } else {
        setCarServices([]);
        setFormData(prev => ({ ...prev, service: '', payment: 0 }));
      }
    };

    fetchCarServices();
  }, [formData.car]);

  // Ish tanlanganda narxni avtomatik o'rnatish
  useEffect(() => {
    if (formData.service) {
      const selectedService = carServices.find(service => service._id === formData.service);
      if (selectedService) {
        setFormData(prev => ({ ...prev, payment: selectedService.price }));
      }
    }
  }, [formData.service, carServices]);

  // Payment o'zgarganda shogirdlar ulushini qayta hisoblash
  useEffect(() => {
    if (assignments.length > 0 && formData.payment > 0) {
      const totalPayment = formData.payment;
      const apprenticeCount = assignments.length;
      const allocatedAmount = totalPayment / apprenticeCount;

      setAssignments(prev => prev.map(a => ({
        ...a,
        earning: (allocatedAmount * a.percentage) / 100
      })));
    }
  }, [formData.payment]);

  const handleAddApprentice = () => {
    setAssignments(prev => [...prev, {
      apprenticeId: '',
      percentage: 50,
      earning: 0
    }]);
  };

  const handleRemoveApprentice = (index: number) => {
    setAssignments(prev => prev.filter((_, i) => i !== index));
  };

  const handleApprenticeChange = (index: number, field: 'apprenticeId' | 'percentage', value: string | number) => {
    setAssignments(prev => {
      const updated = [...prev];
      if (field === 'apprenticeId') {
        // Shogird tanlaganda uning foizini User modelidan olish
        const selectedApprentice = (apprenticesData as any)?.users?.find((u: any) => u._id === value);
        const apprenticePercentage = selectedApprentice?.percentage || 50;
        
        updated[index].apprenticeId = value as string;
        updated[index].percentage = apprenticePercentage;
        
        // Pulni qayta hisoblash
        const totalPayment = formData.payment;
        const apprenticeCount = assignments.length;
        const allocatedAmount = totalPayment / apprenticeCount;
        updated[index].earning = (allocatedAmount * apprenticePercentage) / 100;
        
        console.log(`✅ Shogird tanlandi: ${selectedApprentice?.name}, Foiz: ${apprenticePercentage}%`);
      }
      // Foizni o'zgartirish imkoniyatini olib tashladik
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || formData.title.length < 3) {
      alert('Vazifa nomi kamida 3 ta belgidan iborat bo\'lishi kerak');
      return;
    }
    
    if (!formData.car || !formData.dueDate) {
      alert('Barcha majburiy maydonlarni to\'ldiring');
      return;
    }

    // Agar assignments bo'lsa, validatsiya
    if (assignments.length > 0) {
      const hasEmptyApprentice = assignments.some(a => !a.apprenticeId);
      if (hasEmptyApprentice) {
        alert('Barcha shogirdlarni tanlang yoki bo\'sh qatorlarni o\'chiring');
        return;
      }
    } else if (!formData.assignedTo) {
      alert('Kamida bitta shogird tanlang');
      return;
    }
    
    try {
      const submitData: any = { ...formData };
      
      // Agar assignments bo'lsa, uni qo'shish
      if (assignments.length > 0) {
        submitData.assignments = assignments;
        delete submitData.assignedTo; // Eski tizimni o'chirish
      }

      await updateTaskMutation.mutateAsync({
        id: task!._id,
        data: submitData
      });
      if (onUpdate) {
        onUpdate();
      }
      onClose();
    } catch (error: any) {
      alert('Vazifani yangilashda xatolik yuz berdi');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estimatedHours' || name === 'payment' ? Number(value) : value
    }));
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-3 sm:p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 p-3 sm:p-3.5 sticky top-0 z-10 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">Vazifani tahrirlash</h3>
              </div>
              <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all">
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-2.5">
            {/* Shogirdlar - Ko'p shogirdli tizim */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 p-3 rounded-xl border-2 border-blue-200 shadow-sm">
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs sm:text-sm font-bold text-blue-900 flex items-center gap-1.5">
                  <div className="bg-blue-600 p-1 rounded">
                    <User className="h-3 w-3 text-white" />
                  </div>
                  Shogirdlar *
                </label>
                <button
                  type="button"
                  onClick={handleAddApprentice}
                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-1 shadow-sm hover:shadow transition-all"
                >
                  <Plus className="h-3 w-3" />
                  Qo'shish
                </button>
              </div>

              {assignments.length > 0 ? (
                <div className="space-y-1.5">
                  {assignments.map((assignment, index) => (
                    <div key={index} className="bg-white p-1.5 rounded border border-blue-200">
                      <div className="grid grid-cols-12 gap-1.5 items-center">
                        <div className="col-span-6">
                          <select
                            value={assignment.apprenticeId}
                            onChange={(e) => handleApprenticeChange(index, 'apprenticeId', e.target.value)}
                            className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            required
                          >
                            <option value="">Tanlang</option>
                            {(apprenticesData as any)?.users?.map((apprentice: any) => (
                              <option key={apprentice._id} value={apprentice._id}>
                                {apprentice.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <div className="w-full px-1.5 py-1 text-xs border border-gray-200 rounded bg-gray-50 text-gray-700 font-semibold text-center">
                            {assignment.percentage}%
                          </div>
                        </div>
                        <div className="col-span-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveApprentice(index)}
                            className="w-full p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 flex items-center justify-center"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      {assignment.earning > 0 && (
                        <div className="flex items-center justify-center gap-1 text-xs text-green-600 font-semibold mt-1">
                          <DollarSign className="h-3 w-3" />
                          {assignment.earning.toLocaleString()} so'm
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Umumiy pul */}
                  {formData.payment > 0 && (
                    <div className="bg-green-100 p-1.5 rounded border border-green-300">
                      <p className="text-xs font-semibold text-green-800">Jami shogirdlar ulushi:</p>
                      <div className="flex items-center gap-1 text-sm font-bold text-green-900">
                        <DollarSign className="h-3.5 w-3.5" />
                        {assignments.reduce((sum, a) => sum + a.earning, 0).toLocaleString()} so'm
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <select
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                    required
                  >
                    <option value="">Bitta shogird tanlang</option>
                    {(apprenticesData as any)?.users?.map((apprentice: any) => (
                      <option key={apprentice._id} value={apprentice._id}>
                        {apprentice.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-blue-700 mt-1.5 flex items-center gap-1">
                    <Plus className="h-3 w-3" />
                    Ko'p shogird qo'shish uchun "Qo'shish" tugmasini bosing
                  </p>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                Vazifa nomi *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Masalan: Moy almashtirish"
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                Tavsif *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                placeholder="Qisqacha tavsif..."
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                required
              />
            </div>

            {/* Apprentice and Car */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Car className="h-3 w-3" />
                Mashina *
              </label>
              <select
                name="car"
                value={formData.car}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
                required
              >
                <option value="">Tanlang</option>
                {carsData
                  ?.filter((car: any) => 
                    !car.isDeleted && 
                    car.status !== 'completed' && 
                    car.status !== 'delivered'
                  )
                  ?.map((car: any) => (
                  <option key={car._id} value={car._id}>
                    {car.make} {car.carModel}
                  </option>
                ))}
              </select>
            </div>

            {/* Work Selection - faqat mashina tanlanganda ko'rinadi */}
            {formData.car && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Wrench className="h-3 w-3" />
                  Ish nomi
                </label>
                <select
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
                  disabled={loadingServices}
                >
                  <option value="">
                    {loadingServices ? 'Yuklanmoqda...' : 'Ish nomini tanlang'}
                  </option>
                  {carServices.map((service: any) => (
                    <option key={service._id} value={service._id}>
                      {service.name} - {service.price.toLocaleString()} so'm
                    </option>
                  ))}
                </select>
                {carServices.length === 0 && !loadingServices && formData.car && (
                  <p className="text-xs text-amber-600 mt-1">
                    Bu mashina uchun ishlar mavjud emas
                  </p>
                )}
              </div>
            )}

            {/* Priority, Due Date, Hours, Payment */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
                  Muhimlik
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                >
                  <option value="low">Past</option>
                  <option value="medium">O'rta</option>
                  <option value="high">Yuqori</option>
                  <option value="urgent">Shoshilinch</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-purple-600" />
                  Muddat *
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-blue-600" />
                  Soat *
                </label>
                <input
                  type="number"
                  name="estimatedHours"
                  value={formData.estimatedHours}
                  onChange={handleChange}
                  min="0.5"
                  step="0.5"
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-green-600" />
                  To'lov
                </label>
                <input
                  type="number"
                  name="payment"
                  value={formData.payment}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Avtomatik"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 pt-3 border-t border-gray-200 mt-3 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={updateTaskMutation.isPending}
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
              >
                {updateTaskMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTaskModal;