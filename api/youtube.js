const { connectDB } = require('../utils/connectDB.js');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  try {
    const client = await connectDB();
    const db = client.db('mechanic_bano');
    const collection = db.collection('youtube_videos');

    if (req.method === 'GET') {
      const videos = await collection.find().toArray();
      return res.status(200).json(videos);
    }

    if (req.method === 'POST') {
      const { title, description, link } = req.body;

      await collection.insertOne({ title, description, link });
      return res.status(201).json({ message: 'YouTube video added successfully' });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await collection.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ message: 'Video deleted successfully' });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
