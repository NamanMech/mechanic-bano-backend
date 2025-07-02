import { ObjectId } from 'mongodb';
import { connectDB } from '../utils/connectDB.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const client = await connectDB();
  const db = client.db('mechanic_bano');
  const collection = db.collection('youtube_videos');

  // ✅ GET ALL VIDEOS
  if (req.method === 'GET') {
    const videos = await collection.find().toArray();
    return res.status(200).json(videos);
  }

  // ✅ ADD VIDEO
  if (req.method === 'POST') {
    try {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        const { title, description, embedLink, originalLink, category } = JSON.parse(body);

        if (!title || !description || !embedLink || !originalLink || !category) {
          return res.status(400).json({ message: 'Missing required fields' });
        }

        const result = await collection.insertOne({ title, description, embedLink, originalLink, category });
        return res.status(201).json({ message: 'YouTube video added successfully', result });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
    return;
  }

  // ✅ UPDATE VIDEO
  if (req.method === 'PUT') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ message: 'ID is required' });
      }

      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        const { title, description, embedLink, originalLink, category } = JSON.parse(body);

        if (!title || !description || !embedLink || !originalLink || !category) {
          return res.status(400).json({ message: 'Missing required fields' });
        }

        await collection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { title, description, embedLink, originalLink, category } }
        );

        return res.status(200).json({ message: 'Video updated successfully' });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
    return;
  }

  // ✅ DELETE VIDEO
  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'ID is required' });
    }

    await collection.deleteOne({ _id: new ObjectId(id) });
    return res.status(200).json({ message: 'Video deleted successfully' });
  }

  // ✅ METHOD NOT ALLOWED
  return res.status(405).json({ message: 'Method Not Allowed' });
}
