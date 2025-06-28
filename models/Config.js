import mongoose from 'mongoose';

const ConfigSchema = new mongoose.Schema({
  websiteName: { type: String, required: true },
});

export default mongoose.models.Config || mongoose.model('Config', ConfigSchema);
