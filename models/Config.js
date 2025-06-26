// models/Config.js
import mongoose from 'mongoose';

const configSchema = new mongoose.Schema({
  websiteName: String,
  logoURL: String,
});

const Config = mongoose.models.Config || mongoose.model('Config', configSchema);

export default Config;
