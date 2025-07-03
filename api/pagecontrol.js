// backend/api/pagecontrol.js
import { connectDB } from '../utils/connectDB.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const client = await connectDB();
  const db = client.db('mechanic_bano');
  const collection = db.collection('page_control');

  if (req.method === 'GET') {
    const pageControls = await collection.find({}).toArray();
    return res.status(200).json(pageControls);
  }

  if (req.method === 'PUT') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      const { page, enabled } = JSON.parse(body);

      if (!page || enabled === undefined) {
        return res.status(400).json({ message: 'Page and enabled status are required' });
      }

      const updateResult = await collection.updateOne(
        { page },
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
