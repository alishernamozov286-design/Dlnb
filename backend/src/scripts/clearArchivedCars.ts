import mongoose from 'mongoose';
import Car from '../models/Car';
import dotenv from 'dotenv';

// .env faylini yuklash
dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/biznes';

async function clearArchivedCars() {
  try {
    console.log('🔄 MongoDB ga ulanmoqda...');
    
    // MongoDB ga ulanish
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB ga muvaffaqiyatli ulandi');

    // Arxivlangan mashinalarni topish
    const archivedCars = await Car.find({ archived: true });
    console.log(`📊 Jami ${archivedCars.length} ta arxivlangan mashina topildi`);

    if (archivedCars.length === 0) {
      console.log('ℹ️ Arxivlangan mashinalar yo\'q');
      return;
    }

    // Arxivlangan mashinalarni o'chirish
    console.log('🗑️ Arxivlangan mashinalarni o\'chirmoqda...');
    const result = await Car.deleteMany({ archived: true });
    
    console.log('');
    console.log('✅ MUVAFFAQIYATLI!');
    console.log(`🗑️ ${result.deletedCount} ta arxivlangan mashina o'chirildi`);
    console.log('');

  } catch (error) {
    console.error('❌ Xatolik yuz berdi:', error);
  } finally {
    // Ma'lumotlar bazasi ulanishini yopish
    await mongoose.disconnect();
    console.log('🔌 MongoDB ulanishi yopildi');
    process.exit(0);
  }
}

// Skriptni ishga tushirish
if (require.main === module) {
  clearArchivedCars();
}

export default clearArchivedCars;
