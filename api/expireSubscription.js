import { connectDB } from '../utils/connectDB.js';

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    const { email } = req.query;

    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
      const db = await connectDB();
      const usersCollection = db.collection('users');

      await usersCollection.updateOne(
        { email },
        { $set: { isSubscribed: false, subscriptionEnd: null } }
      );

      return res.status(200).json({ message: 'Subscription expired successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Error expiring subscription' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
