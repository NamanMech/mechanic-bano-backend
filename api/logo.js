// api/logo.js
import { connectDB } from '../utils/connectDB.js';

export default async function handler(req, res) {
  try {
    const client = await connectDB();
    const db = client.db('mechanic_bano');
    const collection = db.collection('logo');

    if (req.method === 'GET') {
      const logoData = await collection.find().toArray();
      return res.status(200).json(logoData);
    }

    if (req.method === 'POST') {
      const { siteName, logoUrl } = req.body;

      if (!siteName || !logoUrl) {
        return res.status(400).json({ message: 'Site name and logo URL are required' });
      }

      await collection.deleteMany({}); // Replace existing logo
      await collection.insertOne({ siteName, logoUrl });
      return res.status(201).json({ message: 'Logo and site name updated successfully' });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
