import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const updateApprenticePercentage = async () => {
  try {
    console.log('🔌 MongoDB ga ulanish...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/biznes');
    console.log('✅ MongoDB ga ulandi\n');

    // Narzullo shogirdni topish
    const apprentice = await User.findOne({ username: 'narzullo' });
    
    if (!apprentice) {
      console.log('❌ Shogird topilmadi!');
      return;
    }

    console.log('📋 ESKI MA\'LUMOTLAR:');
    console.log(`Ism: ${apprentice.name}`);
    console.log(`Username: @${apprentice.username}`);
    console.log(`Foiz: ${apprentice.percentage || 50}%`);
    
    // Foizni 80% ga o'zgartirish
    apprentice.percentage = 80;
    await apprentice.save();
    
    console.log('\n✅ YANGILANDI:');
    console.log(`Yangi foiz: ${apprentice.percentage}%`);
    
    console.log('\n💡 Endi vazifa yaratilganda Narzullo 80% oladi!');
    
  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB dan uzildi');
  }
};

updateApprenticePercentage();
