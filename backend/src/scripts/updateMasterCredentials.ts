import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import dotenv from 'dotenv';

// .env faylini yuklash
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mator-life';

async function updateMasterCredentials() {
  try {
    console.log('🔄 Ma\'lumotlar bazasiga ulanmoqda...');
    
    // MongoDB ga ulanish
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Ma\'lumotlar bazasiga muvaffaqiyatli ulandi');

    console.log('🔍 Master foydalanuvchini qidirmoqda...');

    // Mavjud master foydalanuvchini topish
    const existingMaster = await User.findOne({ role: 'master' });
    
    if (!existingMaster) {
      console.log('❌ Master foydalanuvchi topilmadi!');
      return;
    }

    console.log('📝 Master foydalanuvchi ma\'lumotlarini yangilamoqda...');

    // Yangi parolni hash qilish
    const hashedPassword = await bcrypt.hash('S@rdor93', 10);
    
    // Master foydalanuvchi ma'lumotlarini yangilash
    existingMaster.name = 'Sardor Safarov';
    existingMaster.email = 'sardor.safarov@biznes.com';
    existingMaster.username = 'sardor';
    existingMaster.password = hashedPassword;
    existingMaster.profession = 'Avtomobil ustasi';
    existingMaster.experience = 15;

    await existingMaster.save();

    console.log('✅ Master foydalanuvchi muvaffaqiyatli yangilandi!');
    console.log('');
    console.log('📝 Yangi kirish ma\'lumotlari:');
    console.log('   👤 Ism: Sardor Safarov');
    console.log('   📧 Email: sardor.safarov@biznes.com');
    console.log('   👤 Username: sardor');
    console.log('   🔑 Password: S@rdor93');
    console.log('   🎭 Role: master');
    console.log('   💼 Kasb: Avtomobil ustasi');
    console.log('   📅 Tajriba: 15 yil');
    console.log('');
    console.log('🌐 Kirish uchun:');
    console.log('   URL: http://localhost:5178');
    console.log('   Username: sardor');
    console.log('   Password: S@rdor93');

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
  updateMasterCredentials();
}

export default updateMasterCredentials;