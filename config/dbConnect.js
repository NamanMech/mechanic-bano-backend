// config/dbConnect.js
import mongoose from 'mongoose';

const dbConnect = async () => {
  if (mongoose.connections[0].readyState) return;

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database Connected');
  } catch (error) {
    console.error('Database Connection Failed:', error);
  }
};

export default dbConnect;
