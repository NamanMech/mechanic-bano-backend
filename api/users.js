// api/users.js
import { connectDB } from '../utils/connectDB.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const client = await connectDB();
  const db = client.db('mechanic_bano');
  const usersCollection = db.collection('users');
  const plansCollection = db.collection('subscription_plans');

  // ✅ Get All Users
  if (req.method === 'GET') {
    try {
      const users = await usersCollection.find().toArray();
      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching users' });
    }
  }

  // ✅ Delete User
  if (req.method === 'DELETE') {
    const { email } = req.query;

    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
      await usersCollection.deleteOne({ email });
      return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Error deleting user' });
    }
  }

  // ✅ Subscribe User
  if (req.method === 'PUT') {
    const { email } = req.query;

    if (!email) return res.status(400).json({ message: 'Email is required' });

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      const { planId } = JSON.parse(body);

      if (!planId) return res.status(400).json({ message: 'Plan ID is required' });

      const selectedPlan = await plansCollection.findOne({ _id: new ObjectId(planId) });

      if (!selectedPlan) return res.status(404).json({ message: 'Subscription plan not found' });

      const subscriptionEnd = new Date();
      subscriptionEnd.setDate(subscriptionEnd.getDate() + selectedPlan.days);

      const updateResult = await usersCollection.updateOne(
        { email },
        {
          $set: {
            isSubscribed: true,
            subscriptionEnd,
            subscribedPlan: {
              id: selectedPlan._id,
              title: selectedPlan.title,
              price: selectedPlan.price,
              days: selectedPlan.days,
              discount: selectedPlan.discount || 0
            }
          }
        }
      );

      if (updateResult.matchedCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({ message: 'Subscription activated successfully' });
    });

    return;
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
