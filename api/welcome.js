const { connectDB } = require('../utils/connectDB.js');

module.exports = async (req, res) => {
  try {
    const client = await connectDB();
    const db = client.db('mechanic_bano');
    const collection = db.collection('welcome_note');

    if (req.method === 'GET') {
      const notes = await collection.find().toArray();
      return res.status(200).json(notes);
    }

    if (req.method === 'POST') {
      const { note } = req.body;

      await collection.deleteMany({});
      await collection.insertOne({ note });
      return res.status(201).json({ message: 'Welcome note added successfully' });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
