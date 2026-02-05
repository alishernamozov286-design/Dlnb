import { Response } from 'express';
import CarService from '../models/CarService';
import Car from '../models/Car';
import { AuthRequest } from '../middleware/auth';
import debtService from '../services/debtService';

/**
 * Mashina barcha ishlar tugaganda avtomatik tugatish funksiyasi
 * Bu funksiya ham vazifalar, ham xizmatlar tasdiqlanganda ishlaydi
 */
async function checkAndCompleteCarIfReady(carId: any) {
  try {
    const Task = require('../models/Task').default;
    
    // Barcha vazifalar va xizmatlarni tekshirish
    const allTasks = await Task.find({ car: carId });
    const allServices = await CarService.find({ car: carId });
    
    // Vazifalar holati: barcha vazifalar ko'rib chiqilgan va kamida bittasi tasdiqlangan
    const allTasksReviewed = allTasks.length === 0 || allTasks.every((t: any) => 
      t.status === 'approved' || t.status === 'rejected'
    );
    const hasApprovedTasks = allTasks.length === 0 || allTasks.some((t: any) => t.status === 'approved');
    
    // Xizmatlar holati: barcha xizmatlar tasdiqlangan
    const allServicesApproved = allServices.length === 0 || allServices.every((s: any) => 
      s.status === 'completed'
    );
    
    console.log(`🔍 Mashina holati tekshirilmoqda:`, {
      carId,
      tasksCount: allTasks.length,
      servicesCount: allServices.length,
      allTasksReviewed,
      hasApprovedTasks,
      allServicesApproved,
      taskStatuses: allTasks.map((t: any) => ({ id: t._id, status: t.status, title: t.title })),
      serviceStatuses: allServices.map((s: any) => ({ id: s._id, status: s.status }))
    });
    
    // Agar barcha ishlar tugagan bo'lsa
    if (allTasksReviewed && hasApprovedTasks && allServicesApproved) {
      const car = await Car.findById(carId);
      
      if (car && car.status !== 'completed') {
        console.log(`🎯 Barcha ishlar tugadi - mashina tugatilmoqda: ${car.licensePlate}`);
        
        // Mashina statusini completed ga o'zgartirish
        car.status = 'completed';
        
        // Qarz tekshirish va yaratish
        const totalAmount = car.totalEstimate || 0;
        const paidAmount = car.paidAmount || 0;
        const remainingAmount = totalAmount - paidAmount;

        if (remainingAmount > 0) {
          try {
            await debtService.createDebtForCompletedCar({
              carId: car._id,
              clientName: car.ownerName,
              clientPhone: car.ownerPhone,
              totalAmount,
              paidAmount,
              description: `${car.make} ${car.carModel} (${car.licensePlate}) - Avtomatik yaratilgan qarz (barcha ishlar tugadi)`,
              notes: 'Barcha ishlar tugaganda avtomatik yaratilgan qarz'
            });
          } catch (debtError) {
            console.error('❌ Qarz yaratishda xatolik:', debtError);
          }
        } else {
          console.log(`✅ Mashina to'liq to'langan holda tugatildi: ${car.licensePlate}`);
        }

        await car.save();
        console.log(`✅ Mashina avtomatik tugatildi: ${car.licensePlate} - ${car.ownerName}`);
        
        return { completed: true, car };
      }
    } else {
      console.log(`⏳ Mashina hali tugamagan: vazifalar=${allTasksReviewed}, xizmatlar=${allServicesApproved}`);
    }
    
    return { completed: false };
  } catch (error) {
    console.error('❌ Mashina tugatishda xatolik:', error);
    throw error;
  }
}
export const createCarService = async (req: AuthRequest, res: Response) => {
  try {
    const { carId, parts, tasks } = req.body;
    const userId = req.user?.id;
    // Verify car exists
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    // ✨ YANGI: Zapchastlarni tekshirish va kamaytirish (Muammo 1.8 yechimi)
    const SparePart = require('../models/SparePart').default;
    const sparePartsToUpdate: any[] = [];
    
    for (const part of parts) {
      if (part.category === 'part' && part.sparePartId) {
        const sparePart = await SparePart.findById(part.sparePartId);
        
        if (!sparePart) {
          return res.status(404).json({ 
            message: `Zapchast topilmadi: ${part.name}` 
          });
        }
        
        // Yetarli zapchast borligini tekshirish
        if (sparePart.quantity < part.quantity) {
          return res.status(400).json({ 
            message: `Zapchast yetarli emas: ${part.name}. Omborda: ${sparePart.quantity}, Kerak: ${part.quantity}` 
          });
        }
        
        sparePartsToUpdate.push({
          sparePart,
          usedQuantity: part.quantity
        });
      }
    }
    
    // Calculate total price
    const totalPrice = parts.reduce((total: number, item: any) => {
      return total + (item.price * (item.quantity || 1));
    }, 0);
    
    const carService = new CarService({
      car: carId,
      items: parts,
      totalPrice,
      createdBy: userId,
      status: 'in-progress'
    });
    
    await carService.save();
    
    // ✨ Zapchastlarni kamaytirish
    for (const { sparePart, usedQuantity } of sparePartsToUpdate) {
      sparePart.quantity -= usedQuantity;
      await sparePart.save();
      console.log(`📦 Zapchast kamaytirildi: ${sparePart.name} - ${usedQuantity} ta. Qoldi: ${sparePart.quantity}`);
      
      // Agar zapchast kam qolsa, ogohlantirish
      if (sparePart.quantity <= 5 && sparePart.quantity > 0) {
        console.log(`⚠️ Zapchast kam qoldi: ${sparePart.name} - ${sparePart.quantity} ta`);
      } else if (sparePart.quantity === 0) {
        console.log(`❌ Zapchast tugadi: ${sparePart.name}`);
      }
    }
    
    // Populate car details for response
    await carService.populate('car');
    await carService.populate('createdBy', 'name email');
    
    // Agar vazifalar berilgan bo'lsa, ularni yaratish
    if (tasks && Array.isArray(tasks) && tasks.length > 0) {
      const Task = require('../models/Task').default;
      for (const taskData of tasks) {
        const task = new Task({
          title: taskData.title,
          description: taskData.description || 'Vazifa tavsifi',
          assignedTo: taskData.assignedTo,
          assignedBy: userId,
          car: taskData.car,
          priority: taskData.priority || 'medium',
          dueDate: taskData.dueDate,
          estimatedHours: taskData.estimatedHours || 1,
          payment: taskData.payment || 0,
          status: 'assigned'
        });
        await task.save();
        }
    }
    
    res.status(201).json({
      message: 'Car service created successfully',
      service: carService
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const getCarServices = async (req: AuthRequest, res: Response) => {
  try {
    const { carId, status } = req.query;
    const filter: any = {};
    if (carId) filter.car = carId;
    if (status) filter.status = status;
    
    console.log('🔍 Xizmatlar qidirilmoqda:', filter);
    
    const services = await CarService.find(filter)
      .populate('car')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    console.log(`📦 Topilgan xizmatlar soni: ${services.length}`);
    
    res.json({ services });
  } catch (error: any) {
    console.error('❌ Xizmatlarni yuklashda xatolik:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const getCarServiceById = async (req: AuthRequest, res: Response) => {
  try {
    const service = await CarService.findById(req.params.id)
      .populate('car')
      .populate('createdBy', 'name email');
    if (!service) {
      return res.status(404).json({ message: 'Car service not found' });
    }
    res.json({ service });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const updateCarService = async (req: AuthRequest, res: Response) => {
  try {
    const updates = req.body;
    const service = await CarService.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('car').populate('createdBy', 'name email');
    if (!service) {
      return res.status(404).json({ message: 'Car service not found' });
    }
    res.json({
      message: 'Car service updated successfully',
      service
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const deleteCarService = async (req: AuthRequest, res: Response) => {
  try {
    const service = await CarService.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Car service not found' });
    }
    res.json({ message: 'Car service deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const updateServiceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const service = await CarService.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('car').populate('createdBy', 'name email');
    if (!service) {
      return res.status(404).json({ message: 'Car service not found' });
    }
    // Agar status "ready-for-delivery" bo'lsa, Telegram xabar yuborish
    if (status === 'ready-for-delivery') {
      const telegramService = require('../services/telegramService').default;
      await telegramService.sendCarReadyNotification(service.car, service);
    }
    // Agar status "delivered" bo'lsa, Telegram xabar yuborish
    if (status === 'delivered') {
      const telegramService = require('../services/telegramService').default;
      await telegramService.sendCarDeliveredNotification(service.car, service);
    }
    res.json({
      message: 'Service status updated successfully',
      service
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Approve service (master only) - changes status from ready-for-delivery to completed
export const approveService = async (req: AuthRequest, res: Response) => {
  try {
    const service = await CarService.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Car service not found' });
    }
    if (service.status !== 'ready-for-delivery') {
      return res.status(400).json({ message: 'Service must be ready for delivery before approval' });
    }
    
    service.status = 'completed';
    await service.save();
    await service.populate('car');
    await service.populate('createdBy', 'name email');
    
    // Update all related tasks to approved and add payment to apprentice earnings
    const Task = require('../models/Task').default;
    const User = require('../models/User').default;
    const Car = require('../models/Car').default;
    
    const tasks = await Task.find({ car: service.car, status: 'completed' });
    for (const task of tasks) {
      // Update task status to approved
      task.status = 'approved';
      task.approvedAt = new Date();
      await task.save();
      
      // Add payment to apprentice earnings
      if (task.payment && task.payment > 0) {
        await User.findByIdAndUpdate(
          task.assignedTo,
          { $inc: { earnings: task.payment } }
        );
      }
    }

    // Barcha xizmatlar va vazifalar tasdiqlangan yoki yo'qligini tekshirish
    const completionResult = await checkAndCompleteCarIfReady(service.car);
    
    res.json({
      message: 'Service approved successfully',
      service,
      carCompleted: completionResult.completed,
      carData: completionResult.car
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Reject service (master only) - changes status from ready-for-delivery to rejected
export const rejectService = async (req: AuthRequest, res: Response) => {
  try {
    const { rejectionReason } = req.body;
    const service = await CarService.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Car service not found' });
    }
    if (service.status !== 'ready-for-delivery') {
      return res.status(400).json({ message: 'Service must be ready for delivery before rejection' });
    }
    service.status = 'rejected';
    service.rejectionReason = rejectionReason || 'Rad etildi';
    await service.save();
    await service.populate('car');
    await service.populate('createdBy', 'name email');
    // Update all related tasks to rejected status
    const Task = require('../models/Task').default;
    await Task.updateMany(
      { car: service.car, status: 'completed' },
      { 
        status: 'rejected',
        rejectionReason: rejectionReason || 'Xizmat rad etildi'
      }
    );
    res.json({
      message: 'Service rejected successfully',
      service
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Restart service (apprentice can restart rejected service)
export const restartService = async (req: AuthRequest, res: Response) => {
  try {
    const service = await CarService.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Car service not found' });
    }
    if (service.status !== 'rejected') {
      return res.status(400).json({ message: 'Only rejected services can be restarted' });
    }
    service.status = 'in-progress';
    service.rejectionReason = undefined;
    await service.save();
    await service.populate('car');
    await service.populate('createdBy', 'name email');
    // Update all related tasks back to in-progress status
    const Task = require('../models/Task').default;
    await Task.updateMany(
      { car: service.car, status: 'rejected' },
      { 
        status: 'in-progress',
        $unset: { rejectionReason: 1 }
      }
    );
    res.json({
      message: 'Service restarted successfully',
      service
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Add item to service
export const addServiceItem = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId } = req.params;
    const { name, description, price, quantity, category } = req.body;
    const service = await CarService.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Car service not found' });
    }
    service.items.push({
      name,
      description,
      price,
      quantity,
      category,
      status: 'pending'
    });
    await service.save();
    res.json({
      message: 'Item added to service successfully',
      service
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Update service item
export const updateServiceItem = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId, itemId } = req.params;
    const updates = req.body;
    const service = await CarService.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Car service not found' });
    }
    const itemIndex = service.items.findIndex(item => item._id?.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found' });
    }
    Object.assign(service.items[itemIndex], updates);
    await service.save();
    res.json({
      message: 'Service item updated successfully',
      service
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Remove service item
export const removeServiceItem = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId, itemId } = req.params;
    const service = await CarService.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Car service not found' });
    }
    service.items = service.items.filter(item => item._id?.toString() !== itemId);
    await service.save();
    res.json({
      message: 'Service item removed successfully',
      service
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Add payment to car service
export const addCarServicePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, paymentMethod, notes } = req.body;
    const serviceId = req.params.id;

    console.log('💳 To\'lov qabul qilinmoqda:', {
      serviceId,
      amount,
      amountType: typeof amount,
      paymentMethod,
      notes
    });

    if (!amount || amount <= 0) {
      console.error('❌ Xato: Invalid payment amount', amount);
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    const service = await CarService.findById(serviceId);
    if (!service) {
      console.error('❌ Xato: Service not found', serviceId);
      return res.status(404).json({ message: 'Service not found' });
    }

    console.log('📊 Xizmat ma\'lumotlari:', {
      totalPrice: service.totalPrice,
      paidAmount: service.paidAmount || 0,
      remaining: service.totalPrice - (service.paidAmount || 0)
    });

    const remaining = service.totalPrice - (service.paidAmount || 0);
    if (amount > remaining) {
      console.error('❌ Xato: Payment exceeds remaining', { amount, remaining });
      return res.status(400).json({ 
        message: 'Payment amount exceeds remaining balance',
        amount,
        remaining
      });
    }

    // Update paid amount
    service.paidAmount = (service.paidAmount || 0) + amount;
    
    // Add payment to history
    if (!service.payments) {
      service.payments = [];
    }
    service.payments.push({
      amount,
      method: paymentMethod || 'cash',
      paidAt: new Date(),
      paidBy: req.user?.id
    });

    // Update payment status
    if (service.paidAmount >= service.totalPrice) {
      service.paymentStatus = 'paid';
    } else if (service.paidAmount > 0) {
      service.paymentStatus = 'partial';
    }

    await service.save();
    await service.populate('car');
    await service.populate('createdBy', 'name email');

    const carData = service.car as any;
    console.log(`✅ To'lov qo'shildi: ${amount} so'm - ${carData?.licensePlate || 'Noma\'lum'} - ${paymentMethod || 'cash'}`);

    // ✨ DebtService orqali qarzni boshqarish (markazlashtirilgan)
    try {
      await debtService.createOrUpdateDebt({
        carId: service.car,
        totalAmount: service.totalPrice,
        paidAmount: service.paidAmount,
        paymentMethod: paymentMethod || 'cash',
        notes: notes || `Xizmat to'lovi - ${paymentMethod || 'naqd'}`,
        createdBy: req.user?.id
      });
    } catch (debtError: any) {
      console.error('⚠️ Qarz yaratishda xatolik:', debtError.message);
      // Qarz xatosi to'lovni bekor qilmaydi, faqat log qilinadi
    }

    // ✨ YANGI: Transaction yaratish (Muammo 1.3 yechimi)
    try {
      const Transaction = require('../models/Transaction').default;
      const transaction = new Transaction({
        type: 'income',
        category: 'service-payment',
        amount,
        description: `Xizmat to'lovi - ${carData?.make || ''} ${carData?.carModel || ''} (${carData?.licensePlate || ''})`,
        paymentMethod: paymentMethod || 'cash',
        relatedTo: service._id,
        createdBy: req.user?.id
      });
      await transaction.save();
      
      // Daromadni yangilash
      const user = req.user!;
      user.earnings += amount;
      await user.save();
      
      console.log(`💰 Transaction yaratildi va daromad yangilandi: +${amount} so'm`);
    } catch (transactionError: any) {
      console.error('⚠️ Transaction yaratishda xatolik:', transactionError.message);
      // Transaction xatosi to'lovni bekor qilmaydi, faqat log qilinadi
    }

    // ✨ YANGI: Car modelini yangilash (Muammo 1.2 yechimi)
    try {
      const Car = require('../models/Car').default;
      const car = await Car.findById(service.car);
      
      if (car) {
        // Car ning paidAmount va paymentStatus ni yangilash
        car.paidAmount = service.paidAmount;
        
        if (service.paymentStatus === 'paid') {
          car.paymentStatus = 'paid';
          
          // ✨ YANGI: To'liq to'langanda qarzni "paid" ga o'zgartirish (Muammo 1.6 yechimi)
          await debtService.markDebtsAsPaid(car._id);
          console.log(`✅ Qarzlar to'liq to'landi va Qarzdaftarchadan o'chirildi`);
        } else if (service.paymentStatus === 'partial') {
          car.paymentStatus = 'partial';
        }
        
        // To'lov tarixiga qo'shish
        if (!car.payments) {
          car.payments = [];
        }
        car.payments.push({
          amount,
          method: paymentMethod || 'cash',
          paidAt: new Date(),
          paidBy: req.user?.id,
          notes: notes || `Xizmat to'lovi - ${paymentMethod || 'naqd'}`
        });
        
        await car.save();
        console.log(`🚗 Car modeli yangilandi: paymentStatus = ${car.paymentStatus}`);
      }
    } catch (carError: any) {
      console.error('⚠️ Car modelini yangilashda xatolik:', carError.message);
    }

    res.json({
      message: 'Payment added successfully',
      service
    });
  } catch (error: any) {
    console.error('❌ To\'lov qo\'shishda xatolik:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✨ YANGI: Har bir xizmatni alohida tasdiqlash
export const approveServiceItem = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId, itemId } = req.params;
    const { approved, rejectionReason } = req.body;

    console.log('🔍 Xizmat elementi tasdiqlanmoqda:', { serviceId, itemId, approved });

    const service = await CarService.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Xizmat topilmadi' });
    }

    const itemIndex = service.items.findIndex(item => item._id?.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Xizmat elementi topilmadi' });
    }

    const item = service.items[itemIndex];

    if (item.status !== 'completed') {
      return res.status(400).json({ message: 'Xizmat elementi avval tugatilishi kerak' });
    }

    if (approved) {
      item.status = 'approved';
      item.approvedAt = new Date();
      console.log(`✅ Xizmat elementi tasdiqlandi: ${item.name}`);
    } else {
      item.status = 'rejected';
      item.rejectionReason = rejectionReason || 'Rad etildi';
      console.log(`❌ Xizmat elementi rad etildi: ${item.name}`);
    }

    await service.save();
    await service.populate('car');
    await service.populate('createdBy', 'name email');

    // Barcha xizmat elementlari tasdiqlangan yoki yo'qligini tekshirish
    const allItemsApproved = service.items.every(i => i.status === 'approved' || i.status === 'rejected');
    const hasApprovedItems = service.items.some(i => i.status === 'approved');

    if (allItemsApproved && hasApprovedItems) {
      console.log('🎯 Barcha xizmat elementlari ko\'rib chiqildi');
      
      // Barcha vazifalar va xizmatlar tasdiqlangan yoki yo'qligini tekshirish
      if (service.car) {
        const completionResult = await checkAndCompleteCarIfReady(service.car);
        
        return res.json({
          message: `Xizmat elementi ${approved ? 'tasdiqlandi' : 'rad etildi'}`,
          service,
          allItemsReviewed: true,
          carCompleted: completionResult.completed,
          carData: completionResult.car
        });
      }
    }

    res.json({
      message: `Xizmat elementi ${approved ? 'tasdiqlandi' : 'rad etildi'}`,
      service,
      allItemsReviewed: false
    });
  } catch (error: any) {
    console.error('❌ Xizmat elementini tasdiqlashda xatolik:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✨ YANGI: Xizmat elementini tugatish (shogirt tomonidan)
export const completeServiceItem = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId, itemId } = req.params;
    const { notes } = req.body;

    console.log('🔍 Xizmat elementi tugatilmoqda:', { serviceId, itemId });

    const service = await CarService.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Xizmat topilmadi' });
    }

    const itemIndex = service.items.findIndex(item => item._id?.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Xizmat elementi topilmadi' });
    }

    const item = service.items[itemIndex];

    if (item.status === 'approved') {
      return res.status(400).json({ message: 'Tasdiqlangan xizmat elementini o\'zgartirish mumkin emas' });
    }

    item.status = 'completed';
    item.completedAt = new Date();
    if (notes) {
      item.description = notes;
    }

    console.log(`✅ Xizmat elementi tugatildi: ${item.name}`);

    await service.save();
    await service.populate('car');
    await service.populate('createdBy', 'name email');

    res.json({
      message: 'Xizmat elementi tugatildi',
      service
    });
  } catch (error: any) {
    console.error('❌ Xizmat elementini tugatishda xatolik:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
