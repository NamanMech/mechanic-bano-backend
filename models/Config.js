import mongoose from 'mongoose';

const ConfigSchema = new mongoose.Schema({
  websiteName: String,
  logoURL: String,
});

export default mongoose.models.Config || mongoose.model('Config', ConfigSchema);
