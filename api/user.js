import { connectDB } from '../utils/connectDB';

export default async function handler(req, res) {
  const client = await connectDB();
  const db = client.db('mechanic_bano');
  const collection = db.collection('users');

  if (req.method === 'GET') {
    const users = await collection.find().toArray();
    return res.json(users);
  }

  if (req.method === 'POST') {
    const { name, email } = req.body;
    await collection.insertOne({ name, email });
    return res.json({ message: 'User added successfully' });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await collection.deleteOne({ _id: new ObjectId(id) });
    return res.json({ message: 'User deleted successfully' });
  }
}
