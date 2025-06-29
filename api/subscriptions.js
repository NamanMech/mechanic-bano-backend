// api/subscriptions.js
const { connectDB } = require('../utils/connectDB.js');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  const client = await connectDB();
  const db = client.db('mechanic_bano');
  const collection = db.collection('subscriptions');

  if (req.method === 'GET') {
    const subscriptions = await collection.find().toArray();
    return res.status(200).json(subscriptions);
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      const { subscriptionName, price } = JSON.parse(body);
      await collection.insertOne({ subscriptionName, price });
      return res.status(201).json({ message: 'Subscription added successfully' });
    });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await collection.deleteOne({ _id: new ObjectId(id) });
    return res.status(200).json({ message: 'Subscription deleted successfully' });
  }
};
