// api/general.js
import { connectDB } from '../utils/connectDB.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const client = await connectDB();
  const db = client.db('mechanic_bano');

  const youtubeCollection = db.collection('youtube_videos');
  const pdfCollection = db.collection('pdfs');
  const logoCollection = db.collection('logo');
  const siteNameCollection = db.collection('site_name');
  const pageControlCollection = db.collection('page_control');

  const { type, id } = req.query;

  if (!type) return res.status(400).json({ message: 'Type is required' });

  // ----------- YOUTUBE -----------

  if (type === 'youtube') {
    if (req.method === 'GET') {
      const videos = await youtubeCollection.find().toArray();
      return res.status(200).json(videos);
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', async () => {
        const { title, description, embedLink, originalLink, category } = JSON.parse(body);
        if (!title || !description || !embedLink || !originalLink || !category) {
          return res.status(400).json({ message: 'Missing required fields' });
        }
        const result = await youtubeCollection.insertOne({ title, description, embedLink, originalLink, category });
        return res.status(201).json({ message: 'YouTube video added successfully', result });
      });
      return;
    }

    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ message: 'ID is required' });
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', async () => {
        const { title, description, embedLink, originalLink, category } = JSON.parse(body);
        if (!title || !description || !embedLink || !originalLink || !category) {
          return res.status(400).json({ message: 'Missing required fields' });
        }
        await youtubeCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { title, description, embedLink, originalLink, category } }
        );
        return res.status(200).json({ message: 'Video updated successfully' });
      });
      return;
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ message: 'ID is required' });
      await youtubeCollection.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ message: 'Video deleted successfully' });
    }
  }

  // ----------- PDF -----------

  if (type === 'pdf') {
    if (req.method === 'GET') {
      const pdfs = await pdfCollection.find().toArray();
      return res.status(200).json(pdfs);
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', async () => {
        const { title, embedLink, originalLink, category } = JSON.parse(body);
        if (!title || !embedLink || !originalLink || !category) {
          return res.status(400).json({ message: 'Missing required fields' });
        }
        const result = await pdfCollection.insertOne({ title, embedLink, originalLink, category });
        return res.status(201).json({ message: 'PDF added successfully', result });
      });
      return;
    }

    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ message: 'ID is required' });
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', async () => {
        const { title, embedLink, originalLink, category } = JSON.parse(body);
        if (!title || !embedLink || !originalLink || !category) {
          return res.status(400).json({ message: 'Missing required fields' });
        }
        await pdfCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { title, embedLink, originalLink, category } }
        );
        return res.status(200).json({ message: 'PDF updated successfully' });
      });
      return;
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ message: 'ID is required' });
      await pdfCollection.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ message: 'PDF deleted successfully' });
    }
  }

  // ----------- LOGO -----------

  if (type === 'logo') {
    if (req.method === 'GET') {
      const logo = await logoCollection.findOne({});
      return res.status(200).json(logo || { url: '' });
    }

    if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', async () => {
        const { url } = JSON.parse(body);
        if (!url) return res.status(400).json({ message: 'Logo URL is required' });
        await logoCollection.deleteMany({});
        await logoCollection.insertOne({ url });
        return res.status(200).json({ message: 'Logo updated successfully' });
      });
      return;
    }
  }

  // ----------- SITENAME -----------

  if (type === 'sitename') {
    if (req.method === 'GET') {
      const siteName = await siteNameCollection.findOne({});
      return res.status(200).json(siteName || { name: 'Mechanic Bano' });
    }

    if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', async () => {
        const { name } = JSON.parse(body);
        if (!name) return res.status(400).json({ message: 'Site name is required' });
        await siteNameCollection.deleteMany({});
        await siteNameCollection.insertOne({ name });
        return res.status(200).json({ message: 'Site name updated successfully' });
      });
      return;
    }
  }

  // ----------- PAGE CONTROL -----------

  if (type === 'pagecontrol') {
    if (req.method === 'GET') {
      const pages = await pageControlCollection.find().toArray();
      return res.status(200).json(pages);
    }

    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ message: 'ID is required' });
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', async () => {
        const { enabled } = JSON.parse(body);
        if (enabled === undefined) return res.status(400).json({ message: 'Enabled status is required' });
        const result = await pageControlCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { enabled } }
        );
        if (result.matchedCount === 0) return res.status(404).json({ message: 'Page not found' });
        return res.status(200).json({ message: 'Page status updated successfully' });
      });
      return;
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
