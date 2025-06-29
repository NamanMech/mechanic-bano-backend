const { connectDB } = require('../utils/connectDB.js');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  try {
    const client = await connectDB();
    const db = client.db('mechanic_bano');
    const collection = db.collection('categories');

    if (req.method === 'GET') {
      const categories = await collection.find().toArray();
      return res.status(200).json(categories);
    }

    if (req.method === 'POST') {
      const { categoryName } = req.body;
      if (!categoryName) return res.status(400).json({ message: 'Category Name is required' });

      await collection.insertOne({ categoryName });
      return res.status(201).json({ message: 'Category added successfully' });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await collection.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ message: 'Category deleted successfully' });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
