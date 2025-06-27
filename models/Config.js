// models/Config.js
import mongoose from 'mongoose';

const ConfigSchema = new mongoose.Schema({
  websiteName: { type: String, required: true },
  logoURL: { type: String, required: false },
});

export default mongoose.models.Config || mongoose.model('Config', ConfigSchema);
