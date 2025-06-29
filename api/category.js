// api/categories.js
const { connectDB } = require('../utils/connectDB');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  const client = await connectDB();
  const db = client.db('mechanic_bano');
  const collection = db.collection('categories');

  if (req.method === 'GET') {
    const categories = await collection.find().toArray();
    return res.status(200).json(categories);
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      const { name, description } = JSON.parse(body);
      await collection.insertOne({ name, description });
      return res.status(201).json({ message: 'Category added successfully' });
    });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await collection.deleteOne({ _id: new ObjectId(id) });
    return res.status(200).json({ message: 'Category deleted successfully' });
  }
};
