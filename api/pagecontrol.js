// backend/api/pagecontrol.js
import { connectDB } from '../utils/connectDB.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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

  return res.status(405).json({ message: 'Method Not Allowed' });
}
