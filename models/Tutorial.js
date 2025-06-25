
import mongoose from 'mongoose';

const TutorialSchema = new mongoose.Schema({
  title: String,
  description: String,
  youtubeLink: String,
});

export default mongoose.models.Tutorial || mongoose.model('Tutorial', TutorialSchema);
