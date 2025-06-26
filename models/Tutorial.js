// models/Tutorial.js
import mongoose from 'mongoose';

const tutorialSchema = new mongoose.Schema({
  title: String,
  description: String,
  youtubeLink: String,
});

const Tutorial = mongoose.models.Tutorial || mongoose.model('Tutorial', tutorialSchema);

export default Tutorial;
