// api/pdfs.js
import { connectDB } from '../utils/connectDB.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  try {
    const client = await connectDB();
    const db = client.db('mechanic_bano');
    const collection = db.collection('pdfs');

    if (req.method === 'GET') {
      const pdfs = await collection.find().toArray();
      return res.status(200).json(pdfs);
    }

    if (req.method === 'POST') {
      const { title, pdfLink } = req.body;

      if (!title || !pdfLink) {
        return res.status(400).json({ message: 'Title and PDF link are required' });
      }

      await collection.insertOne({ title, pdfLink });
      return res.status(201).json({ message: 'PDF added successfully' });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ message: 'ID is required for deletion' });
      }

      await collection.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ message: 'PDF deleted successfully' });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
