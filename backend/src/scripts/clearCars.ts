import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Car from '../models/Car';
import { connectDatabase } from '../config/database';

// Load environment variables
dotenv.config();

const clearCars = async () => {
  try {
    console.log('🔗 MongoDB ga ulanmoqda...');
    await connectDatabase();
    
    console.log('🗑️ Barcha mashinalar o\'chirilmoqda...');
    const result = await Car.deleteMany({});
    
    console.log(`✅ ${result.deletedCount} ta mashina o'chirildi`);
    console.log('🎉 Mashinalar muvaffaqiyatli o\'chirildi!');
    
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection yopildi');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
};

clearCars();