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
  // Set CORS headers
  const allowedOrigins = [
    'https://mechanic-bano-admin.netlify.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('Connecting to database...');
    
    // Get the database instance directly
    const db = await connectDB();
    console.log('Database connected successfully');
    
    const collection = db.collection('welcome_note');

    if (req.method === 'GET') {
      console.log('Processing GET request');
      const note = await collection.findOne({});
      console.log('Found note:', note);
      return res.status(200).json(note || { title: '', message: '' });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      console.log('Processing PUT/POST request');
      let body;
      try {
        body = await parseRequestBody(req);
        console.log('Parsed body:', body);
      } catch (error) {
        console.error('Error parsing body:', error);
        return res.status(400).json({ message: 'Invalid JSON body' });
      }

      const { title, message } = body;

      if (!title || !message) {
        console.error('Missing fields:', { title, message });
        return res.status(400).json({ message: 'Missing required fields' });
      }

      console.log('Updating welcome note with:', { title, message });
      await collection.deleteMany({});
      await collection.insertOne({ title, message, updatedAt: new Date() });

      return res.status(200).json({ message: 'Welcome note updated successfully' });
    }

    console.error('Method not allowed:', req.method);
    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('API Error Details:', error);
    return res.status(500).json({ 
      message: 'Internal Server Error', 
      error: error.message
    });
  }
}
