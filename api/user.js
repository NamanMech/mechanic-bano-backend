import { connectDB } from '../utils/connectDB.js';

export default async function handler(req, res) {
  const db = await connectDB();
  const usersCollection = db.collection('users');

  if (req.method === 'GET') {
    try {
      const users = await usersCollection.find().toArray();
      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching users' });
    }
  }

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

  res.status(405).json({ message: 'Method not allowed' });
}
