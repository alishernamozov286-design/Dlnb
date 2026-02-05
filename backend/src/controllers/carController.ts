import { Response } from 'express';
import Car from '../models/Car';
import Task from '../models/Task';
import SparePart from '../models/SparePart';
import { AuthRequest } from '../middleware/auth';
import telegramService from '../services/telegramService';
import debtService from '../services/debtService';
export const createCar = async (req: AuthRequest, res: Response) => {
  try {
    const { make, carModel, year, licensePlate, ownerName, ownerPhone, parts, serviceItems, usedSpareParts } = req.body;
    
    console.log('🚗 Mashina yaratish so\'rovi:');
    console.log('📦 Parts:', parts);
    console.log('💰 ServiceItems:', serviceItems);
    
    // Validation: Required fields
    if (!make || !carModel || !licensePlate || !ownerName || !ownerPhone) {
      return res.status(400).json({ 
        message: 'Barcha majburiy maydonlarni to\'ldiring',
        missingFields: {
          make: !make,
          carModel: !carModel,
          licensePlate: !licensePlate,
          ownerName: !ownerName,
          ownerPhone: !ownerPhone
        }
      });
    }
    
    const existingCar = await Car.findOne({ licensePlate });
    if (existingCar) {
      return res.status(400).json({ 
        message: 'Bu davlat raqami bilan mashina allaqachon mavjud',
        duplicateField: 'licensePlate',
        existingCarId: existingCar._id
      });
    }

    // Zapchastlar sonini kamaytirish
    if (usedSpareParts && Array.isArray(usedSpareParts)) {
      for (const usedPart of usedSpareParts) {
        const sparePart = await SparePart.findById(usedPart.sparePartId);
        if (!sparePart) {
          return res.status(404).json({ message: `Zapchast topilmadi: ${usedPart.name}` });
        }
        
        if (sparePart.quantity < usedPart.quantity) {
          return res.status(400).json({ 
            message: `Yetarli zapchast yo'q: ${sparePart.name}. Mavjud: ${sparePart.quantity}, Kerak: ${usedPart.quantity}` 
          });
        }

        // Zapchast sonini kamaytirish va ishlatilish sonini oshirish
        await SparePart.findByIdAndUpdate(
          usedPart.sparePartId,
          { 
            $inc: { 
              quantity: -usedPart.quantity,
              usageCount: usedPart.quantity
            }
          }
        );
      }
    }

    const car = new Car({
      make,
      carModel,
      year,
      licensePlate,
      ownerName,
      ownerPhone,
      parts: parts || [],
      serviceItems: serviceItems || []
    });
    
    console.log('💾 Mashina saqlanmoqda...');
    console.log('📋 Car serviceItems:', car.serviceItems);
    
    await car.save();
    
    console.log('✅ Mashina saqlandi:', car._id);
    console.log('📋 Saqlangan serviceItems:', car.serviceItems);

    // ✨ CarService yaratish (xizmatlar uchun)
    try {
      const CarService = require('../models/CarService').default;
      
      // Barcha qismlar va xizmatlarni birlashtirish
      const allItems = [
        ...(parts || []).map((part: any) => ({
          name: part.name,
          description: part.description || '',
          price: part.price,
          quantity: part.quantity,
          category: 'part' as const
        })),
        ...(serviceItems || []).map((item: any) => ({
          name: item.name,
          description: item.description || '',
          price: item.price,
          quantity: item.quantity,
          category: item.category
        }))
      ];
      
      if (allItems.length > 0) {
        // Jami narxni hisoblash
        const totalPrice = allItems.reduce((sum: number, item: any) => 
          sum + (item.price * item.quantity), 0
        );
        
        // Yangi CarService yaratish
        const carService = new CarService({
          car: car._id,
          items: allItems,
          totalPrice: totalPrice,
          paidAmount: 0,
          paymentStatus: 'pending',
          createdBy: req.user?.id,
          status: 'in-progress'
        });
        await carService.save();
        console.log(`✨ CarService yaratildi: ${car._id} - Jami: ${totalPrice} so'm`);
      }
    } catch (serviceError: any) {
      console.error('⚠️ CarService yaratishda xatolik:', serviceError.message);
      // CarService xatosi asosiy jarayonni to'xtatmasin
    }
    
    // Telegram'ga xabar yuborish
    let telegramResult = null;
    try {
      console.log('🔍 DEBUG: Parts data:', JSON.stringify(parts, null, 2));
      
      const carData = {
        make,
        carModel,
        year,
        licensePlate,
        ownerName,
        ownerPhone
      };
      
      telegramResult = await telegramService.sendCarAddedNotification(carData, parts || []);
      console.log('📱 Telegram Result:', telegramResult);
    } catch (telegramError) {
      // Telegram xatosi asosiy jarayonni to'xtatmasin
      console.error('❌ Telegram xatosi:', telegramError);
    }

    res.status(201).json({
      message: 'Mashina muvaffaqiyatli qo\'shildi',
      _id: car._id,
      car,
      telegramNotification: telegramResult
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};
export const getCars = async (req: AuthRequest, res: Response) => {
  try {
    const { status, search } = req.query;
    const filter: any = { isDeleted: { $ne: true } }; // Faqat o'chirilmagan mashinalar
    
    if (status) filter.status = status;
    if (search) {
      // Qidiruv so'zini tozalash (bo'shliqlar, kichik harflar, maxsus belgilar)
      const normalizeText = (text: string) => {
        return text
          .toLowerCase()
          .replace(/\s+/g, '') // Barcha bo'shliqlarni olib tashlash
          .replace(/[^a-z0-9а-яё]/gi, ''); // Faqat harf va raqamlar (lotin va kirill)
      };
      
      const normalizedSearch = normalizeText(search as string);
      
      // Barcha mashinalarni olish va frontend da filtrlash
      const allCars = await Car.find(filter).sort({ createdAt: -1 });
      
      // Har bir mashinani qidiruv so'zi bilan solishtirish
      const filteredCars = allCars.filter((car: any) => {
        const licensePlate = normalizeText(car.licensePlate || '');
        const make = normalizeText(car.make || '');
        const model = normalizeText(car.carModel || '');
        const owner = normalizeText(car.ownerName || '');
        
        return (
          licensePlate.includes(normalizedSearch) ||
          make.includes(normalizedSearch) ||
          model.includes(normalizedSearch) ||
          owner.includes(normalizedSearch)
        );
      });
      
      return res.json({ cars: filteredCars });
    }
    
    const cars = await Car.find(filter).sort({ createdAt: -1 });
    res.json({ cars });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const getCarById = async (req: AuthRequest, res: Response) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.json({ car });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const updateCar = async (req: AuthRequest, res: Response) => {
  try {
    const updates = req.body;
    const carId = req.params.id;
    
    // Zapchastlar sonini kamaytirish (faqat yangi zapchastlar uchun)
    if (updates.usedSpareParts && Array.isArray(updates.usedSpareParts)) {
      for (const usedPart of updates.usedSpareParts) {
        const sparePart = await SparePart.findById(usedPart.sparePartId);
        if (!sparePart) {
          return res.status(404).json({ message: `Zapchast topilmadi: ${usedPart.name}` });
        }
        
        if (sparePart.quantity < usedPart.quantity) {
          return res.status(400).json({ 
            message: `Yetarli zapchast yo'q: ${sparePart.name}. Mavjud: ${sparePart.quantity}, Kerak: ${usedPart.quantity}` 
          });
        }

        // Zapchast sonini kamaytirish va ishlatilish sonini oshirish
        await SparePart.findByIdAndUpdate(
          usedPart.sparePartId,
          { 
            $inc: { 
              quantity: -usedPart.quantity,
              usageCount: usedPart.quantity
            }
          }
        );
      }
    }
    
    // Agar davlat raqami o'zgartirilayotgan bo'lsa, unique ekanligini tekshirish
    if (updates.licensePlate) {
      const existingCar = await Car.findOne({ 
        licensePlate: updates.licensePlate,
        _id: { $ne: carId }
      });
      if (existingCar) {
        return res.status(400).json({ 
          message: 'Bu davlat raqami bilan boshqa mashina allaqachon mavjud' 
        });
      }
    }
    // Avval mavjud mashinani olish
    const existingCar = await Car.findById(carId);
    if (!existingCar) {
      return res.status(404).json({ message: 'Mashina topilmadi' });
    }
    // MUHIM: Ma'lumotlarni to'g'ri tayyorlash
    const updateData: any = {
      make: updates.make?.trim() || existingCar.make,
      carModel: updates.carModel?.trim() || existingCar.carModel,
      year: Number(updates.year) || existingCar.year,
      licensePlate: updates.licensePlate?.trim() || existingCar.licensePlate,
      ownerName: updates.ownerName?.trim() || existingCar.ownerName,
      ownerPhone: updates.ownerPhone?.trim() || existingCar.ownerPhone,
      status: updates.status || existingCar.status
    };
    // Parts processing - MUHIM: To'g'ri saqlash
    if (updates.parts !== undefined && Array.isArray(updates.parts)) {
      const validParts = updates.parts
        .filter((part: any) => {
          const isValid = part && 
            part.name && 
            typeof part.name === 'string' && 
            part.name.trim() !== '' &&
            typeof part.quantity === 'number' && 
            part.quantity > 0 &&
            typeof part.price === 'number' && 
            part.price >= 0;
          if (!isValid) {
            }
          return isValid;
        })
        .map((part: any) => ({
          name: String(part.name).trim(),
          quantity: Number(part.quantity),
          price: Number(part.price),
          status: part.status || 'needed'
        }));
      updateData.parts = validParts;
    } else {
      updateData.parts = existingCar.parts || [];
    }
    // Service items processing - MUHIM: To'g'ri saqlash
    if (updates.serviceItems !== undefined && Array.isArray(updates.serviceItems)) {
      const validServiceItems = updates.serviceItems
        .filter((item: any) => {
          const isValid = item && 
            item.name && 
            typeof item.name === 'string' && 
            item.name.trim() !== '' &&
            typeof item.quantity === 'number' && 
            item.quantity > 0 &&
            typeof item.price === 'number' && 
            item.price >= 0 &&
            ['part', 'material', 'labor'].includes(item.category);
          if (!isValid) {
            }
          return isValid;
        })
        .map((item: any) => ({
          name: String(item.name).trim(),
          description: String(item.description || '').trim(),
          quantity: Number(item.quantity),
          price: Number(item.price),
          category: item.category
        }));
      updateData.serviceItems = validServiceItems;
    } else {
      updateData.serviceItems = existingCar.serviceItems || [];
    }
    // Manual totalEstimate calculation
    const partsTotal = (updateData.parts || []).reduce((total: number, part: any) => total + (part.price * part.quantity), 0);
    const servicesTotal = (updateData.serviceItems || []).reduce((total: number, service: any) => total + (service.price * service.quantity), 0);
    updateData.totalEstimate = partsTotal + servicesTotal;
    const car = await Car.findByIdAndUpdate(
      carId,
      updateData,
      { new: true, runValidators: true }
    );
    if (!car) {
      return res.status(404).json({ message: 'Mashina yangilanmadi' });
    }

    // ✨ YANGI: CarService yaratish yoki yangilash
    try {
      const CarService = require('../models/CarService').default;
      
      console.log('🔍 CarService tekshirilmoqda:', carId);
      
      // Mavjud CarService ni topish (delivered bo'lmagan)
      let carService = await CarService.findOne({ 
        car: carId, 
        status: { $ne: 'delivered' } 
      }).sort({ createdAt: -1 });
      
      // Barcha qismlar va xizmatlarni birlashtirish
      const allItems = [
        ...(updateData.parts || []).map((part: any) => ({
          name: part.name,
          description: part.description || '',
          price: part.price,
          quantity: part.quantity,
          category: 'part' as const
        })),
        ...(updateData.serviceItems || []).map((item: any) => ({
          name: item.name,
          description: item.description || '',
          price: item.price,
          quantity: item.quantity,
          category: item.category
        }))
      ];
      
      if (carService) {
        // ✅ Mavjud CarService ni yangilash
        carService.items = allItems;
        carService.totalPrice = updateData.totalEstimate;
        
        // Agar to'lov qilingan bo'lsa, paymentStatus ni saqlash
        if (carService.paidAmount > 0) {
          if (carService.paidAmount >= updateData.totalEstimate) {
            carService.paymentStatus = 'paid';
          } else {
            carService.paymentStatus = 'partial';
          }
        }
        
        await carService.save();
        console.log(`🔄 CarService yangilandi: ${carId} - Jami: ${updateData.totalEstimate} so'm`);
      } else if (allItems.length > 0) {
        // ✅ Yangi CarService yaratish (faqat qismlar yoki xizmatlar bo'lsa)
        carService = new CarService({
          car: carId,
          items: allItems,
          totalPrice: updateData.totalEstimate,
          paidAmount: car.paidAmount || 0,
          paymentStatus: car.paymentStatus || 'pending',
          createdBy: req.user?.id,
          status: 'in-progress'
        });
        await carService.save();
        console.log(`✨ Yangi CarService yaratildi: ${carId} - Jami: ${updateData.totalEstimate} so'm`);
      } else {
        console.log(`⚠️ CarService yaratilmadi: qismlar yoki xizmatlar yo'q`);
      }
      
      res.json({
        message: 'Mashina muvaffaqiyatli yangilandi',
        car,
        carService: carService || null
      });
    } catch (serviceError: any) {
      console.error('⚠️ CarService yaratishda xatolik:', serviceError.message);
      // CarService xatosi asosiy jarayonni to'xtatmasin
      res.json({
        message: 'Mashina yangilandi, lekin xizmat yaratishda xatolik',
        car,
        serviceError: serviceError.message
      });
    }
  } catch (error: any) {
    // MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Bu davlat raqami bilan mashina allaqachon mavjud' 
      });
    }
    // Validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ 
        message: 'Ma\'lumotlar noto\'g\'ri', 
        errors: validationErrors 
      });
    }
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};
export const addPart = async (req: AuthRequest, res: Response) => {
  try {
    const { name, price, quantity, status } = req.body;
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    car.parts.push({ name, price, quantity, status });
    await car.save();
    res.json({
      message: 'Part added successfully',
      car
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const updatePart = async (req: AuthRequest, res: Response) => {
  try {
    const { partId } = req.params;
    const updates = req.body;
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    const partIndex = car.parts.findIndex(part => part._id?.toString() === partId);
    if (partIndex === -1) {
      return res.status(404).json({ message: 'Part not found' });
    }
    Object.assign(car.parts[partIndex], updates);
    await car.save();
    res.json({
      message: 'Part updated successfully',
      car
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const deletePart = async (req: AuthRequest, res: Response) => {
  try {
    const { partId } = req.params;
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    const partIndex = car.parts.findIndex(part => part._id?.toString() === partId);
    if (partIndex === -1) {
      return res.status(404).json({ message: 'Part not found' });
    }
    car.parts.splice(partIndex, 1);
    await car.save();
    res.json({
      message: 'Part deleted successfully',
      car
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const deleteCar = async (req: AuthRequest, res: Response) => {
  try {
    const carId = req.params.id;
    
    // Temp ID'larni handle qilish
    if (carId.startsWith('temp_')) {
      console.log(`⚠️ Temp ID bilan o'chirish urinishi: ${carId}`);
      return res.status(400).json({ 
        message: 'Temp ID bilan mashinani o\'chirish mumkin emas. Avval sinxronlash kerak.',
        tempId: carId
      });
    }
    
    // SOFT DELETE - mashinani isDeleted: true qilish (MongoDB'da saqlash)
    const car = await Car.findByIdAndUpdate(
      carId,
      { 
        isDeleted: true,
        deletedAt: new Date()
      },
      { new: true }
    );
    
    if (!car) {
      return res.status(404).json({ message: 'Mashina topilmadi' });
    }
    
    console.log(`🗑️ Mashina soft delete qilindi: ${car.licensePlate} - ${car.ownerName}`);
    
    res.json({
      message: 'Mashina arxivga o\'tkazildi',
      car: {
        _id: car._id,
        licensePlate: car.licensePlate,
        ownerName: car.ownerName,
        isDeleted: car.isDeleted,
        deletedAt: car.deletedAt
      }
    });
  } catch (error: any) {
    console.error('❌ Mashinani o\'chirishda xatolik:', error);
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};

// Mashina ishlarini olish (faqat berilmagan xizmatlar)
export const getCarServices = async (req: AuthRequest, res: Response) => {
  try {
    const carId = req.params.id;
    
    console.log('🔍 Xizmatlar so\'ralmoqda:', carId);
    
    // Avval mashinani tekshirish
    const car = await Car.findById(carId);
    if (!car) {
      console.log('❌ Mashina topilmadi:', carId);
      return res.status(404).json({ message: 'Mashina topilmadi' });
    }

    console.log('✅ Mashina topildi:', car.licensePlate);
    console.log('📋 Mashina serviceItems:', car.serviceItems);

    // Bu mashina uchun allaqachon berilgan xizmatlarni topish
    const assignedTasks = await Task.find({ 
      car: carId,
      status: { $in: ['assigned', 'in-progress', 'completed', 'approved'] }
    }).select('service serviceItemId');
    
    // Berilgan xizmatlar ID larini olish (service yoki serviceItemId)
    const assignedServiceIds = assignedTasks
      .filter(task => task.service || task.serviceItemId)
      .map(task => {
        if (task.service) {
          return typeof task.service === 'string' ? task.service : task.service.toString();
        }
        return task.serviceItemId!.toString();
      });

    console.log('📝 Berilgan xizmatlar:', assignedServiceIds);

    // Mashina serviceItems dan faqat berilmagan ishlarni olish
    const availableServices = car.serviceItems.filter(item => 
      item._id && 
      !assignedServiceIds.includes(item._id.toString())
    );

    const services = availableServices.map(item => ({
      _id: item._id!,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      quantity: item.quantity
    }));

    console.log('✅ Berilmagan xizmatlar:', services.length, 'ta');
    console.log('📋 Xizmatlar royxati:', services);

    res.json({ services });
  } catch (error: any) {
    console.error('❌ Xizmatlarni olishda xatolik:', error);
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};

// Client keltirishi kerak bo'lgan qismlarni olish
export const getClientParts = async (req: AuthRequest, res: Response) => {
  try {
    // Barcha avtomobillarni olish
    const cars = await Car.find({});
    
    // Client keltirishi kerak bo'lgan qismlarni filtrlash
    const clientParts: any[] = [];
    
    cars.forEach(car => {
      // Faqat 'tobring' source ga ega bo'lgan qismlarni olish
      const tobringParts = car.parts.filter(part => part.source === 'tobring');
      
      tobringParts.forEach(part => {
        clientParts.push({
          carId: car._id,
          carInfo: {
            make: car.make,
            model: car.carModel,
            licensePlate: car.licensePlate,
            ownerName: car.ownerName,
            ownerPhone: car.ownerPhone
          },
          part: {
            _id: part._id,
            name: part.name,
            price: part.price,
            quantity: part.quantity,
            status: part.status
          }
        });
      });
    });

    res.json({ parts: clientParts });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};

// Arxivlangan mashinalarni olish
export const getArchivedCars = async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;
    const filter: any = { 
      $or: [
        { isDeleted: true },
        { paymentStatus: 'paid' }
      ]
    };
    
    if (search) {
      filter.$and = [
        { $or: filter.$or },
        {
          $or: [
            { make: { $regex: search, $options: 'i' } },
            { carModel: { $regex: search, $options: 'i' } },
            { licensePlate: { $regex: search, $options: 'i' } },
            { ownerName: { $regex: search, $options: 'i' } }
          ]
        }
      ];
      delete filter.$or;
    }
    
    const cars = await Car.find(filter).sort({ updatedAt: -1 });
    
    console.log(`📦 Arxivlangan mashinalar: ${cars.length} ta`);
    
    res.json({ cars });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};

// Mashinani arxivdan qaytarish (restore)
export const restoreCar = async (req: AuthRequest, res: Response) => {
  try {
    const car = await Car.findByIdAndUpdate(
      req.params.id,
      { 
        isDeleted: false,
        $unset: { deletedAt: 1 }
      },
      { new: true }
    );
    
    if (!car) {
      return res.status(404).json({ message: 'Mashina topilmadi' });
    }
    
    console.log(`♻️ Mashina qaytarildi: ${car.licensePlate} - ${car.ownerName}`);
    
    res.json({
      message: 'Mashina muvaffaqiyatli qaytarildi',
      car
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};


// Complete car work and create debt if needed
export const completeCar = async (req: AuthRequest, res: Response) => {
  try {
    const carId = req.params.id;
    const { notes } = req.body;

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Mashina topilmadi' });
    }

    if (car.status === 'completed' || car.status === 'delivered') {
      return res.status(400).json({ message: 'Mashina allaqachon tugatilgan' });
    }

    // Update car status to completed
    car.status = 'completed';
    
    // Calculate remaining debt
    const totalAmount = car.totalEstimate;
    const paidAmount = car.paidAmount || 0;
    const remainingAmount = totalAmount - paidAmount;

    // If there's remaining debt, create debt entry
    if (remainingAmount > 0) {
      try {
        await debtService.createDebtForCompletedCar({
          carId: car._id,
          clientName: car.ownerName,
          clientPhone: car.ownerPhone,
          totalAmount,
          paidAmount,
          description: `${car.make} ${car.carModel} (${car.licensePlate}) - Mashina ta'miri qarzi`,
          notes: notes || 'Mashina tugatilganda avtomatik yaratilgan qarz'
        });
        
        console.log(`💰 Qarz yaratildi: ${car.ownerName} - ${remainingAmount} so'm`);
      } catch (debtError) {
        console.error('❌ Qarz yaratishda xatolik:', debtError);
        // Don't fail the completion if debt creation fails
      }
    }

    await car.save();

    console.log(`✅ Mashina tugatildi: ${car.licensePlate} - ${car.ownerName}`);
    
    res.json({
      message: remainingAmount > 0 
        ? 'Mashina tugatildi va qarz yaratildi' 
        : 'Mashina muvaffaqiyatli tugatildi',
      car,
      debtCreated: remainingAmount > 0,
      remainingAmount
    });
  } catch (error: any) {
    console.error('❌ Mashinani tugatishda xatolik:', error);
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};

// Add payment to car
export const addCarPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, paymentMethod, notes } = req.body;
    const carId = req.params.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const remaining = car.totalEstimate - (car.paidAmount || 0);
    if (amount > remaining) {
      return res.status(400).json({ message: 'Payment amount exceeds remaining balance' });
    }

    // Update paid amount
    car.paidAmount = (car.paidAmount || 0) + amount;
    
    // Add payment to history
    if (!car.payments) {
      car.payments = [];
    }
    car.payments.push({
      amount,
      method: paymentMethod || 'cash',
      paidAt: new Date(),
      paidBy: req.user?.id,
      notes: notes || ''
    });

    // Update payment status
    if (car.paidAmount >= car.totalEstimate) {
      car.paymentStatus = 'paid';
    } else if (car.paidAmount > 0) {
      car.paymentStatus = 'partial';
    }

    await car.save();

    console.log(`✅ To'lov qo'shildi: ${amount} so'm - ${car.licensePlate} - ${paymentMethod || 'cash'}`);

    // ❌ ESKI KOD OLIB TASHLANDI - DebtService ishlatiladi
    // Bu yerda qarz yaratish/yangilash yo'q, chunki carServiceController allaqachon buni qiladi

    res.json({
      message: 'Payment added successfully',
      car
    });
  } catch (error: any) {
    console.error('❌ To\'lov qo\'shishda xatolik:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
