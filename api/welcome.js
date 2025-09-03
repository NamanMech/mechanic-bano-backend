import { connectDB } from '../utils/connectDB.js';
import { setCorsHeaders } from '../utils/cors.js';
import { parseJsonBody } from '../utils/jsonParser.js';

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return;

  try {
    const db = await connectDB();
    const collection = db.collection('welcome_note');

    if (req.method === 'GET') {
      const note = await collection.findOne({});
      return res.status(200).json(note || { title: '', message: '' });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = await parseJsonBody(req);
      const { title, message } = body;

      if (!title || !message) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      await collection.updateOne({}, { $set: { title, message, updatedAt: new Date() } }, { upsert: true });
      return res.status(200).json({ message: 'Welcome note updated successfully' });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
