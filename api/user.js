// backend/api/user.js
import { connectDB } from '../utils/connectDB.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const client = await connectDB();
  const db = client.db('mechanic_bano');
  const collection = db.collection('users');

  // ✅ GET user by email
  if (req.method === 'GET') {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await collection.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  }

  // ✅ POST - Create or Update user
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      const { email, name, picture } = JSON.parse(body);

      if (!email || !name) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const existingUser = await collection.findOne({ email });

      if (existingUser) {
        return res.status(200).json(existingUser);
      }

      const newUser = {
        email,
        name,
        picture,
        isSubscribed: false,
        subscriptionEnd: null,
      };

      const result = await collection.insertOne(newUser);

      return res.status(201).json({ ...newUser, _id: result.insertedId });
    });

    return;
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
