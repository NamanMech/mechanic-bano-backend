import { connectDB } from '../utils/connectDB';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  try {
    const client = await connectDB();
    const db = client.db('mechanic_bano');
    const collection = db.collection('categories');

    if (req.method === 'GET') {
      const categories = await collection.find().toArray();
      return res.status(200).json(categories);
    }

    if (req.method === 'POST') {
      const { name, description } = req.body;
      await collection.insertOne({ name, description });
      return res.status(201).json({ message: 'Category added successfully' });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await collection.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ message: 'Category deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
}
