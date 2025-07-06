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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { type, email, id } = req.query;

  if (!type) return res.status(400).json({ message: 'Type is required' });

  let client;

  try {
    client = await connectDB();
    const db = client.db('mechanic_bano');
    const usersCollection = db.collection('users');
    const plansCollection = db.collection('subscription_plans');

    // ========== User Subscription Check ==========
    if (type === 'check' && req.method === 'GET') {
      if (!email) return res.status(400).json({ message: 'Email is required' });

      const user = await usersCollection.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });

      const currentDate = new Date();
      const isSubscribed =
        user.isSubscribed &&
        user.subscriptionEnd &&
        new Date(user.subscriptionEnd) > currentDate;

      return res.status(200).json({ isSubscribed });
    }

    // ========== User Subscription Expire ==========
    if (type === 'expire' && req.method === 'PUT') {
      if (!email) return res.status(400).json({ message: 'Email is required' });

      const updateResult = await usersCollection.updateOne(
        { email },
        { $set: { isSubscribed: false, subscriptionEnd: null } }
      );

      if (updateResult.matchedCount === 0)
        return res.status(404).json({ message: 'User not found' });

      return res.status(200).json({ message: 'Subscription expired successfully' });
    }

    // ========== User Subscription Activate ==========
    if (type === 'activate' && req.method === 'PUT') {
      if (!email) return res.status(400).json({ message: 'Email is required' });

      let body;
      try {
        body = await parseRequestBody(req);
      } catch {
        return res.status(400).json({ message: 'Invalid JSON body' });
      }

      const { planId } = body;

      if (!planId) return res.status(400).json({ message: 'Plan ID is required' });
      if (!ObjectId.isValid(planId)) return res.status(400).json({ message: 'Invalid Plan ID' });

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
              discount: selectedPlan.discount || 0,
            },
          },
        }
      );

      if (updateResult.matchedCount === 0)
        return res.status(404).json({ message: 'User not found' });

      return res.status(200).json({ message: 'Subscription activated successfully' });
    }

    // ========== Get All Users ==========
    if (type === 'users' && req.method === 'GET') {
      const users = await usersCollection.find().toArray();
      return res.status(200).json(users);
    }

    // ========== Delete User ==========
    if (type === 'users' && req.method === 'DELETE') {
      if (!email) return res.status(400).json({ message: 'Email is required' });

      const deleteResult = await usersCollection.deleteOne({ email });
      if (deleteResult.deletedCount === 0)
        return res.status(404).json({ message: 'User not found' });

      return res.status(200).json({ message: 'User deleted successfully' });
    }

    // ========== Subscription Plans (GET All) ==========
    if (type === 'plans' && req.method === 'GET') {
      const plans = await plansCollection.find().toArray();
      return res.status(200).json(plans);
    }

    // ========== Subscription Plans (Create New) ==========
    if (type === 'plans' && req.method === 'POST') {
      let body;
      try {
        body = await parseRequestBody(req);
      } catch {
        return res.status(400).json({ message: 'Invalid JSON body' });
      }

      const { title, price, days, discount } = body;
      if (!title || !price || !days)
        return res.status(400).json({ message: 'Title, price, and days are required' });

      const newPlan = { title, price, days, discount: discount || 0 };
      const result = await plansCollection.insertOne(newPlan);

      return res.status(201).json({ message: 'Plan created successfully', result });
    }

    // ========== Subscription Plans (Update) ==========
    if (type === 'plans' && req.method === 'PUT') {
      if (!id) return res.status(400).json({ message: 'ID is required' });
      if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });

      let body;
      try {
        body = await parseRequestBody(req);
      } catch {
        return res.status(400).json({ message: 'Invalid JSON body' });
      }

      const { title, price, days, discount } = body;
      if (!title || !price || !days)
        return res.status(400).json({ message: 'Title, price, and days are required' });

      const updateResult = await plansCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { title, price, days, discount: discount || 0 } }
      );

      if (updateResult.matchedCount === 0)
        return res.status(404).json({ message: 'Plan not found' });

      return res.status(200).json({ message: 'Plan updated successfully' });
    }

    // ========== Subscription Plans (Delete) ==========
    if (type === 'plans' && req.method === 'DELETE') {
      if (!id) return res.status(400).json({ message: 'ID is required' });
      if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });

      const deleteResult = await plansCollection.deleteOne({ _id: new ObjectId(id) });
      if (deleteResult.deletedCount === 0)
        return res.status(404).json({ message: 'Plan not found' });

      return res.status(200).json({ message: 'Plan deleted successfully' });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });

  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  } finally {
    if (client) await client.close();
  }
}
