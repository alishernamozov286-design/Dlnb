import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Car from '../models/Car';
import Task from '../models/Task';
import Service from '../models/Service';
import SparePart from '../models/SparePart';
import Debt from '../models/Debt';
import Transaction from '../models/Transaction';
import ExpenseCategory from '../models/ExpenseCategory';
import CarService from '../models/CarService';
import ChatMessage from '../models/ChatMessage';
import KnowledgeBase from '../models/KnowledgeBase';
import Subscription from '../models/Subscription';
import TelegramUser from '../models/TelegramUser';
import DeviceInstall from '../models/DeviceInstall';
import dotenv from 'dotenv';

// .env faylini yuklash
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mator-life';

async function resetDatabase() {
  try {
    console.log('🔄 Ma\'lumotlar bazasiga ulanmoqda...');
    
    // MongoDB ga ulanish
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Ma\'lumotlar bazasiga muvaffaqiyatli ulandi');

    console.log('🗑️  Barcha kolleksiyalarni tozalamoqda...');

    // Barcha kolleksiyalarni tozalash
    await User.deleteMany({});
    console.log('   ✅ User kolleksiyasi tozalandi');
    
    await Car.deleteMany({});
    console.log('   ✅ Car kolleksiyasi tozalandi');
    
    await Task.deleteMany({});
    console.log('   ✅ Task kolleksiyasi tozalandi');
    
    await Service.deleteMany({});
    console.log('   ✅ Service kolleksiyasi tozalandi');
    
    await SparePart.deleteMany({});
    console.log('   ✅ SparePart kolleksiyasi tozalandi');
    
    await Debt.deleteMany({});
    console.log('   ✅ Debt kolleksiyasi tozalandi');
    
    await Transaction.deleteMany({});
    console.log('   ✅ Transaction kolleksiyasi tozalandi');
    
    await ExpenseCategory.deleteMany({});
    console.log('   ✅ ExpenseCategory kolleksiyasi tozalandi');
    
    await CarService.deleteMany({});
    console.log('   ✅ CarService kolleksiyasi tozalandi');
    
    await ChatMessage.deleteMany({});
    console.log('   ✅ ChatMessage kolleksiyasi tozalandi');
    
    await KnowledgeBase.deleteMany({});
    console.log('   ✅ KnowledgeBase kolleksiyasi tozalandi');
    
    await Subscription.deleteMany({});
    console.log('   ✅ Subscription kolleksiyasi tozalandi');
    
    await TelegramUser.deleteMany({});
    console.log('   ✅ TelegramUser kolleksiyasi tozalandi');
    
    await DeviceInstall.deleteMany({});
    console.log('   ✅ DeviceInstall kolleksiyasi tozalandi');

    console.log('👤 Master foydalanuvchini yaratmoqda...');

    // Master foydalanuvchini yaratish
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const masterUser = new User({
      name: 'Master Admin',
      email: 'master@biznes.com',
      username: 'master',
      password: hashedPassword,
      role: 'master',
      earnings: 0,
      profession: 'Avtomobil ustasi',
      experience: 10
    });

    await masterUser.save();
    console.log('✅ Master foydalanuvchi yaratildi:');
    console.log('   📧 Email: master@biznes.com');
    console.log('   👤 Username: master');
    console.log('   🔑 Password: 123456');
    console.log('   🎭 Role: master');

    console.log('📋 Asosiy xarajat kategoriyalarini yaratmoqda...');

    // Asosiy xarajat kategoriyalari
    const expenseCategories = [
      {
        name: 'Zapchastlar',
        nameUz: 'Запчастлар',
        description: 'Avtomobil zapchastlari xarajatlari',
        color: 'blue',
        icon: 'Package',
        isDefault: true,
        isActive: true
      },
      {
        name: 'Maoshlar',
        nameUz: 'Маошлар',
        description: 'Xodimlar maoshi va to\'lovlari',
        color: 'green',
        icon: 'Users',
        isDefault: true,
        isActive: true
      },
      {
        name: 'Ijara',
        nameUz: 'Ижара',
        description: 'Bino va jihozlar ijarasi',
        color: 'yellow',
        icon: 'Home',
        isDefault: true,
        isActive: true
      },
      {
        name: 'Kommunal xizmatlar',
        nameUz: 'Коммунал хизматлар',
        description: 'Elektr, suv, gaz to\'lovlari',
        color: 'red',
        icon: 'Zap',
        isDefault: true,
        isActive: true
      },
      {
        name: 'Transport',
        nameUz: 'Транспорт',
        description: 'Transport xarajatlari va yoqilg\'i',
        color: 'purple',
        icon: 'Car',
        isDefault: true,
        isActive: true
      },
      {
        name: 'Boshqa',
        nameUz: 'Бошқа',
        description: 'Boshqa xarajatlar',
        color: 'gray',
        icon: 'DollarSign',
        isDefault: false,
        isActive: true
      }
    ];

    for (const category of expenseCategories) {
      const expenseCategory = new ExpenseCategory({
        ...category,
        createdBy: masterUser._id
      });
      await expenseCategory.save();
    }

    console.log('✅ Xarajat kategoriyalari yaratildi');

    console.log('🎉 Ma\'lumotlar bazasi muvaffaqiyatli qayta tiklandi!');
    console.log('');
    console.log('📝 Kirish ma\'lumotlari:');
    console.log('   🌐 URL: http://localhost:5178');
    console.log('   👤 Username: master');
    console.log('   🔑 Password: 123456');
    console.log('');
    console.log('💡 Eslatma: Parolni o\'zgartirishni unutmang!');

  } catch (error) {
    console.error('❌ Xatolik yuz berdi:', error);
  } finally {
    // Ma'lumotlar bazasi ulanishini yopish
    await mongoose.disconnect();
    console.log('🔌 Ma\'lumotlar bazasi ulanishi yopildi');
    process.exit(0);
  }
}

// Skriptni ishga tushirish
if (require.main === module) {
  resetDatabase();
}

export default resetDatabase;