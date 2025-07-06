// backend/api/checksubscription.js

import { connectDB } from '../utils/connectDB.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const client = await connectDB();
    const db = client.db('mechanic_bano');
    const collection = db.collection('users');

    const user = await collection.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if subscription expired
    const currentDate = new Date();
    if (user.isSubscribed && user.subscriptionEnd && new Date(user.subscriptionEnd) > currentDate) {
      return res.status(200).json({ isSubscribed: true });
    } else {
      return res.status(200).json({ isSubscribed: false });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
