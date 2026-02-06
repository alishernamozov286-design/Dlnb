import mongoose from 'mongoose';
import User from '../models/User';
import Task from '../models/Task';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Shogirtlarning pullarini va vazifalarini 0 ga tushirish
 * Bu script:
 * 1. Barcha shogirtlarning earnings va totalEarnings ni 0 ga o'zgartiradi
 * 2. Barcha vazifalarni (Tasks) o'chiradi
 */
async function resetApprenticeEarnings() {
  try {
    // MongoDB'ga ulanish
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/autoservice';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB\'ga ulandi');

    // 1. Barcha shogirtlarni topish
    const apprentices = await User.find({ role: 'apprentice' });
    console.log(`\n📊 Jami ${apprentices.length} ta shogird topildi\n`);

    // 2. Har bir shogirtning pullarini 0 ga o'zgartirish
    let resetCount = 0;
    for (const apprentice of apprentices) {
      const oldEarnings = apprentice.earnings;
      const oldTotalEarnings = apprentice.totalEarnings;

      apprentice.earnings = 0;
      apprentice.totalEarnings = 0;
      await apprentice.save();

      console.log(`✅ ${apprentice.name}:`);
      console.log(`   - Joriy oylik: ${oldEarnings} → 0 so'm`);
      console.log(`   - Jami daromad: ${oldTotalEarnings} → 0 so'm`);
      resetCount++;
    }

    console.log(`\n✅ ${resetCount} ta shogirtning pullari 0 ga tushirildi\n`);

    // 3. Barcha vazifalarni o'chirish
    const tasksCount = await Task.countDocuments();
    console.log(`📋 Jami ${tasksCount} ta vazifa topildi`);

    const deleteResult = await Task.deleteMany({});
    console.log(`🗑️  ${deleteResult.deletedCount} ta vazifa o'chirildi\n`);

    console.log('✅ Reset muvaffaqiyatli yakunlandi!');
    console.log('\n📊 Natija:');
    console.log(`   - Shogirtlar: ${resetCount} ta (pullari 0 ga tushirildi)`);
    console.log(`   - Vazifalar: ${deleteResult.deletedCount} ta (o'chirildi)`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
}

// Script'ni ishga tushirish
resetApprenticeEarnings();
