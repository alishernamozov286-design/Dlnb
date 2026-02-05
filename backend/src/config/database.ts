import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/biznes';
    
    console.log('🔄 MongoDB ga ulanish boshlandi...');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB ga muvaffaqiyatli ulandi!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🔗 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  // MongoDB disconnected
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB error:', error);
});