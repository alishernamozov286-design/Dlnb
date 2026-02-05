import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { connectDatabase } from '../config/database';
import User from '../models/User';
import Car from '../models/Car';

dotenv.config();

/**
 * Migration script to add clientId to existing records
 * Run this once to prepare existing data for offline sync
 */
async function addClientIdToExisting() {
  try {
    await connectDatabase();
    console.log('✅ Connected to database');

    // Update Users (apprentices)
    const usersWithoutClientId = await User.find({ clientId: { $exists: false } });
    console.log(`\n📝 Found ${usersWithoutClientId.length} users without clientId`);

    for (const user of usersWithoutClientId) {
      user.clientId = uuidv4();
      await user.save();
      console.log(`✅ Added clientId to user: ${user.name} (${user.clientId})`);
    }

    // Update Cars
    const carsWithoutClientId = await Car.find({ clientId: { $exists: false } });
    console.log(`\n📝 Found ${carsWithoutClientId.length} cars without clientId`);

    for (const car of carsWithoutClientId) {
      car.clientId = uuidv4();
      await car.save();
      console.log(`✅ Added clientId to car: ${car.licensePlate} (${car.clientId})`);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log(`\nSummary:`);
    console.log(`- Users updated: ${usersWithoutClientId.length}`);
    console.log(`- Cars updated: ${carsWithoutClientId.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addClientIdToExisting();
