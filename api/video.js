import { connectDB } from '../utils/connectDB';

export default async function handler(req, res) {
  const client = await connectDB();
  const db = client.db('mechanic_bano');
  const collection = db.collection('videos');

  if (req.method === 'GET') {
    const videos = await collection.find().toArray();
    return res.json(videos);
  }

  if (req.method === 'POST') {
    const { title, description, link } = req.body;
    await collection.insertOne({ title, description, link });
    return res.json({ message: 'Video added successfully' });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await collection.deleteOne({ _id: new ObjectId(id) });
    return res.json({ message: 'Video deleted successfully' });
  }
}
