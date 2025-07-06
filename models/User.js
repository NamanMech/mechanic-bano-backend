// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  picture: String,
  isSubscribed: { type: Boolean, default: false },
  subscriptionEnd: { type: Date, default: null }
});

export default mongoose.models.User || mongoose.model('User', userSchema);
