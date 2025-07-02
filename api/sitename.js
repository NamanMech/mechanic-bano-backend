import { connectDB } from '../utils/connectDB.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const client = await connectDB();
  const db = client.db('mechanic_bano');
  const collection = db.collection('site_name');

  if (req.method === 'GET') {
    const siteName = await collection.findOne({});
    return res.status(200).json(siteName || { name: 'Mechanic Bano' });
  }

  if (req.method === 'PUT') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      const { name } = JSON.parse(body);

      if (!name) {
        return res.status(400).json({ message: 'Site name is required' });
      }

      await collection.deleteMany({});
      await collection.insertOne({ name });

      return res.status(200).json({ message: 'Site name updated successfully' });
    });

    return;
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
