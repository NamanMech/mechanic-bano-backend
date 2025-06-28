import mongoose from 'mongoose';

const configSchema = new mongoose.Schema({
  websiteName: String,
  logoURL: String,
});

export default mongoose.models.Config || mongoose.model('Config', configSchema);
