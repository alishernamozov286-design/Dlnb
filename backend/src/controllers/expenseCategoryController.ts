import { Response } from 'express';
import ExpenseCategory from '../models/ExpenseCategory';
import { AuthRequest } from '../middleware/auth';

// Get all expense categories
export const getExpenseCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await ExpenseCategory.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ isDefault: -1, createdAt: -1 });

    res.json({ categories });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};

// Create new expense category
export const createExpenseCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, nameUz, description, icon, color } = req.body;
    const userId = req.user?.id;

    // Check if category with same name already exists
    const existingCategory = await ExpenseCategory.findOne({ 
      nameUz: nameUz.trim(),
      isActive: true 
    });

    if (existingCategory) {
      return res.status(400).json({ 
        message: 'Bu nom bilan kategoriya allaqachon mavjud' 
      });
    }

    const category = new ExpenseCategory({
      name: name?.trim() || nameUz.trim(), // name berilmasa nameUz ishlatamiz
      nameUz: nameUz.trim(),
      description: description.trim(),
      icon: icon || 'DollarSign',
      color: color || 'blue',
      isDefault: false,
      createdBy: userId
    });

    await category.save();
    await category.populate('createdBy', 'name email');

    console.log(`✅ Yangi xarajat kategoriyasi yaratildi: ${category.nameUz} - ${req.user?.name}`);

    res.status(201).json({
      message: 'Xarajat kategoriyasi muvaffaqiyatli yaratildi',
      category
    });
  } catch (error: any) {
    console.error('❌ Kategoriya yaratishda xatolik:', error);
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};

// Update expense category
export const updateExpenseCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nameUz, description, icon, color } = req.body;

    const category = await ExpenseCategory.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Kategoriya topilmadi' });
    }

    // Check if it's a default category
    if (category.isDefault) {
      return res.status(400).json({ 
        message: 'Standart kategoriyalarni o\'zgartirib bo\'lmaydi' 
      });
    }

    // Check if new name already exists (excluding current category)
    if (nameUz) {
      const existingCategory = await ExpenseCategory.findOne({ 
        nameUz: nameUz.trim(),
        isActive: true,
        _id: { $ne: id }
      });

      if (existingCategory) {
        return res.status(400).json({ 
          message: 'Bu nom bilan kategoriya allaqachon mavjud' 
        });
      }
    }

    // Update category
    if (nameUz) {
      category.name = nameUz.trim(); // Inglizcha nomni ham yangilaymiz
      category.nameUz = nameUz.trim();
    }
    if (description) category.description = description.trim();
    if (icon) category.icon = icon;
    if (color) category.color = color;

    await category.save();
    await category.populate('createdBy', 'name email');

    console.log(`📝 Xarajat kategoriyasi yangilandi: ${category.nameUz}`);

    res.json({
      message: 'Kategoriya muvaffaqiyatli yangilandi',
      category
    });
  } catch (error: any) {
    console.error('❌ Kategoriya yangilashda xatolik:', error);
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};

// Delete expense category (soft delete)
export const deleteExpenseCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const category = await ExpenseCategory.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Kategoriya topilmadi' });
    }

    // Check if it's a default category
    if (category.isDefault) {
      return res.status(400).json({ 
        message: 'Standart kategoriyalarni o\'chirib bo\'lmaydi' 
      });
    }

    // Soft delete
    category.isActive = false;
    await category.save();

    console.log(`🗑️ Xarajat kategoriyasi o'chirildi: ${category.nameUz}`);

    res.json({
      message: 'Kategoriya muvaffaqiyatli o\'chirildi'
    });
  } catch (error: any) {
    console.error('❌ Kategoriya o\'chirishda xatolik:', error);
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};

// Initialize default categories
export const initializeDefaultCategories = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const defaultCategories = [
      {
        name: 'Tovar sotib olish',
        nameUz: 'Tovar sotib olish',
        description: 'Ehtiyot qismlar, materiallar va asboblar sotib olish',
        icon: 'ShoppingCart',
        color: 'blue',
        isDefault: true,
        createdBy: userId
      },
      {
        name: 'Ijara to\'lovi',
        nameUz: 'Ijara to\'lovi',
        description: 'Bino, yer va jihozlar ijarasi to\'lovi',
        icon: 'Home',
        color: 'green',
        isDefault: true,
        createdBy: userId
      },
      {
        name: 'Kommunal to\'lovlar',
        nameUz: 'Kommunal to\'lovlar',
        description: 'Elektr, gaz, suv va internet to\'lovlari',
        icon: 'Zap',
        color: 'yellow',
        isDefault: true,
        createdBy: userId
      },
      {
        name: 'Oylik maoshlar',
        nameUz: 'Oylik maoshlar',
        description: 'Xodimlar maoshi va bonuslar to\'lovi',
        icon: 'Users',
        color: 'purple',
        isDefault: true,
        createdBy: userId
      },
      {
        name: 'Transport xarajatlari',
        nameUz: 'Transport xarajatlari',
        description: 'Yoqilg\'i, ta\'mirlash va transport to\'lovlari',
        icon: 'Truck',
        color: 'indigo',
        isDefault: true,
        createdBy: userId
      },
      {
        name: 'Reklama va marketing',
        nameUz: 'Reklama va marketing',
        description: 'Reklama, marketing va tarqatish xarajatlari',
        icon: 'Megaphone',
        color: 'pink',
        isDefault: true,
        createdBy: userId
      },
      {
        name: 'Ofis jihozlari',
        nameUz: 'Ofis jihozlari',
        description: 'Ofis uchun jihozlar va materiallar',
        icon: 'Monitor',
        color: 'gray',
        isDefault: true,
        createdBy: userId
      },
      {
        name: 'Soliq to\'lovlari',
        nameUz: 'Soliq to\'lovlari',
        description: 'Davlat soliqlari va yig\'imlar to\'lovi',
        icon: 'FileText',
        color: 'red',
        isDefault: true,
        createdBy: userId
      }
    ];

    // Check if default categories already exist
    const existingCount = await ExpenseCategory.countDocuments({ isDefault: true });
    if (existingCount > 0) {
      return res.json({ 
        message: 'Standart kategoriyalar allaqachon mavjud',
        count: existingCount 
      });
    }

    // Create default categories
    const categories = await ExpenseCategory.insertMany(defaultCategories);

    console.log(`🎯 ${categories.length} ta standart kategoriya yaratildi`);

    res.json({
      message: 'Standart kategoriyalar muvaffaqiyatli yaratildi',
      categories
    });
  } catch (error: any) {
    console.error('❌ Standart kategoriyalar yaratishda xatolik:', error);
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};