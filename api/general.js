import { connectDB } from '../utils/connectDB.js';
import { ObjectId } from 'mongodb';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client only if environment variables are available
const supabaseAdmin = process.env.SUPABASE_PROJECT_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_PROJECT_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

// Collection names as constants to prevent typos
const COLLECTIONS = {
  YOUTUBE: 'youtube_videos',
  PDF: 'pdfs',
  LOGO: 'logo',
  SITE_NAME: 'site_name',
  PAGE_CONTROL: 'page_control'
  UPI: 'upi'
};

// Enhanced request body parser
async function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && Object.keys(req.body).length > 0) {
      return resolve(req.body);
    }
    
    let body = '';
    req.on('data', chunk => (body += chunk.toString()));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

// Set CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { type, id } = req.query;

  // Validate request parameters
  if (!type) {
    return res.status(400).json({ 
      success: false, 
      message: 'Type parameter is required' 
    });
  }
  
  if (id && !ObjectId.isValid(id)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid ID format' 
    });
  }

  try {
    const { db } = await connectDB();
    const collections = {
      youtube: db.collection(COLLECTIONS.YOUTUBE),
      pdf: db.collection(COLLECTIONS.PDF),
      logo: db.collection(COLLECTIONS.LOGO),
      siteName: db.collection(COLLECTIONS.SITE_NAME),
      pageControl: db.collection(COLLECTIONS.PAGE_CONTROL)
      upi: db.collection(COLLECTIONS.UPI)
    };

    // ========== YOUTUBE ==========
    if (type === 'youtube') {
      if (req.method === 'GET') {
        const videos = await collections.youtube.find().toArray();
        return res.status(200).json({ success: true, data: videos });
      }

      if (['POST', 'PUT'].includes(req.method)) {
        const body = await parseRequestBody(req);
        const { title, description, embedLink, originalLink, category, isPremium = false } = body;
        
        // Validate required fields
        if (!title || !description || !embedLink || !originalLink || !category) {
          return res.status(400).json({ 
            success: false, 
            message: 'Missing required fields: title, description, embedLink, originalLink, category' 
          });
        }

        if (req.method === 'POST') {
          const result = await collections.youtube.insertOne({ 
            title, description, embedLink, originalLink, category, isPremium 
          });
          return res.status(201).json({ 
            success: true, 
            message: 'YouTube video added successfully', 
            data: { insertedId: result.insertedId } 
          });
        }

        if (req.method === 'PUT') {
          if (!id) {
            return res.status(400).json({ 
              success: false, 
              message: 'ID parameter is required for update' 
            });
          }
          
          const result = await collections.youtube.updateOne(
            { _id: new ObjectId(id) },
            { $set: { title, description, embedLink, originalLink, category, isPremium } }
          );
          
          if (result.matchedCount === 0) {
            return res.status(404).json({ 
              success: false, 
              message: 'Video not found' 
            });
          }
          
          return res.status(200).json({ 
            success: true, 
            message: 'Video updated successfully' 
          });
        }
      }

      if (req.method === 'DELETE') {
        if (!id) {
          return res.status(400).json({ 
            success: false, 
            message: 'ID parameter is required for deletion' 
          });
        }
        
        const result = await collections.youtube.deleteOne({ _id: new ObjectId(id) });
        
        if (result.deletedCount === 0) {
          return res.status(404).json({ 
            success: false, 
            message: 'Video not found' 
          });
        }
        
        return res.status(200).json({ 
          success: true, 
          message: 'Video deleted successfully' 
        });
      }
    }

    // ========== PDF ==========
    if (type === 'pdf') {
      if (req.method === 'GET') {
        const pdfs = await collections.pdf.find().toArray();
        return res.status(200).json({ success: true, data: pdfs });
      }

      if (['POST', 'PUT'].includes(req.method)) {
        const body = await parseRequestBody(req);
        const { title, originalLink, category, price = 0 } = body;

        if (!title || !originalLink || !category) {
          return res.status(400).json({ 
            success: false, 
            message: 'Missing required fields: title, originalLink, category' 
          });
        }

        if (req.method === 'POST') {
          const result = await collections.pdf.insertOne({ title, originalLink, category, price });
          return res.status(201).json({ 
            success: true, 
            message: 'PDF added successfully', 
            data: { insertedId: result.insertedId } 
          });
        }

        if (req.method === 'PUT') {
          if (!id) {
            return res.status(400).json({ 
              success: false, 
              message: 'ID parameter is required for update' 
            });
          }
          
          const result = await collections.pdf.updateOne(
            { _id: new ObjectId(id) },
            { $set: { title, originalLink, category, price } }
          );
          
          if (result.matchedCount === 0) {
            return res.status(404).json({ 
              success: false, 
              message: 'PDF not found' 
            });
          }
          
          return res.status(200).json({ 
            success: true, 
            message: 'PDF updated successfully' 
          });
        }
      }

      if (req.method === 'DELETE') {
        if (!id) {
          return res.status(400).json({ 
            success: false, 
            message: 'ID parameter is required for deletion' 
          });
        }
        
        const pdfDoc = await collections.pdf.findOne({ _id: new ObjectId(id) });
        
        if (!pdfDoc) {
          return res.status(404).json({ 
            success: false, 
            message: 'PDF not found' 
          });
        }

        // Delete from Supabase if URL exists and client is available
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
              // Continue with database deletion even if Supabase deletion fails
            }
          } catch (parseError) {
            console.error('URL parsing error:', parseError);
            // Continue with database deletion even if URL parsing fails
          }
        }

        const result = await collections.pdf.deleteOne({ _id: new ObjectId(id) });
        
        if (result.deletedCount === 0) {
          return res.status(404).json({ 
            success: false, 
            message: 'Failed to delete PDF from database' 
          });
        }
        
        return res.status(200).json({ 
          success: true, 
          message: 'PDF deleted successfully' 
        });
      }
    }

    // ========== LOGO ==========
    if (type === 'logo') {
      if (req.method === 'GET') {
        const logo = await collections.logo.findOne({});
        return res.status(200).json({ 
          success: true, 
          data: logo || { url: '' } 
        });
      }

      if (req.method === 'PUT') {
        const body = await parseRequestBody(req);
        const { url } = body;
        
        if (!url) {
          return res.status(400).json({ 
            success: false, 
            message: 'URL is required' 
          });
        }
        
        await collections.logo.updateOne(
          {}, 
          { $set: { url } }, 
          { upsert: true }
        );
        
        return res.status(200).json({ 
          success: true, 
          message: 'Logo updated successfully' 
        });
      }
    }

    // ========== SITENAME ==========
    if (type === 'sitename') {
      if (req.method === 'GET') {
        const siteName = await collections.siteName.findOne({});
        return res.status(200).json({ 
          success: true, 
          data: siteName || { name: 'Mechanic Bano' } 
        });
      }

      if (req.method === 'PUT') {
        const body = await parseRequestBody(req);
        const { name } = body;
        
        if (!name) {
          return res.status(400).json({ 
            success: false, 
            message: 'Name is required' 
          });
        }
        
        await collections.siteName.updateOne(
          {}, 
          { $set: { name } }, 
          { upsert: true }
        );
        
        return res.status(200).json({ 
          success: true, 
          message: 'Site name updated successfully' 
        });
      }
    }

    // ========== PAGE CONTROL ==========
    if (type === 'pagecontrol') {
      if (req.method === 'GET') {
        const pages = await collections.pageControl.find().toArray();
        return res.status(200).json({ 
          success: true, 
          data: pages 
        });
      }

      if (req.method === 'PUT') {
        const body = await parseRequestBody(req);
        const { enabled } = body;
        
        if (!id || enabled === undefined) {
          return res.status(400).json({ 
            success: false, 
            message: 'ID and enabled status are required' 
          });
        }
        
        const result = await collections.pageControl.updateOne(
          { _id: new ObjectId(id) },
          { $set: { enabled } }
        );
        
        if (result.matchedCount === 0) {
          return res.status(404).json({ 
            success: false, 
            message: 'Page not found' 
          });
        }
        
        return res.status(200).json({ 
          success: true, 
          message: 'Page updated successfully' 
        });
      }
    }

    // If no matching type or method
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed for this resource type' 
    });
    
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
}

// ========== UPI ==========
if (type === 'upi') {
  if (req.method === 'GET') {
    const upi = await collections.upi.findOne({});
    return res.status(200).json({ 
      success: true, 
      data: upi || { upiId: '' } 
    });
  }

  if (req.method === 'PUT') {
    const body = await parseRequestBody(req);
    const { upiId } = body;
    
    if (!upiId) {
      return res.status(400).json({ 
        success: false, 
        message: 'UPI ID is required' 
      });
    }
    
    await collections.upi.updateOne(
      {}, 
      { $set: { upiId } }, 
      { upsert: true }
    );
    
    return res.status(200).json({ 
      success: true, 
      message: 'UPI ID updated successfully' 
    });
  }
}
