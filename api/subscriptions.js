const { connectDB } = require('../utils/connectDB.js');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  try {
    const client = await connectDB();
    const db = client.db('mechanic_bano');
    const collection = db.collection('subscriptions');

    if (req.method === 'GET') {
      const subscriptions = await collection.find().toArray();
      return res.status(200).json(subscriptions);
    }

    if (req.method === 'POST') {
      const { subscriptionName, price } = req.body;

      await collection.insertOne({ subscriptionName, price });
      return res.status(201).json({ message: 'Subscription added successfully' });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await collection.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ message: 'Subscription deleted successfully' });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
