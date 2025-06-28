// config/dbConnect.js

import mongoose from 'mongoose';

const dbConnect = async () => {
  if (mongoose.connections[0].readyState) return;

  await mongoose.connect(process.env.MONGO_URI);
};

export default dbConnect;
