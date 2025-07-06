import { connectDB } from '../utils/connectDB.js';
import { ObjectId } from 'mongodb';

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
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

  if (!type) {
    return res.status(400).json({ message: 'Type is required' });
  }

  if (id && !ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  try {
    const { db } = await connectDB();

    const youtubeCollection = db.collection('youtube_videos');
    const pdfCollection = db.collection('pdfs');
    const logoCollection = db.collection('logo');
    const siteNameCollection = db.collection('site_name');
    const pageControlCollection = db.collection('page_control');

    // ------------ YOUTUBE ------------
    if (type === 'youtube') {
      if (req.method === 'GET') {
        const videos = await youtubeCollection.find().toArray();
        return res.status(200).json(videos);
      }

      if (['POST', 'PUT'].includes(req.method)) {
        let body;
        try {
          body = await parseRequestBody(req);
        } catch {
          return res.status(400).json({ message: 'Invalid JSON body' });
        }

        const { title, description, embedLink, originalLink, category } = body;
        if (!title || !description || !embedLink || !originalLink || !category) {
          return res.status(400).json({ message: 'Missing required fields' });
        }

        if (req.method === 'POST') {
          const result = await youtubeCollection.insertOne({ title, description, embedLink, originalLink, category });
          return res.status(201).json({ message: 'YouTube video added successfully', result });
        }

        if (req.method === 'PUT') {
          if (!id) return res.status(400).json({ message: 'ID is required' });

          const updateResult = await youtubeCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { title, description, embedLink, originalLink, category } }
          );

          if (updateResult.matchedCount === 0) return res.status(404).json({ message: 'Video not found' });

          return res.status(200).json({ message: 'Video updated successfully' });
        }
      }

      if (req.method === 'DELETE') {
        if (!id) return res.status(400).json({ message: 'ID is required' });

        const deleteResult = await youtubeCollection.deleteOne({ _id: new ObjectId(id) });
        if (deleteResult.deletedCount === 0) return res.status(404).json({ message: 'Video not found' });

        return res.status(200).json({ message: 'Video deleted successfully' });
      }
    }

    // ------------ PDF ------------
    if (type === 'pdf') {
      if (req.method === 'GET') {
        const pdfs = await pdfCollection.find().toArray();
        return res.status(200).json(pdfs);
      }

      if (['POST', 'PUT'].includes(req.method)) {
        let body;
        try {
          body = await parseRequestBody(req);
        } catch {
          return res.status(400).json({ message: 'Invalid JSON body' });
        }

        const { title, embedLink, originalLink, category } = body;
        if (!title || !embedLink || !originalLink || !category) {
          return res.status(400).json({ message: 'Missing required fields' });
        }

        if (req.method === 'POST') {
          const result = await pdfCollection.insertOne({ title, embedLink, originalLink, category });
          return res.status(201).json({ message: 'PDF added successfully', result });
        }

        if (req.method === 'PUT') {
          if (!id) return res.status(400).json({ message: 'ID is required' });

          const updateResult = await pdfCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { title, embedLink, originalLink, category } }
          );

          if (updateResult.matchedCount === 0) return res.status(404).json({ message: 'PDF not found' });

          return res.status(200).json({ message: 'PDF updated successfully' });
        }
      }

      if (req.method === 'DELETE') {
        if (!id) return res.status(400).json({ message: 'ID is required' });

        const deleteResult = await pdfCollection.deleteOne({ _id: new ObjectId(id) });
        if (deleteResult.deletedCount === 0) return res.status(404).json({ message: 'PDF not found' });

        return res.status(200).json({ message: 'PDF deleted successfully' });
      }
    }

    // ------------ LOGO ------------
    if (type === 'logo') {
      if (req.method === 'GET') {
        const logo = await logoCollection.findOne({});
        return res.status(200).json(logo || { url: '' });
      }

      if (req.method === 'PUT') {
        let body;
        try {
          body = await parseRequestBody(req);
        } catch {
          return res.status(400).json({ message: 'Invalid JSON body' });
        }

        const { url } = body;
        if (!url) return res.status(400).json({ message: 'Logo URL is required' });

        await logoCollection.updateOne({}, { $set: { url } }, { upsert: true });

        return res.status(200).json({ message: 'Logo updated successfully' });
      }
    }

    // ------------ SITENAME ------------
    if (type === 'sitename') {
      if (req.method === 'GET') {
        const siteName = await siteNameCollection.findOne({});
        return res.status(200).json(siteName || { name: 'Mechanic Bano' });
      }

      if (req.method === 'PUT') {
        let body;
        try {
          body = await parseRequestBody(req);
        } catch {
          return res.status(400).json({ message: 'Invalid JSON body' });
        }

        const { name } = body;
        if (!name) return res.status(400).json({ message: 'Site name is required' });

        await siteNameCollection.updateOne({}, { $set: { name } }, { upsert: true });

        return res.status(200).json({ message: 'Site name updated successfully' });
      }
    }

    // ------------ PAGE CONTROL ------------
    if (type === 'pagecontrol') {
      if (req.method === 'GET') {
        const pages = await pageControlCollection.find().toArray();
        return res.status(200).json(pages);
      }

      if (req.method === 'PUT') {
        if (!id) return res.status(400).json({ message: 'ID is required' });

        let body;
        try {
          body = await parseRequestBody(req);
        } catch {
          return res.status(400).json({ message: 'Invalid JSON body' });
        }

        const { enabled } = body;
        if (enabled === undefined) return res.status(400).json({ message: 'Enabled status is required' });

        const updateResult = await pageControlCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { enabled } }
        );

        if (updateResult.matchedCount === 0) return res.status(404).json({ message: 'Page not found' });

        return res.status(200).json({ message: 'Page status updated successfully' });
      }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
