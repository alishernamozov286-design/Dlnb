import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ExpenseCategory from '../models/ExpenseCategory';
import User from '../models/User';

// Load environment variables
dotenv.config();

const initializeExpenseCategories = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/biznes');
    console.log('✅ MongoDB ga ulanish muvaffaqiyatli');

    // Find a master user to assign as creator
    const masterUser = await User.findOne({ role: 'master' });
    if (!masterUser) {
      console.log('❌ Master foydalanuvchi topilmadi. Avval master yarating.');
      process.exit(1);
    }

    // Check if default categories already exist
    const existingCount = await ExpenseCategory.countDocuments({ isDefault: true });
    if (existingCount > 0) {
      console.log(`✅ ${existingCount} ta standart kategoriya allaqachon mavjud`);
      process.exit(0);
    }

    // Default categories
    const defaultCategories = [
      {
        name: 'Purchase',
        nameUz: 'Tovar sotib olish',
        description: 'Ehtiyot qismlar, materiallar va asboblar sotib olish',
        icon: 'ShoppingCart',
        color: 'blue',
        isDefault: true,
        createdBy: masterUser._id
      },
      {
        name: 'Rent',
        nameUz: 'Ijara',
        description: 'Bino, yer va jihozlar ijarasi to\'lovi',
        icon: 'Home',
        color: 'green',
        isDefault: true,
        createdBy: masterUser._id
      },
      {
        name: 'Utilities',
        nameUz: 'Kommunal to\'lovlar',
        description: 'Elektr, gaz, suv va internet to\'lovlari',
        icon: 'Zap',
        color: 'yellow',
        isDefault: true,
        createdBy: masterUser._id
      },
      {
        name: 'Salaries',
        nameUz: 'Oyliklar',
        description: 'Xodimlar maoshi va bonuslar to\'lovi',
        icon: 'Users',
        color: 'purple',
        isDefault: true,
        createdBy: masterUser._id
      }
    ];

    // Create categories
    const categories = await ExpenseCategory.insertMany(defaultCategories);
    console.log(`🎯 ${categories.length} ta standart xarajat kategoriyasi yaratildi:`);
    
    categories.forEach(category => {
      console.log(`   - ${category.nameUz} (${category.name})`);
    });

    console.log('✅ Standart kategoriyalar muvaffaqiyatli yaratildi!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
};

// Run the script
initializeExpenseCategories();