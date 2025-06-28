// models/Config.js
import mongoose from 'mongoose';

const configSchema = new mongoose.Schema({
  websiteName: {
    type: String,
    required: true,
    default: 'Mechanic Bano'
  }
});

export default mongoose.models.Config || mongoose.model('Config', configSchema);
