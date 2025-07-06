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

  const { id, type, email } = req.query;

  try {
    const { db } = await connectDB(); // ✅ Correct connection

    const plansCollection = db.collection('subscription_plans');
    const usersCollection = db.collection('users');

    // =================== Subscription Plans ===================
    if (!type) {
      // GET All Plans
      if (req.method === 'GET') {
        const plans = await plansCollection.find().toArray();
        return res.status(200).json(plans);
      }

      // CREATE or UPDATE Plan
      if (req.method === 'POST' || req.method === 'PUT') {
        let body;
        try {
          body = await parseRequestBody(req);
        } catch {
          return res.status(400).json({ message: 'Invalid JSON body' });
        }

        const { title, price, days, discount } = body;

        if (!title || !price || !days) {
          return res.status(400).json({ message: 'Missing required fields' });
        }

        if (req.method === 'POST') {
          await plansCollection.insertOne({ title, price, days, discount });
          return res.status(201).json({ message: 'Plan created successfully' });
        }

        if (req.method === 'PUT') {
          if (!id) return res.status(400).json({ message: 'ID is required' });

          const updateResult = await plansCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { title, price, days, discount } }
          );

          if (updateResult.matchedCount === 0)
            return res.status(404).json({ message: 'Plan not found' });

          return res.status(200).json({ message: 'Plan updated successfully' });
        }
      }

      // DELETE Plan
      if (req.method === 'DELETE') {
        if (!id) return res.status(400).json({ message: 'ID is required' });

        const deleteResult = await plansCollection.deleteOne({ _id: new ObjectId(id) });
        if (deleteResult.deletedCount === 0)
          return res.status(404).json({ message: 'Plan not found' });

        return res.status(200).json({ message: 'Plan deleted successfully' });
      }
    }

    // =================== User Subscription ===================
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

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
