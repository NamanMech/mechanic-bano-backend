import { connectDB } from '../utils/connectDB.js';
import { ObjectId } from 'mongodb';

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk.toString()));
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Fixed: removed escape backslash
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { email, type } = req.query;

  try {
    const { db } = await connectDB();
    const usersCollection = db.collection('users');
    const plansCollection = db.collection('subscription_plans');

    // POST: Create or fetch user by email & name (Google login)
    if (req.method === 'POST') {
      const body = await parseRequestBody(req);
      if (!body.email || !body.name) {
        return res.status(400).json({ message: 'Email and Name are required.' });
      }
      const existingUser = await usersCollection.findOne({ email: body.email });
      if (existingUser) return res.status(200).json(existingUser);

      const newUser = {
        email: body.email,
        name: body.name,
        picture: body.picture || '',
        isSubscribed: false,
        subscriptionStart: null,
        subscriptionEnd: null,
        subscribedPlan: null,
      };
      await usersCollection.insertOne(newUser);
      return res.status(200).json(newUser);
    }

    // GET all users
    if (req.method === 'GET' && !type) {
      const users = await usersCollection.find().toArray();
      return res.status(200).json(users);
    }

    if (!email) return res.status(400).json({ message: 'Email is required' });

    // GET: User full info including subscription details for profile screen with expiry check
    if (req.method === 'GET' && type === 'info') {
      let user = await usersCollection.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });

      // Auto-expire subscription if past subscriptionEnd
      const now = new Date();
      if (user.subscriptionEnd && new Date(user.subscriptionEnd) <= now) {
        await usersCollection.updateOne(
          { email },
          {
            $set: {
              isSubscribed: false,
              subscriptionStart: null,
              subscriptionEnd: null,
              subscribedPlan: null,
            },
          }
        );
        // Refetch updated user info to return clean state
        user = await usersCollection.findOne({ email });
      }

      return res.status(200).json({
        email: user.email,
        name: user.name,
        picture: user.picture || '',
        isSubscribed: user.isSubscribed ?? false,
        subscriptionStart: user.subscriptionStart ? new Date(user.subscriptionStart).toISOString() : null,
        subscriptionEnd: user.subscriptionEnd ? new Date(user.subscriptionEnd).toISOString() : null,
        subscribedPlan: user.subscribedPlan ?? null,
      });
    }

    // DELETE user by email
    if (req.method === 'DELETE') {
      const deleteResult = await usersCollection.deleteOne({ email });
      if (deleteResult.deletedCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.status(200).json({ message: 'User deleted successfully' });
    }

    // PUT: Update user or activate subscription
    if (req.method === 'PUT') {
      let body;
      try {
        body = await parseRequestBody(req);
      } catch {
        return res.status(400).json({ message: 'Invalid JSON body' });
      }

      if (type === 'update') {
        // Update user profile info
        const { name, picture } = body;
        if (!name) return res.status(400).json({ message: 'Name is required for update' });
        const updateResult = await usersCollection.updateOne(
          { email },
          { $set: { name, picture: picture || '' } }
        );
        if (updateResult.matchedCount === 0) return res.status(404).json({ message: 'User not found' });
        return res.status(200).json({ message: 'User updated successfully' });
      }

      // Activate subscription
      const { planId } = body;
      if (!planId) return res.status(400).json({ message: 'Plan ID is required' });
      if (!ObjectId.isValid(planId)) return res.status(400).json({ message: 'Invalid Plan ID' });

      const selectedPlan = await plansCollection.findOne({ _id: new ObjectId(planId) });
      if (!selectedPlan) return res.status(404).json({ message: 'Subscription plan not found' });

      const subscriptionStart = new Date();
      const subscriptionEnd = new Date(subscriptionStart.getTime() + selectedPlan.days * 24 * 60 * 60 * 1000);

      const updateResult = await usersCollection.updateOne(
        { email },
        {
          $set: {
            isSubscribed: true,
            subscriptionStart,
            subscriptionEnd,
            subscribedPlan: {
              id: selectedPlan._id,
              title: selectedPlan.title,
              price: selectedPlan.price,
              days: selectedPlan.days,
              discount: selectedPlan.discount || 0,
            },
          },
        }
      );
      if (updateResult.matchedCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.status(200).json({ message: 'Subscription activated successfully' });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
