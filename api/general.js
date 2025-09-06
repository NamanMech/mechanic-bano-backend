import { connectDB } from '../utils/connectDB.js';
import { ObjectId } from 'mongodb';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from '../utils/cors.js';
import { parseJsonBody } from '../utils/jsonParser.js';
import busboy from 'busboy';

const supabaseAdmin = process.env.SUPABASE_PROJECT_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_PROJECT_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

const COLLECTIONS = {
  YOUTUBE: 'youtube_videos',
  PDF: 'pdfs',
  LOGO: 'logo',
  SITE_NAME: 'site_name',
  PAGE_CONTROL: 'page_control',
  UPI: 'upi',
};

// Helper function to upload file to Supabase
async function uploadFileToSupabase(buffer, fileName, mimetype, bucketName = 'qr-codes') {
  if (!supabaseAdmin) {
    throw new Error('Supabase client not configured');
  }

  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(fileName, buffer, {
      cacheControl: '3600',
      upsert: true,
      contentType: mimetype
    });

  if (error) {
    throw error;
  }

  // Get public URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(bucketName)
    .getPublicUrl(data.path);

  return publicUrl;
}

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return;

  const { type, id } = req.query;

  if (!type) {
    return res.status(400).json({
      success: false,
      message: 'Type parameter is required',
    });
  }

  if (id && !ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    });
  }

  try {
    const db = await connectDB();

    const collections = {
      youtube: db.collection(COLLECTIONS.YOUTUBE),
      pdf: db.collection(COLLECTIONS.PDF),
      logo: db.collection(COLLECTIONS.LOGO),
      siteName: db.collection(COLLECTIONS.SITE_NAME),
      pageControl: db.collection(COLLECTIONS.PAGE_CONTROL),
      upi: db.collection(COLLECTIONS.UPI),
    };

    // UPI ROUTES with QR code upload
    if (type === 'upi') {
      if (req.method === 'GET') {
        const upi = await collections.upi.findOne({});
        return res.status(200).json({ success: true, data: upi || { upiId: '', qrCode: '' } });
      }

      if (req.method === 'PUT') {
        // Check if request contains file upload
        if (req.headers['content-type']?.includes('multipart/form-data')) {
          return new Promise((resolve) => {
            const bb = busboy({ headers: req.headers });
            let upiId = '';
            let qrCode = '';
            let fileBuffer = null;
            let fileName = '';
            let mimetype = '';

            bb.on('field', (name, value) => {
              if (name === 'upiId') upiId = value;
              if (name === 'qrCode') qrCode = value;
            });

            bb.on('file', (name, file, info) => {
              if (name === 'qrCodeFile') {
                fileName = `upi_qr_${Date.now()}_${info.filename}`;
                mimetype = info.mimeType;
                const chunks = [];
                
                file.on('data', (data) => {
                  chunks.push(data);
                });

                file.on('end', () => {
                  fileBuffer = Buffer.concat(chunks);
                });
              }
            });

            bb.on('close', async () => {
              try {
                if (fileBuffer) {
                  qrCode = await uploadFileToSupabase(fileBuffer, fileName, mimetype);
                }

                if (!upiId) {
                  res.status(400).json({ success: false, message: 'UPI ID is required' });
                  return resolve();
                }

                await collections.upi.updateOne({}, { $set: { upiId, qrCode } }, { upsert: true });
                res.status(200).json({ success: true, message: 'UPI data updated successfully' });
                resolve();
              } catch (error) {
                console.error('Error processing request:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
                resolve();
              }
            });

            req.pipe(bb);
          });
        } else {
          // Handle JSON request
          const body = await parseJsonBody(req);
          const { upiId, qrCode } = body;

          if (!upiId) {
            return res.status(400).json({ success: false, message: 'UPI ID is required' });
          }

          await collections.upi.updateOne({}, { $set: { upiId, qrCode } }, { upsert: true });
          return res.status(200).json({ success: true, message: 'UPI data updated successfully' });
        }
      }
    }

    // YOUTUBE ROUTES
    else if (type === 'youtube') {
      if (req.method === 'GET') {
        const videos = await collections.youtube.find().toArray();
        return res.status(200).json({ success: true, data: videos });
      }
      if (['POST', 'PUT'].includes(req.method)) {
        const body = await parseJsonBody(req);
        const { title, description, embedLink, originalLink, category, isPremium = false } = body;

        if (!title || !description || !embedLink || !originalLink || !category) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields: title, description, embedLink, originalLink, category',
          });
        }

        if (req.method === 'POST') {
          const result = await collections.youtube.insertOne({
            title,
            description,
            embedLink,
            originalLink,
            category,
            isPremium,
          });

          return res.status(201).json({
            success: true,
            message: 'YouTube video added successfully',
            data: { insertedId: result.insertedId },
          });
        }

        if (req.method === 'PUT') {
          if (!id) {
            return res.status(400).json({
              success: false,
              message: 'ID parameter is required for update',
            });
          }

          const result = await collections.youtube.updateOne(
            { _id: new ObjectId(id) },
            { $set: { title, description, embedLink, originalLink, category, isPremium } }
          );

          if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'Video not found' });
          }

          return res.status(200).json({ success: true, message: 'Video updated successfully' });
        }
      }
      if (req.method === 'DELETE') {
        if (!id) {
          return res.status(400).json({
            success: false,
            message: 'ID parameter is required for deletion',
          });
        }

        const result = await collections.youtube.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
          return res.status(404).json({ success: false, message: 'Video not found' });
        }

        return res.status(200).json({ success: true, message: 'Video deleted successfully' });
      }
    }

    // PDF ROUTES
    else if (type === 'pdf') {
      if (req.method === 'GET') {
        const pdfs = await collections.pdf.find().toArray();
        return res.status(200).json({ success: true, data: pdfs });
      }

      if (['POST', 'PUT'].includes(req.method)) {
        const body = await parseJsonBody(req);
        const { title, originalLink, category, price = 0 } = body;

        if (!title || !originalLink || !category) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields: title, originalLink, category',
          });
        }

        if (req.method === 'POST') {
          const result = await collections.pdf.insertOne({ title, originalLink, category, price });
          return res.status(201).json({
            success: true,
            message: 'PDF added successfully',
            data: { insertedId: result.insertedId },
          });
        }

        if (req.method === 'PUT') {
          if (!id) {
            return res.status(400).json({
              success: false,
              message: 'ID parameter is required for update',
            });
          }

          const result = await collections.pdf.updateOne(
            { _id: new ObjectId(id) },
            { $set: { title, originalLink, category, price } }
          );

          if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'PDF not found' });
          }

          return res.status(200).json({
            success: true,
            message: 'PDF updated successfully',
          });
        }
      }

      if (req.method === 'DELETE') {
        if (!id) {
          return res.status(400).json({
            success: false,
            message: 'ID parameter is required for deletion',
          });
        }

        const pdfDoc = await collections.pdf.findOne({ _id: new ObjectId(id) });
        if (!pdfDoc) {
          return res.status(404).json({ success: false, message: 'PDF not found' });
        }

        if (supabaseAdmin && pdfDoc.originalLink) {
          try {
            const urlObj = new URL(pdfDoc.originalLink);
            const fullPath = urlObj.pathname.replace('/storage/v1/object/public/', '');
            const decodedPath = decodeURIComponent(fullPath);
            const bucketName = decodedPath.split('/')[0];
            const filePath = decodedPath.substring(bucketName.length + 1);

            const { error } = await supabaseAdmin.storage.from(bucketName).remove([filePath]);
            if (error) {
              console.error('Supabase deletion error:', error);
            }
          } catch (parseError) {
            console.error('URL parsing error:', parseError);
          }
        }

        const result = await collections.pdf.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
          return res.status(404).json({
            success: false,
            message: 'Failed to delete PDF from database',
          });
        }

        return res.status(200).json({ success: true, message: 'PDF deleted successfully' });
      }
    }

    // LOGO ROUTES
    else if (type === 'logo') {
      if (req.method === 'GET') {
        const logo = await collections.logo.findOne({});
        return res.status(200).json({ success: true, data: logo || { url: '' } });
      }

      if (req.method === 'PUT') {
        const body = await parseJsonBody(req);
        const { url } = body;

        if (!url) {
          return res.status(400).json({ success: false, message: 'URL is required' });
        }

        await collections.logo.updateOne({}, { $set: { url } }, { upsert: true });

        return res.status(200).json({ success: true, message: 'Logo updated successfully' });
      }
    }

    // SITENAME ROUTES
    else if (type === 'sitename') {
      if (req.method === 'GET') {
        const siteName = await collections.siteName.findOne({});
        return res.status(200).json({ success: true, data: siteName || { name: 'Mechanic Bano' } });
      }

      if (req.method === 'PUT') {
        const body = await parseJsonBody(req);
        const { name } = body;

        if (!name) {
          return res.status(400).json({ success: false, message: 'Name is required' });
        }

        await collections.siteName.updateOne({}, { $set: { name } }, { upsert: true });

        return res.status(200).json({ success: true, message: 'Site name updated successfully' });
      }
    }

    // PAGE CONTROL ROUTES
    else if (type === 'pagecontrol') {
      if (req.method === 'GET') {
        const pages = await collections.pageControl.find().toArray();
        return res.status(200).json({ success: true, data: pages });
      }

      if (req.method === 'PUT') {
        const body = await parseJsonBody(req);
        const { enabled } = body;

        if (!id || enabled === undefined) {
          return res.status(400).json({
            success: false,
            message: 'ID and enabled status are required',
          });
        }

        const result = await collections.pageControl.updateOne({ _id: new ObjectId(id) }, { $set: { enabled } });

        if (result.matchedCount === 0) {
          return res.status(404).json({ success: false, message: 'Page not found' });
        }

        return res.status(200).json({ success: true, message: 'Page updated successfully' });
      }
    }

    else {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed for this resource type'
      });
    }

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
