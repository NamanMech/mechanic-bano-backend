import { connectDB } from '../utils/connectDB';

export default async function handler(req, res) {
  const client = await connectDB();
  const db = client.db('mechanic_bano');
  const collection = db.collection('welcome_notes');

  if (req.method === 'GET') {
    const notes = await collection.find().toArray();
    return res.json(notes);
  }

  if (req.method === 'POST') {
    const { note } = req.body;
    await collection.insertOne({ note });
    return res.json({ message: 'Note added successfully' });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await collection.deleteOne({ _id: new ObjectId(id) });
    return res.json({ message: 'Note deleted successfully' });
  }
}
