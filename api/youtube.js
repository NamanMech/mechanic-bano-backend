// api/youtube.js
const { connectDB } = require('../utils/connectDB');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  const client = await connectDB();
  const db = client.db('mechanic_bano');
  const collection = db.collection('youtube_videos');

  if (req.method === 'GET') {
    const videos = await collection.find().toArray();
    return res.status(200).json(videos);
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      const { title, description, link } = JSON.parse(body);
      await collection.insertOne({ title, description, link });
      return res.status(201).json({ message: 'YouTube video added successfully' });
    });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await collection.deleteOne({ _id: new ObjectId(id) });
    return res.status(200).json({ message: 'Video deleted successfully' });
  }
};
