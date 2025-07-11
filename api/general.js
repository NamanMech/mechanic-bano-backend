import { connectDB } from '../utils/connectDB.js';
import { ObjectId } from 'mongodb';
import { createClient } from '@supabase/supabase-js';

// Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.SUPABASE_PROJECT_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk.toString()));
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { type, id } = req.query;
  if (!type) return res.status(400).json({ message: 'Type is required' });
  if (id && !ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    const { db } = await connectDB();

    const youtubeCollection = db.collection('youtube_videos');
    const pdfCollection = db.collection('pdfs');
    const logoCollection = db.collection('logo');
    const siteNameCollection = db.collection('site_name');
    const pageControlCollection = db.collection('page_control');

    // ========== PDF ==========
    if (type === 'pdf') {
      if (req.method === 'GET') {
        const pdfs = await pdfCollection.find().toArray();
        return res.status(200).json(pdfs);
      }

      if (['POST', 'PUT'].includes(req.method)) {
        const body = await parseRequestBody(req);
        const { title, originalLink, category } = body;
        if (!title || !originalLink || !category) {
          return res.status(400).json({ message: 'Missing required fields' });
        }

        if (req.method === 'POST') {
          const result = await pdfCollection.insertOne({ title, originalLink, category });
          return res.status(201).json({ message: 'PDF added', result });
        }

        if (req.method === 'PUT') {
          const result = await pdfCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { title, originalLink, category } }
          );
          return res.status(200).json({ message: 'PDF updated' });
        }
      }

      if (req.method === 'DELETE') {
        const pdfDoc = await pdfCollection.findOne({ _id: new ObjectId(id) });
        if (!pdfDoc) return res.status(404).json({ message: 'PDF not found' });

        // Delete from Supabase
        if (pdfDoc.originalLink) {
          const parts = pdfDoc.originalLink.split('/pdfs/');
          const fileName = parts[1];
          if (fileName) {
            await supabaseAdmin.storage.from('pdfs').remove([`pdfs/${fileName}`]);
          }
        }

        await pdfCollection.deleteOne({ _id: new ObjectId(id) });
        return res.status(200).json({ message: 'PDF deleted from DB and Supabase' });
      }
    }

    // ========== YouTube ==========
    if (type === 'youtube') {
      if (req.method === 'GET') {
        const data = await youtubeCollection.find().toArray();
        return res.status(200).json(data);
      }

      if (['POST', 'PUT'].includes(req.method)) {
        const body = await parseRequestBody(req);
        const { title, description, embedLink, originalLink, category } = body;
        if (!title || !description || !embedLink || !originalLink || !category) {
          return res.status(400).json({ message: 'Missing fields' });
        }

        if (req.method === 'POST') {
          const result = await youtubeCollection.insertOne({ title, description, embedLink, originalLink, category });
          return res.status(201).json({ message: 'Video added', result });
        }

        if (req.method === 'PUT') {
          const result = await youtubeCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { title, description, embedLink, originalLink, category } }
          );
          return res.status(200).json({ message: 'Video updated' });
        }
      }

      if (req.method === 'DELETE') {
        await youtubeCollection.deleteOne({ _id: new ObjectId(id) });
        return res.status(200).json({ message: 'Video deleted' });
      }
    }

    // ========== Logo ==========
    if (type === 'logo') {
      if (req.method === 'GET') {
        const logo = await logoCollection.findOne({});
        return res.status(200).json(logo || { url: '' });
      }

      if (req.method === 'PUT') {
        const body = await parseRequestBody(req);
        const { url } = body;
        if (!url) return res.status(400).json({ message: 'Logo URL is required' });

        await logoCollection.updateOne({}, { $set: { url } }, { upsert: true });
        return res.status(200).json({ message: 'Logo updated' });
      }
    }

    // ========== Site Name ==========
    if (type === 'sitename') {
      if (req.method === 'GET') {
        const site = await siteNameCollection.findOne({});
        return res.status(200).json(site || { name: 'Mechanic Bano' });
      }

      if (req.method === 'PUT') {
        const body = await parseRequestBody(req);
        const { name } = body;
        if (!name) return res.status(400).json({ message: 'Site name is required' });

        await siteNameCollection.updateOne({}, { $set: { name } }, { upsert: true });
        return res.status(200).json({ message: 'Site name updated' });
      }
    }

    // ========== Page Control ==========
    if (type === 'pagecontrol') {
      if (req.method === 'GET') {
        const pages = await pageControlCollection.find().toArray();
        return res.status(200).json(pages);
      }

      if (req.method === 'PUT') {
        const body = await parseRequestBody(req);
        const { enabled } = body;
        await pageControlCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { enabled } }
        );
        return res.status(200).json({ message: 'Page updated' });
      }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('Backend Error:', error.message);
    return res.status(500).json({ message: 'Internal error', error: error.message });
  }
}
