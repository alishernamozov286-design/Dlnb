import mongoose from 'mongoose';
import Car from '../models/Car';
import dotenv from 'dotenv';

dotenv.config();

const checkAllCars = async () => {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mator-life');
    console.log('✅ Connected to database');

    // Barcha mashinalarni topish
    const allCars = await Car.find({});
    console.log(`\n📊 Total cars in database: ${allCars.length}`);

    // Status bo'yicha guruhlash
    const statusGroups: Record<string, any[]> = {};
    allCars.forEach(car => {
      const status = car.status || 'unknown';
      if (!statusGroups[status]) {
        statusGroups[status] = [];
      }
      statusGroups[status].push(car);
    });

    console.log('\n📋 Cars by status:');
    Object.keys(statusGroups).forEach(status => {
      console.log(`\n${status.toUpperCase()}: ${statusGroups[status].length} cars`);
      statusGroups[status].forEach((car, index) => {
        console.log(`  ${index + 1}. ${car.make} ${car.carModel} - ${car.licensePlate} (Owner: ${car.ownerName})`);
      });
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking cars:', error);
    process.exit(1);
  }
};

checkAllCars();
