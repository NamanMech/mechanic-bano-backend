import mongoose from 'mongoose';

const tutorialSchema = new mongoose.Schema({
  title: String,
  description: String,
  youtubeLink: String,
});

export default mongoose.models.Tutorial || mongoose.model('Tutorial', tutorialSchema);
