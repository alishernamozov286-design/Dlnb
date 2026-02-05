import mongoose from 'mongoose';
import User from '../models/User';
import Task from '../models/Task';
import dotenv from 'dotenv';

dotenv.config();

const resetApprenticeData = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/autoservice';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB ga ulandi\n');

    // Barcha shogirdlarni topish
    const apprentices = await User.find({ role: 'apprentice' });
    console.log(`📊 Jami ${apprentices.length} ta shogird topildi\n`);

    if (apprentices.length === 0) {
      console.log('❌ Shogirdlar topilmadi');
      process.exit(0);
    }

    console.log('🔄 SHOGIRDLAR MA\'LUMOTLARI:\n');
    
    // Har bir shogird uchun ma'lumotlarni ko'rsatish
    for (const apprentice of apprentices) {
      const tasks = await Task.countDocuments({ 
        'assignedTo': apprentice._id 
      });
      
      console.log(`👤 ${apprentice.name}`);
      console.log(`   Joriy daromad: ${apprentice.earnings || 0} so'm`);
      console.log(`   Jami daromad: ${apprentice.totalEarnings || 0} so'm`);
      console.log(`   Vazifalar soni: ${tasks} ta\n`);
    }

    // Tasdiqlash
    console.log('⚠️  DIQQAT: Quyidagi ma\'lumotlar o\'chiriladi:');
    console.log('   - Barcha shogirdlarning daromadlari (earnings va totalEarnings)');
    console.log('   - Barcha vazifalar (tasks)\n');

    // Daromadlarni 0 ga o'rnatish
    console.log('🔄 Daromadlar 0 ga o\'rnatilmoqda...');
    const updateResult = await User.updateMany(
      { role: 'apprentice' },
      { 
        $set: { 
          earnings: 0,
          totalEarnings: 0
        } 
      }
    );
    console.log(`✅ ${updateResult.modifiedCount} ta shogirdning daromadi 0 ga o'rnatildi\n`);

    // Vazifalarni o'chirish
    console.log('🗑️  Vazifalar o\'chirilmoqda...');
    const deleteResult = await Task.deleteMany({});
    console.log(`✅ ${deleteResult.deletedCount} ta vazifa o'chirildi\n`);

    // Natijani ko'rsatish
    console.log('✅ YAKUNIY NATIJA:\n');
    const updatedApprentices = await User.find({ role: 'apprentice' });
    
    for (const apprentice of updatedApprentices) {
      const tasks = await Task.countDocuments({ 
        'assignedTo': apprentice._id 
      });
      
      console.log(`👤 ${apprentice.name}`);
      console.log(`   Joriy daromad: ${apprentice.earnings} so'm`);
      console.log(`   Jami daromad: ${apprentice.totalEarnings} so'm`);
      console.log(`   Vazifalar soni: ${tasks} ta\n`);
    }

    console.log('✅ Ma\'lumotlar muvaffaqiyatli o\'chirildi!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
};

resetApprenticeData();
