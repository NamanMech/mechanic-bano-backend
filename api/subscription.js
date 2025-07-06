import { connectDB } from '../utils/connectDB.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { type, email } = req.query;

  if (!type) return res.status(400).json({ message: 'Type is required' });
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const { db } = await connectDB();  // ✅ Yeh sahi tarika hai
    const usersCollection = db.collection('users');

    if (type === 'check' && req.method === 'GET') {
      const user = await usersCollection.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });

      const currentDate = new Date();
      const isSubscribed =
        user.isSubscribed &&
        user.subscriptionEnd &&
        new Date(user.subscriptionEnd) > currentDate;

      return res.status(200).json({ isSubscribed });
    }

    if (type === 'expire' && req.method === 'PUT') {
      const updateResult = await usersCollection.updateOne(
        { email },
        { $set: { isSubscribed: false, subscriptionEnd: null } }
      );

      if (updateResult.matchedCount === 0)
        return res.status(404).json({ message: 'User not found' });

      return res.status(200).json({ message: 'Subscription expired successfully' });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
