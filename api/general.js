import { connectDB } from '../utils/connectDB.js';
import { ObjectId } from 'mongodb';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin =
  process.env.SUPABASE_PROJECT_URL && process.env.SUPABASE_SERVICE_KEY
    ? createClient(process.env.SUPABASE_PROJECT_URL, process.env.SUPABASE_SERVICE_KEY)
    : null;

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

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

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

    // ---------- YOUTUBE ----------
    if (type === 'youtube') {
      if (req.method === 'GET') {
        const videos = await youtubeCollection.find().toArray();
        return res.status(200).json(videos);
      }

      if (['POST', 'PUT'].includes(req.method)) {
        const body = await parseRequestBody(req);
        const { title, description, embedLink, originalLink, category } = body;
        if (!title || !description || !embedLink || !originalLink || !category) {
          return res.status(400).json({ message: 'Missing required fields' });
        }

        if (req.method === 'POST') {
          const result = await youtubeCollection.insertOne({ title, description, embedLink, originalLink, category });
          return res.status(201).json({ message: 'YouTube video added', result });
        }

        if (req.method === 'PUT') {
          const update = await youtubeCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { title, description, embedLink, originalLink, category } }
          );
          if (update.matchedCount === 0) return res.status(404).json({ message: 'Not found' });
          return res.status(200).json({ message: 'Updated successfully' });
        }
      }

      if (req.method === 'DELETE') {
        const result = await youtubeCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return res.status(404).json({ message: 'Video not found' });
        return res.status(200).json({ message: 'Deleted' });
      }
    }

    // ---------- PDF ----------
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
          const update = await pdfCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { title, originalLink, category } }
          );
          if (update.matchedCount === 0) return res.status(404).json({ message: 'PDF not found' });
          return res.status(200).json({ message: 'PDF updated' });
        }
      }

      if (req.method === 'DELETE') {
  const pdfDoc = await pdfCollection.findOne({ _id: new ObjectId(id) });
  if (!pdfDoc) return res.status(404).json({ message: 'PDF not found' });

  // ✅ Supabase delete with correct file path
if (supabaseAdmin && pdfDoc.originalLink?.includes('/storage/v1/object/public/')) {
  const relativePath = pdfDoc.originalLink.replace(
    'https://owmdhrvscnbiuvoihozb.supabase.co/storage/v1/object/public/',
    ''
  );
  console.log('➡️ Final relative path to delete:', relativePath);

  const { data, error } = await supabaseAdmin.storage.from('pdfs').remove([relativePath]);
  console.log('📝 Supabase remove response:', { data, error });

  if (error) {
    console.error('❌ Supabase deletion failed:', error.message);
  }
}
  const result = await pdfCollection.deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) return res.status(404).json({ message: 'Failed to delete from DB' });

  return res.status(200).json({ message: 'PDF deleted from Supabase and DB' });
}
    }

    // ---------- LOGO ----------
    if (type === 'logo') {
      if (req.method === 'GET') {
        const logo = await logoCollection.findOne({});
        return res.status(200).json(logo || { url: '' });
      }

      if (req.method === 'PUT') {
        const body = await parseRequestBody(req);
        const { url } = body;
        if (!url) return res.status(400).json({ message: 'URL required' });

        await logoCollection.updateOne({}, { $set: { url } }, { upsert: true });
        return res.status(200).json({ message: 'Logo updated' });
      }
    }

    // ---------- SITENAME ----------
    if (type === 'sitename') {
      if (req.method === 'GET') {
        const siteName = await siteNameCollection.findOne({});
        return res.status(200).json(siteName || { name: 'Mechanic Bano' });
      }

      if (req.method === 'PUT') {
        const body = await parseRequestBody(req);
        const { name } = body;
        if (!name) return res.status(400).json({ message: 'Name required' });

        await siteNameCollection.updateOne({}, { $set: { name } }, { upsert: true });
        return res.status(200).json({ message: 'Site name updated' });
      }
    }

    // ---------- PAGE CONTROL ----------
    if (type === 'pagecontrol') {
      if (req.method === 'GET') {
        const pages = await pageControlCollection.find().toArray();
        return res.status(200).json(pages);
      }

      if (req.method === 'PUT') {
        const body = await parseRequestBody(req);
        const { enabled } = body;
        if (!id || enabled === undefined) return res.status(400).json({ message: 'ID and enabled required' });

        const result = await pageControlCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { enabled } }
        );
        if (result.matchedCount === 0) return res.status(404).json({ message: 'Page not found' });

        return res.status(200).json({ message: 'Page updated' });
      }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}
