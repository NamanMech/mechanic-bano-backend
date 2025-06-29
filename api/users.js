// api/users.js
import { connectDB } from '../utils/connectDB.js';

export default async function handler(req, res) {
  const client = await connectDB();
  const db = client.db('mechanic_bano');
  const collection = db.collection('users');

  if (req.method === 'GET') {
    const users = await collection.find().toArray();
    return res.status(200).json(users);
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
