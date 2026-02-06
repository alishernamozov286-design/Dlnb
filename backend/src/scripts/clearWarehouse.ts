import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SparePart from '../models/SparePart';
import SparePartSale from '../models/SparePartSale';

dotenv.config();

const clearWarehouse = async () => {
  try {
    console.log('🔌 MongoDB ga ulanmoqda...');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dalnaboyshop');
    
    console.log('✅ MongoDB ga ulandi');
    console.log('');
    
    // Sotuvlarni o'chirish
    console.log('🗑️  Sotuvlarni o\'chirish...');
    const salesResult = await SparePartSale.deleteMany({});
    console.log(`✅ ${salesResult.deletedCount} ta sotuv o'chirildi`);
    console.log('');
    
    // Tovarlarni o'chirish
    console.log('🗑️  Tovarlarni o\'chirish...');
    const partsResult = await SparePart.deleteMany({});
    console.log(`✅ ${partsResult.deletedCount} ta tovar o'chirildi`);
    console.log('');
    
    console.log('✅ Ombor to\'liq tozalandi!');
    console.log('');
    console.log('📊 Natija:');
    console.log(`   - Sotuvlar: ${salesResult.deletedCount} ta o'chirildi`);
    console.log(`   - Tovarlar: ${partsResult.deletedCount} ta o'chirildi`);
    
    await mongoose.connection.close();
    console.log('');
    console.log('🔌 MongoDB ulanishi yopildi');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
};

clearWarehouse();
