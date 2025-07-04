// /api/pdf.js
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
  const collection = db.collection('pdfs');

  if (req.method === 'GET') {
    const pdfs = await collection.find().toArray();
    return res.status(200).json(pdfs);
  }

  if (req.method === 'POST') {
    try {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        const { title, embedLink, originalLink, category } = JSON.parse(body);

        if (!title || !embedLink || !originalLink || !category) {
          return res.status(400).json({ message: 'Missing required fields' });
        }

        const result = await collection.insertOne({ title, embedLink, originalLink, category });
        return res.status(201).json({ message: 'PDF added successfully', result });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
    return;
  }

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
        const { title, embedLink, originalLink, category } = JSON.parse(body);

        if (!title || !embedLink || !originalLink || !category) {
          return res.status(400).json({ message: 'Missing required fields' });
        }

        await collection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { title, embedLink, originalLink, category } }
        );

        return res.status(200).json({ message: 'PDF updated successfully' });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'ID is required' });
    }

    await collection.deleteOne({ _id: new ObjectId(id) });
    return res.status(200).json({ message: 'PDF deleted successfully' });
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
