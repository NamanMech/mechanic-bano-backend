const { connectDB } = require('../utils/connectDB.js');

module.exports = async (req, res) => {
  try {
    const client = await connectDB();
    const db = client.db('mechanic_bano');
    const collection = db.collection('users');

    if (req.method === 'GET') {
      const users = await collection.find().toArray();
      return res.status(200).json(users);
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
