// backend/api/subscribe.js
import { connectDB } from '../utils/connectDB.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const client = await connectDB();
  const db = client.db('mechanic_bano');
  const userCollection = db.collection('users');
  const planCollection = db.collection('subscription_plans');

  if (req.method === 'PUT') {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      const { planId } = JSON.parse(body); // Plan ID should come from frontend

      if (!planId) {
        return res.status(400).json({ message: 'Plan ID is required' });
      }

      // ✅ Find selected plan
      const selectedPlan = await planCollection.findOne({ _id: new ObjectId(planId) });

      if (!selectedPlan) {
        return res.status(404).json({ message: 'Subscription plan not found' });
      }

      // ✅ Calculate subscription end date
      const subscriptionEnd = new Date();
      subscriptionEnd.setDate(subscriptionEnd.getDate() + selectedPlan.days);

      // ✅ Update user subscription
      const updateResult = await userCollection.updateOne(
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
