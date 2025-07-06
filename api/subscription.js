// api/subscription.js
import { connectDB } from '../utils/connectDB.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { type } = req.query;

  if (!type) return res.status(400).json({ message: 'Type is required' });

  const client = await connectDB();
  const db = client.db('mechanic_bano');
  const usersCollection = db.collection('users');

  if (type === 'check') {
    // ✅ Check Subscription
    if (req.method === 'GET') {
      const { email } = req.query;

      if (!email) return res.status(400).json({ message: 'Email is required' });

      const user = await usersCollection.findOne({ email });

      if (!user) return res.status(404).json({ message: 'User not found' });

      const currentDate = new Date();
      if (user.isSubscribed && user.subscriptionEnd && new Date(user.subscriptionEnd) > currentDate) {
        return res.status(200).json({ isSubscribed: true });
      } else {
        return res.status(200).json({ isSubscribed: false });
      }
    }
  }

  if (type === 'expire') {
    // ✅ Expire Subscription
    if (req.method === 'PUT') {
      const { email } = req.query;

      if (!email) return res.status(400).json({ message: 'Email is required' });

      try {
        await usersCollection.updateOne(
          { email },
          { $set: { isSubscribed: false, subscriptionEnd: null } }
        );

        return res.status(200).json({ message: 'Subscription expired successfully' });
      } catch (error) {
        return res.status(500).json({ message: 'Error expiring subscription' });
      }
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
