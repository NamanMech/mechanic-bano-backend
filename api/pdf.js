import { connectDB } from '../utils/connectDB';

export default async function handler(req, res) {
  const client = await connectDB();
  const db = client.db('mechanic_bano');
  const collection = db.collection('pdfs');

  if (req.method === 'GET') {
    const pdfs = await collection.find().toArray();
    return res.json(pdfs);
  }

  if (req.method === 'POST') {
    const { title, pdfUrl } = req.body;
    await collection.insertOne({ title, pdfUrl });
    return res.json({ message: 'PDF added successfully' });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await collection.deleteOne({ _id: new ObjectId(id) });
    return res.json({ message: 'PDF deleted successfully' });
  }
}
