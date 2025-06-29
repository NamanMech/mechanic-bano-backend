// api/pdfs.js
const { connectDB } = require('../utils/connectDB');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  const client = await connectDB();
  const db = client.db('mechanic_bano');
  const collection = db.collection('pdfs');

  if (req.method === 'GET') {
    const pdfs = await collection.find().toArray();
    return res.status(200).json(pdfs);
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      const { title, pdfLink } = JSON.parse(body);
      await collection.insertOne({ title, pdfLink });
      return res.status(201).json({ message: 'PDF added successfully' });
    });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await collection.deleteOne({ _id: new ObjectId(id) });
    return res.status(200).json({ message: 'PDF deleted successfully' });
  }
};
