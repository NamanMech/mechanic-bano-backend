// backend/api/pagecontrol/[id].js
import { connectDB } from '../../utils/connectDB.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'PUT') {
    const { id } = req.query;

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      const { enabled } = JSON.parse(body);

      if (enabled === undefined) {
        return res.status(400).json({ message: 'Enabled status is required' });
      }

      const client = await connectDB();
      const db = client.db('mechanic_bano');
      const collection = db.collection('page_control');

      const updateResult = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { enabled } }
      );

      if (updateResult.matchedCount === 0) {
        return res.status(404).json({ message: 'Page not found' });
      }

      return res.status(200).json({ message: 'Page status updated successfully' });
    });

    return;
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
