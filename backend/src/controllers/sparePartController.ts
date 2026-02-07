import { Response } from 'express';
import SparePart from '../models/SparePart';
import SparePartSale from '../models/SparePartSale';
import { AuthRequest } from '../middleware/auth';

export const searchSpareParts = async (req: AuthRequest, res: Response) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.json({ spareParts: [] });
    }

    const searchQuery: any = {
      isActive: true,
      $or: [
        { name: { $regex: q.trim(), $options: 'i' } },
        { supplier: { $regex: q.trim(), $options: 'i' } }
      ]
    };

    const results = await SparePart.find(searchQuery)
      .sort({ usageCount: -1, name: 1 })
      .limit(Number(limit))
      .lean();

    const spareParts = results.map((part: any) => ({
      ...part,
      price: part.price || part.sellingPrice // Backward compatibility
    }));

    res.json({ spareParts });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSpareParts = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      search, 
      page = 1, 
      limit = 10000, 
      lowStock,
      sortBy = 'usageCount',
      sortOrder = 'desc'
    } = req.query;
    
    // Validate and sanitize inputs
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100000, Math.max(1, Number(limit))); // Cheksiz mahsulotlar
    const skip = (pageNum - 1) * limitNum;
    
    const filter: any = { isActive: true };
    
    // Search filter
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim();
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { supplier: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    // Low stock filter
    if (lowStock === 'true') {
      filter.quantity = { $lte: 3 };
    }
    
    // Build sort object
    const sortObj: any = {};
    const validSortFields = ['name', 'quantity', 'usageCount', 'costPrice', 'sellingPrice', 'createdAt'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'usageCount';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    sortObj[sortField as string] = sortDirection;
    if (sortField !== 'name') {
      sortObj.name = 1; // Secondary sort by name
    }
    
    // Execute queries in parallel for better performance
    // Statistikani faqat search bo'lmaganda hisoblash (tezroq)
    const queries: any[] = [
      SparePart.find(filter)
        .select('name costPrice sellingPrice price currency quantity supplier isActive usageCount createdAt')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean() // Use lean() for better performance
        .exec(), // Explicit exec for better performance
      SparePart.countDocuments(filter).exec()
    ];

    // Statistikani faqat search bo'lmaganda qo'shish
    if (!search) {
      queries.push(
        SparePart.aggregate([
          { $match: { isActive: true } },
          {
            $project: {
              quantity: 1,
              sellingPrice: 1,
              costPrice: 1
            }
          },
          {
            $group: {
              _id: null,
              totalItems: { $sum: 1 },
              totalQuantity: { $sum: '$quantity' },
              totalValue: { $sum: { $multiply: ['$sellingPrice', '$quantity'] } },
              totalProfit: { $sum: { $multiply: [{ $subtract: ['$sellingPrice', '$costPrice'] }, '$quantity'] } },
              lowStockCount: {
                $sum: {
                  $cond: [{ $lte: ['$quantity', 3] }, 1, 0]
                }
              }
            }
          }
        ]).allowDiskUse(false) // Memory'da ishlash - tezroq
      );
    }

    const results = await Promise.all(queries);
    const spareParts = results[0].map((part: any) => ({
      ...part,
      price: part.price || part.sellingPrice // Backward compatibility
    }));
    const total = results[1];
    const stats = results[2];

    const statistics = stats?.[0] || {
      totalItems: 0,
      totalQuantity: 0,
      totalValue: 0,
      totalProfit: 0,
      lowStockCount: 0
    };

    // HTTP cache headers - 60 sekund cache (maksimal tezlik)
    res.set({
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
      'ETag': `W/"spare-parts-${Date.now()}"`,
    });

    res.json({
      spareParts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      },
      statistics,
      filters: {
        search: search || null,
        lowStock: lowStock === 'true',
        sortBy: sortField,
        sortOrder: sortOrder
      }
    });
  } catch (error: any) {
    console.error('Error fetching spare parts:', error);
    res.status(500).json({ 
      message: 'Zapchastlarni yuklashda xatolik yuz berdi', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const getSparePartById = async (req: AuthRequest, res: Response) => {
  try {
    const sparePart = await SparePart.findById(req.params.id);
    
    if (!sparePart) {
      return res.status(404).json({ message: 'Spare part not found' });
    }

    res.json({ sparePart });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createSparePart = async (req: AuthRequest, res: Response) => {
  try {
    const { name, costPrice, sellingPrice, price, quantity = 1, supplier } = req.body;

    // Check if spare part with same name already exists
    const existingSparePart = await SparePart.findOne({ 
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
      isActive: true 
    });

    if (existingSparePart) {
      return res.status(400).json({ 
        message: 'Bu nom bilan zapchast allaqachon mavjud',
        existingSparePart 
      });
    }

    const sparePart = new SparePart({
      name: name.trim(),
      costPrice: costPrice || price, // Backward compatibility
      sellingPrice: sellingPrice || price, // Backward compatibility
      price: sellingPrice || price, // Deprecated field
      quantity,
      supplier: supplier ? supplier.trim() : '' // Ixtiyoriy
    });

    await sparePart.save();

    res.status(201).json({
      message: 'Zapchast muvaffaqiyatli yaratildi',
      sparePart
    });
  } catch (error: any) {
    console.error('Error creating spare part:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Zapchast + Chiqim yaratish (Kassa sahifasidan)
export const createSparePartWithExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { name, costPrice, sellingPrice, price, quantity = 1, supplier, paymentMethod = 'cash' } = req.body;
    const Transaction = require('../models/Transaction').default;

    // Check if spare part with same name already exists
    const existingSparePart = await SparePart.findOne({ 
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
      isActive: true 
    });

    if (existingSparePart) {
      return res.status(400).json({ 
        message: 'Bu nom bilan zapchast allaqachon mavjud',
        existingSparePart 
      });
    }

    // Zapchast yaratish
    const sparePart = new SparePart({
      name: name.trim(),
      costPrice: costPrice || price,
      sellingPrice: sellingPrice || price,
      price: sellingPrice || price,
      quantity,
      supplier: supplier ? supplier.trim() : ''
    });

    await sparePart.save();

    // Chiqim yaratish
    const totalAmount = (costPrice || price) * quantity;
    const supplierText = supplier && supplier.trim() ? `\nYetkazib beruvchi: ${supplier.trim()}` : '';
    const description = `Zapchast sotib olindi: ${name.trim()}
Miqdor: ${quantity} dona
Birlik narxi: ${(costPrice || price).toLocaleString()} so'm
Jami: ${totalAmount.toLocaleString()} so'm${supplierText}`;

    const transaction = new Transaction({
      type: 'expense',
      category: 'spare_part_purchase',
      amount: totalAmount,
      description: description,
      paymentMethod: paymentMethod,
      createdBy: req.user!._id
    });

    await transaction.save();

    res.status(201).json({
      message: 'Zapchast va chiqim muvaffaqiyatli yaratildi',
      sparePart,
      transaction
    });
  } catch (error: any) {
    console.error('Error creating spare part with expense:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateSparePart = async (req: AuthRequest, res: Response) => {
  try {
    const { name, costPrice, sellingPrice, price, quantity, supplier } = req.body;
    
    const sparePart = await SparePart.findById(req.params.id);
    
    if (!sparePart) {
      return res.status(404).json({ message: 'Spare part not found' });
    }

    // Check if name is being changed and if new name already exists
    if (name && name.trim() !== sparePart.name) {
      const existingSparePart = await SparePart.findOne({ 
        name: { $regex: `^${name.trim()}$`, $options: 'i' },
        _id: { $ne: req.params.id },
        isActive: true 
      });

      if (existingSparePart) {
        return res.status(400).json({ 
          message: 'Bu nom bilan zapchast allaqachon mavjud' 
        });
      }
    }

    // Update fields
    if (name) sparePart.name = name.trim();
    if (costPrice !== undefined) sparePart.costPrice = costPrice;
    if (sellingPrice !== undefined) sparePart.sellingPrice = sellingPrice;
    if (price !== undefined) {
      // Backward compatibility - if only price is provided
      if (costPrice === undefined && sellingPrice === undefined) {
        sparePart.costPrice = price;
        sparePart.sellingPrice = price;
      }
      sparePart.price = sellingPrice || price;
    }
    if (quantity !== undefined) sparePart.quantity = quantity;
    if (supplier !== undefined) sparePart.supplier = supplier ? supplier.trim() : '';

    await sparePart.save();

    // To'liq ma'lumotni qaytarish - barcha maydonlar bilan
    const updatedSparePart = await SparePart.findById(sparePart._id)
      .select('_id name costPrice sellingPrice price quantity supplier usageCount isActive createdAt updatedAt')
      .lean()
      .exec();

    res.json({
      message: 'Zapchast muvaffaqiyatli yangilandi',
      sparePart: updatedSparePart
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteSparePart = async (req: AuthRequest, res: Response) => {
  try {
    const sparePart = await SparePart.findById(req.params.id);
    
    if (!sparePart) {
      return res.status(404).json({ message: 'Spare part not found' });
    }

    // Soft delete - just mark as inactive
    sparePart.isActive = false;
    await sparePart.save();

    res.json({
      message: 'Zapchast muvaffaqiyatli o\'chirildi'
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const incrementUsage = async (req: AuthRequest, res: Response) => {
  try {
    const sparePart = await SparePart.findByIdAndUpdate(
      req.params.id,
      { $inc: { usageCount: 1 } },
      { new: true }
    );

    if (!sparePart) {
      return res.status(404).json({ message: 'Spare part not found' });
    }

    res.json({ sparePart });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Avtomobillarning "keltirish kerak" zapchastlarini olish
export const getRequiredParts = async (req: AuthRequest, res: Response) => {
  try {
    const Car = require('../models/Car').default;
    
    // Barcha avtomobillarni olish va faqat "tobring" source'li qismlarni filter qilish
    const cars = await Car.find({
      'parts.source': 'tobring',
      status: { $ne: 'delivered' } // Yetkazilgan avtomobillarni chiqarib tashlash
    }).select('make carModel licensePlate ownerName ownerPhone parts status');

    // Har bir avtomobilning "tobring" qismlarini ajratib olish
    const requiredParts = cars.flatMap((car: any) => 
      car.parts
        .filter((part: any) => part.source === 'tobring')
        .map((part: any) => ({
          _id: part._id,
          name: part.name,
          price: part.price,
          quantity: part.quantity,
          status: part.status,
          car: {
            _id: car._id,
            make: car.make,
            carModel: car.carModel,
            licensePlate: car.licensePlate,
            ownerName: car.ownerName,
            ownerPhone: car.ownerPhone,
            status: car.status
          }
        }))
    );

    res.json({ requiredParts });
  } catch (error: any) {
    console.error('Error fetching required parts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// "Keltirish kerak" qismni o'chirish
export const removeRequiredPart = async (req: AuthRequest, res: Response) => {
  try {
    const { carId, partId } = req.params;
    const Car = require('../models/Car').default;
    
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Qismni o'chirish
    car.parts = car.parts.filter((part: any) => part._id.toString() !== partId);
    await car.save();

    res.json({
      message: 'Required part removed successfully',
      car
    });
  } catch (error: any) {
    console.error('Error removing required part:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// "Keltirish kerak" qismni ombordagi zapchastga qo'shish
export const addRequiredPartToInventory = async (req: AuthRequest, res: Response) => {
  try {
    const { carId, partId } = req.params;
    const { supplier } = req.body;
    const Car = require('../models/Car').default;
    
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Qismni topish
    const part = car.parts.find((p: any) => p._id.toString() === partId);
    if (!part) {
      return res.status(404).json({ message: 'Part not found' });
    }

    // Ombordagi zapchastlarni tekshirish - mavjud bo'lsa miqdorni oshirish
    const existingSparePart = await SparePart.findOne({ name: part.name });
    
    if (existingSparePart) {
      existingSparePart.quantity += part.quantity;
      await existingSparePart.save();
    } else {
      // Yangi zapchast yaratish
      const newSparePart = new SparePart({
        name: part.name,
        price: part.price,
        costPrice: part.price,
        sellingPrice: part.price,
        quantity: part.quantity,
        supplier: supplier || 'Client',
        createdBy: req.user!._id
      });
      await newSparePart.save();
    }

    // Avtomobildan qismni o'chirish
    car.parts = car.parts.filter((p: any) => p._id.toString() !== partId);
    await car.save();

    res.json({
      message: 'Part added to inventory successfully',
      car
    });
  } catch (error: any) {
    console.error('Error adding part to inventory:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Zapchast sotish
export const sellSparePart = async (req: AuthRequest, res: Response) => {
  try {
    const { sparePartId, quantity, sellingPrice, customerName, customerPhone, notes } = req.body;

    // Zapchastni topish
    const sparePart = await SparePart.findById(sparePartId);
    if (!sparePart) {
      return res.status(404).json({ message: 'Zapchast topilmadi' });
    }

    // Miqdorni tekshirish
    if (sparePart.quantity < quantity) {
      return res.status(400).json({ 
        message: `Omborda yetarli miqdor yo'q. Mavjud: ${sparePart.quantity} dona` 
      });
    }

    // Sotish narxini tekshirish
    const finalSellingPrice = sellingPrice || sparePart.sellingPrice;

    // Hisob-kitoblar
    const totalCost = sparePart.costPrice * quantity;
    const totalRevenue = finalSellingPrice * quantity;
    const profit = totalRevenue - totalCost;

    // Sotuvni saqlash
    const sale = new SparePartSale({
      sparePartId: sparePart._id,
      sparePartName: sparePart.name,
      quantity,
      costPrice: sparePart.costPrice,
      sellingPrice: finalSellingPrice,
      totalCost,
      totalRevenue,
      profit,
      soldBy: req.user!._id,
      soldByName: req.user!.name,
      customerName,
      customerPhone,
      notes
    });

    await sale.save();

    // Ombordagi miqdorni kamaytirish
    sparePart.quantity -= quantity;
    await sparePart.save();

    res.status(201).json({
      message: 'Zapchast muvaffaqiyatli sotildi',
      sale,
      remainingQuantity: sparePart.quantity
    });
  } catch (error: any) {
    console.error('Error selling spare part:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Sotuvlar statistikasi
export const getSalesStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, sparePartId } = req.query;

    const filter: any = {};

    // Sana filtri
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    // Zapchast filtri
    if (sparePartId) {
      filter.sparePartId = sparePartId;
    }

    // Statistikani hisoblash - faqat kerakli ma'lumotlar
    const stats = await SparePartSale.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalQuantitySold: { $sum: '$quantity' },
          totalRevenue: { $sum: '$totalRevenue' },
          totalProfit: { $sum: '$profit' }
        }
      }
    ]);

    const statistics = stats[0] || {
      totalSales: 0,
      totalQuantitySold: 0,
      totalRevenue: 0,
      totalProfit: 0
    };

    // HTTP cache headers - 60 sekund cache
    res.set({
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
      'ETag': `W/"${Date.now()}"`,
    });

    res.json({ statistics });
  } catch (error: any) {
    console.error('Error fetching sales statistics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Sotuvlar ro'yxati
export const getSales = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 50,
      startDate,
      endDate,
      sparePartId,
      soldBy
    } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};

    // Sana filtri
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    // Zapchast filtri
    if (sparePartId) {
      filter.sparePartId = sparePartId;
    }

    // Sotuvchi filtri
    if (soldBy) {
      filter.soldBy = soldBy;
    }

    const [sales, total] = await Promise.all([
      SparePartSale.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      SparePartSale.countDocuments(filter)
    ]);

    res.json({
      sales,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
