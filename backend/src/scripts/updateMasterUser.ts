import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const updateMasterUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);

    const masterData = {
      name: 'Sardor Safarov',
      username: 'Sardor Safarov',
      password: 'S@rdor93',
      role: 'master'
    };

    let master = await User.findOne({ role: 'master' });

    if (master) {
      master.name = masterData.name;
      master.username = masterData.username;
      master.password = masterData.password;
      await master.save();
    } else {
      master = new User(masterData);
      await master.save();
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updateMasterUser();
