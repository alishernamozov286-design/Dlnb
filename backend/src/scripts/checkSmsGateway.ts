import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SmsGateway from '../models/SmsGateway';

dotenv.config();

const checkSmsGateway = async () => {
  try {
    console.log('🔍 SMS Gateway tekshirilmoqda...\n');

    // MongoDB'ga ulanish
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/car-repair');
    console.log('✅ MongoDB\'ga ulandi\n');

    // Barcha gateway'larni ko'rish
    const allGateways = await SmsGateway.find();
    console.log(`📊 Jami gateway'lar: ${allGateways.length}\n`);

    if (allGateways.length === 0) {
      console.log('❌ Hech qanday SMS Gateway topilmadi!');
      console.log('💡 Yangi gateway yaratish uchun:');
      console.log('   1. SuperAdmin panelga kiring');
      console.log('   2. SMS Gateway > Gateway\'lar > Yangi Gateway qo\'shish\n');
    } else {
      allGateways.forEach((gateway, index) => {
        console.log(`Gateway #${index + 1}:`);
        console.log(`  Nomi: ${gateway.name}`);
        console.log(`  Token: ${gateway.token}`);
        console.log(`  SIM: ${gateway.simNumber || 'Kiritilmagan'}`);
        console.log(`  Faol: ${gateway.isActive ? '✅ Ha' : '❌ Yo\'q'}`);
        console.log(`  Oxirgi heartbeat: ${gateway.lastHeartbeat ? gateway.lastHeartbeat.toLocaleString() : 'Hech qachon'}`);
        console.log(`  Yuborilgan SMS'lar: ${gateway.messagesSent}`);
        
        // Online/Offline tekshirish
        if (gateway.lastHeartbeat) {
          const timeDiff = Date.now() - gateway.lastHeartbeat.getTime();
          const isOnline = timeDiff < 60000; // 1 daqiqadan kam
          console.log(`  Status: ${isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
          if (!isOnline) {
            console.log(`  ⚠️ Oxirgi faollik: ${Math.floor(timeDiff / 1000)} soniya oldin`);
          }
        } else {
          console.log(`  Status: 🔴 OFFLINE (hech qachon ulanmagan)`);
        }
        console.log('');
      });
    }

    // Faol va online gateway'ni tekshirish
    const activeGateway = await SmsGateway.findOne({
      isActive: true,
      lastHeartbeat: { $gte: new Date(Date.now() - 60000) }
    });

    if (activeGateway) {
      console.log('✅ SMS yuborish uchun tayyor gateway mavjud!');
      console.log(`   Gateway: ${activeGateway.name}\n`);
    } else {
      console.log('❌ SMS yuborish uchun tayyor gateway yo\'q!');
      console.log('💡 Android ilovani ishga tushiring va serverni ulang.\n');
    }

    await mongoose.connection.close();
    console.log('✅ Tekshirish tugadi');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Xatolik:', error.message);
    process.exit(1);
  }
};

checkSmsGateway();
