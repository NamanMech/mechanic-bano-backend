import { connectDB } from '../utils/connectDB.js';
import { ObjectId } from 'mongodb';
import { setCorsHeaders } from '../utils/cors.js';
import { parseJsonBody } from '../utils/jsonParser.js';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = process.env.SUPABASE_PROJECT_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_PROJECT_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return;

  try {
    const db = await connectDB();
    const pendingSubscriptions = db.collection('pending_subscriptions');

    if (req.method === 'GET') {
      const subscriptions = await pendingSubscriptions.find().toArray();
      const subscriptionsWithUrls = subscriptions.map(sub => {
        let screenshotUrl = null;
        if (sub.screenshotFileName) {
          screenshotUrl = `https://owmdhrvscnbiuvoihozb.supabase.co/storage/v1/object/public/screenshots/${sub.screenshotFileName}`;
        }
        return { ...sub, screenshotUrl };
      });
      return res.status(200).json({ success: true, data: subscriptionsWithUrls });
    }

    if (req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { email, planId, screenshotFileName, planTitle, planPrice } = body;

      if (!email || !planId || !screenshotFileName) {
        return res.status(400).json({ success: false, message: 'Email, planId, and screenshotFileName are required' });
      }

      const result = await pendingSubscriptions.insertOne({
        email,
        planId,
        screenshotFileName,
        planTitle,
        planPrice,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return res.status(201).json({
        success: true,
        message: 'Pending subscription created',
        data: { insertedId: result.insertedId }
      });
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      const body = await parseJsonBody(req);
      const { status } = body;

      if (!id || !status) {
        return res.status(400).json({ success: false, message: 'ID and status are required' });
      }

      const result = await pendingSubscriptions.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status, updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, message: 'Pending subscription not found' });
      }

      return res.status(200).json({ success: true, message: 'Pending subscription updated' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in pending-subscriptions:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
