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
  const collection = db.collection('welcome_note');

  if (req.method === 'GET') {
    const note = await collection.findOne({});
    return res.status(200).json(note || { title: '', message: '' });
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        const { title, message } = JSON.parse(body);

        if (!title || !message) {
          return res.status(400).json({ message: 'Missing required fields' });
        }

        // Always keep one note (replace existing)
        await collection.deleteMany({});
        await collection.insertOne({ title, message });

        return res.status(200).json({ message: 'Welcome note updated successfully' });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
    return;
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
