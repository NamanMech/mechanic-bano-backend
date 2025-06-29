// api/users.js
const { connectDB } = require('../utils/connectDB.js');

module.exports = async (req, res) => {
  const client = await connectDB();
  const db = client.db('mechanic_bano');
  const collection = db.collection('users');

  if (req.method === 'GET') {
    const users = await collection.find().toArray();
    return res.status(200).json(users);
  }
};
