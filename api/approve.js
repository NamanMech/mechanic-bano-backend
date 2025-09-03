import { connectDB } from '../utils/connectDB.js';
import { ObjectId } from 'mongodb';
import { setCorsHeaders } from '../utils/cors.js';
import { parseJsonBody } from '../utils/jsonParser.js';

export default async function handler(req, res) {
  // CORS headers lagao
  if (setCorsHeaders(req, res)) return;

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // Body parse karo
    const body = await parseJsonBody(req);
    const { email, planId } = body;

    // Validation
    if (!email || !planId) {
      return res.status(400).json({ success: false, message: 'Email and planId are required.' });
    }

    // DB connect karo
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const plansCollection = db.collection('subscription_plans');

    // User check karo
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Plan check karo
    const plan = await plansCollection.findOne({ _id: new ObjectId(planId) });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }

    // Set subscription dates
    const subscriptionStart = new Date();
    const subscriptionEnd = new Date(subscriptionStart.getTime() + plan.days * 24 * 60 * 60 * 1000);

    // User update karo
    await usersCollection.updateOne(
      { email },
      {
        $set: {
          isSubscribed: true,
          subscriptionStart,
          subscriptionEnd,
          subscribedPlan: {
            id: plan._id,
            title: plan.title,
            price: plan.price,
            days: plan.days,
            discount: plan.discount || 0,
          },
        },
      }
    );

    return res.status(200).json({ success: true, message: 'Subscription approved and activated!' });
  } catch (error) {
    console.error('Approve API error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
}
