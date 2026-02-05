import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from '../models/Booking';

dotenv.config();

const checkBookings = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('✅ MongoDB ga ulandi');

    const bookings = await Booking.find({});
    
    console.log('\n=== BARCHA BRONLAR ===');
    bookings.forEach((booking, index) => {
      console.log(`\n${index + 1}. ${booking.customerName}`);
      console.log('   Telefon:', booking.phoneNumber);
      console.log('   Mashina:', booking.licensePlate);
      console.log('   Sana (raw):', booking.bookingDate);
      console.log('   Sana (ISO):', booking.bookingDate.toISOString());
      console.log('   Status:', booking.status);
      
      const date = new Date(booking.bookingDate);
      console.log('   Yil:', date.getFullYear());
      console.log('   Oy:', date.getMonth() + 1);
      console.log('   Kun:', date.getDate());
      console.log('   Soat:', date.getHours());
      console.log('   Daqiqa:', date.getMinutes());
    });

    await mongoose.connection.close();
    console.log('\n✅ Tekshiruv tugadi');
  } catch (error) {
    console.error('❌ Xatolik:', error);
  }
};

checkBookings();
