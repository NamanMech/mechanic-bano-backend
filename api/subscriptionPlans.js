// backend/api/subscriptionPlans.js

import { ObjectId } from 'mongodb';
import { connectDB } from '../utils/connectDB.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const client = await connectDB();
  const db = client.db('mechanic_bano');
  const collection = db.collection('subscription_plans');

  // Get all plans
  if (req.method === 'GET') {
    const plans = await collection.find().toArray();
    return res.status(200).json(plans);
  }

  // Add a new plan
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });

    req.on('end', async () => {
      const { title, price, days, discount } = JSON.parse(body);

      if (!title || !price || !days) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      await collection.insertOne({ title, price, days, discount: discount || 0 });
      return res.status(201).json({ message: 'Plan added successfully' });
    });
    return;
  }

  // Update a plan
  if (req.method === 'PUT') {
    const { id } = req.query;

    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });

    req.on('end', async () => {
      const { title, price, days, discount } = JSON.parse(body);

      await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { title, price, days, discount: discount || 0 } }
      );

      return res.status(200).json({ message: 'Plan updated successfully' });
    });
    return;
  }

  // Delete a plan
  if (req.method === 'DELETE') {
    const { id } = req.query;

    await collection.deleteOne({ _id: new ObjectId(id) });
    return res.status(200).json({ message: 'Plan deleted successfully' });
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
