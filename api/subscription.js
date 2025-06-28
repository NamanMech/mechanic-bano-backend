import { connectDB } from '../utils/connectDB';

export default async function handler(req, res) {
  const client = await connectDB();
  const db = client.db('mechanic_bano');
  const collection = db.collection('subscriptions');

  if (req.method === 'GET') {
    const subs = await collection.find().toArray();
    return res.json(subs);
  }

  if (req.method === 'POST') {
    const { plan, details } = req.body;
    await collection.insertOne({ plan, details });
    return res.json({ message: 'Subscription added successfully' });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await collection.deleteOne({ _id: new ObjectId(id) });
    return res.json({ message: 'Subscription deleted successfully' });
  }
}
