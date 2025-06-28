import { connectDB } from '../utils/connectDB';

export default async function handler(req, res) {
  const client = await connectDB();
  const db = client.db('mechanic_bano');
  const collection = db.collection('site_config');

  if (req.method === 'GET') {
    const config = await collection.findOne({});
    return res.json(config);
  }

  if (req.method === 'POST') {
    const { siteName, logoUrl } = req.body;
    await collection.updateOne({}, { $set: { siteName, logoUrl } }, { upsert: true });
    return res.json({ message: 'Updated successfully' });
  }
}
