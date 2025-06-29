// api/welcome.js
const { connectDB } = require('../utils/connectDB.js');

module.exports = async (req, res) => {
  const client = await connectDB();
  const db = client.db('mechanic_bano');
  const collection = db.collection('welcome_note');

  if (req.method === 'GET') {
    const notes = await collection.find().toArray();
    return res.status(200).json(notes);
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      const { note } = JSON.parse(body);
      await collection.deleteMany({}); // Replace existing welcome note
      await collection.insertOne({ note });
      return res.status(201).json({ message: 'Welcome note added successfully' });
    });
  }
};
