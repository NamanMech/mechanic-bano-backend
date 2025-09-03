import { connectDB } from '../utils/connectDB.js';
import { ObjectId } from 'mongodb';
import { setCorsHeaders } from '../utils/cors.js';
import { parseJsonBody } from '../utils/jsonParser.js';

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return;
  const { email, type } = req.query;
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');

    if (req.method === 'POST') {
      const body = await parseJsonBody(req);
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

    if (req.method === 'GET' && !type) {
      const users = await usersCollection.find().toArray();
      return res.status(200).json(users);
    }

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (req.method === 'GET' && type === 'info') {
      let user = await usersCollection.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });
      const now = new Date();
      if (user.subscriptionEnd && new Date(user.subscriptionEnd) <= now) {
        await usersCollection.updateOne({ email }, {
          $set: {
            isSubscribed: false,
            subscriptionStart: null,
            subscriptionEnd: null,
            subscribedPlan: null,
          },
        });
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

    if (req.method === 'DELETE') {
      const deleteResult = await usersCollection.deleteOne({ email });
      if (deleteResult.deletedCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.status(200).json({ message: 'User deleted successfully' });
    }

    if (req.method === 'PUT') {
      const body = await parseJsonBody(req);

      // --- Expire User Subscription ---
      if (type === 'expire') {
        const user = await usersCollection.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

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
        return res.status(200).json({ message: 'Subscription expired successfully' });
      }

      // --- Update User Data ---
      if (type === 'update') {
        const { name, picture } = body;
        if (!name) return res.status(400).json({ message: 'Name is required for update' });
        const updateResult = await usersCollection.updateOne({ email }, {
          $set: { name, picture: picture || '' }
        });
        if (updateResult.matchedCount === 0) return res.status(404).json({ message: 'User not found' });
        return res.status(200).json({ message: 'User updated successfully' });
      }

      return res.status(400).json({ message: 'Invalid request for PUT' });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
