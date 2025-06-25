
import mongoose from 'mongoose';

const ConfigSchema = new mongoose.Schema({
  siteName: String,
  logoUrl: String
});

export default mongoose.models.Config || mongoose.model('Config', ConfigSchema);
