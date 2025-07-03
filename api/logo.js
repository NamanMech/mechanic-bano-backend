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
  const collection = db.collection('logo');

  if (req.method === 'GET') {
    const logo = await collection.findOne({});
    return res.status(200).json(logo || { url: '' });
  }

  if (req.method === 'PUT') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      const { url } = JSON.parse(body);

      if (!url) {
        return res.status(400).json({ message: 'Logo URL is required' });
      }

      await collection.deleteMany({});
      await collection.insertOne({ url });

      return res.status(200).json({ message: 'Logo updated successfully' });
    });

    return;
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
