import { connectDB } from '../utils/connectDB.js';

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  let db;

  try {
    // ConnectDB se direct database instance mil rahi hai ya connection?
    const database = await connectDB();
    db = database.db || database; // Based on your connectDB implementation
    const collection = db.collection('welcome_note');

    if (req.method === 'GET') {
      const note = await collection.findOne({});
      return res.status(200).json(note || { title: '', message: '' });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      let body;
      try {
        body = await parseRequestBody(req);
      } catch {
        return res.status(400).json({ message: 'Invalid JSON body' });
      }

      const { title, message } = body;

      if (!title || !message) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      await collection.deleteMany({});
      await collection.insertOne({ title, message });

      return res.status(200).json({ message: 'Welcome note updated successfully' });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  } finally {
    if (db && db.close) {
      await db.close();
    }
  }
}
