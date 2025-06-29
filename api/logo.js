// api/logo.js
const { connectDB } = require('../utils/connectDB');

module.exports = async (req, res) => {
  const client = await connectDB();
  const db = client.db('mechanic_bano');
  const collection = db.collection('logo');

  if (req.method === 'GET') {
    const logoData = await collection.find().toArray();
    return res.status(200).json(logoData);
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      const { siteName, logoUrl } = JSON.parse(body);
      await collection.deleteMany({}); // Replace existing logo
      await collection.insertOne({ siteName, logoUrl });
      return res.status(201).json({ message: 'Logo and site name updated successfully' });
    });
  }
};
