import { connectDB } from '../utils/connectDB.js';
import { ObjectId } from 'mongodb';

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

// Helper function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id, type, email } = req.query;

  try {
    const { db } = await connectDB();
    const plansCollection = db.collection('subscription_plans');
    const usersCollection = db.collection('users');

    // ===== Subscription Plans Management =====
    if (!type) {
      switch (req.method) {
        case 'GET':
          // GET All Plans
          const plans = await plansCollection.find().toArray();
          return res.status(200).json({
            success: true,
            data: plans,
            message: 'Plans fetched successfully'
          });
        
        case 'POST':
          // CREATE New Plan
          let body;
          try {
            body = await parseRequestBody(req);
          } catch {
            return res.status(400).json({ 
              success: false,
              message: 'Invalid JSON body' 
            });
          }
          
          const { title, price, days, discount } = body;
          if (!title || !price || !days) {
            return res.status(400).json({ 
              success: false,
              message: 'Missing required fields: title, price, days' 
            });
          }
          
          // Validate numeric values
          if (isNaN(price) || isNaN(days) || (discount && isNaN(discount))) {
            return res.status(400).json({ 
              success: false,
              message: 'Price, days, and discount must be numbers' 
            });
          }
          
          const result = await plansCollection.insertOne({ 
            title, 
            price: parseFloat(price), 
            days: parseInt(days), 
            discount: discount ? parseFloat(discount) : 0 
          });
          
          return res.status(201).json({ 
            success: true,
            message: 'Plan created successfully',
            data: { _id: result.insertedId, title, price, days, discount }
          });
        
        case 'PUT':
          // UPDATE Plan
          if (!id) return res.status(400).json({ 
            success: false,
            message: 'ID is required' 
          });
          
          if (!ObjectId.isValid(id)) {
            return res.status(400).json({ 
              success: false,
              message: 'Invalid ID format' 
            });
          }
          
          try {
            body = await parseRequestBody(req);
          } catch {
            return res.status(400).json({ 
              success: false,
              message: 'Invalid JSON body' 
            });
          }
          
          const updateData = {};
          if (body.title) updateData.title = body.title;
          if (body.price) {
            if (isNaN(body.price)) return res.status(400).json({ 
              success: false,
              message: 'Price must be a number' 
            });
            updateData.price = parseFloat(body.price);
          }
          if (body.days) {
            if (isNaN(body.days)) return res.status(400).json({ 
              success: false,
              message: 'Days must be a number' 
            });
            updateData.days = parseInt(body.days);
          }
          if (body.discount !== undefined) {
            if (isNaN(body.discount)) return res.status(400).json({ 
              success: false,
              message: 'Discount must be a number' 
            });
            updateData.discount = parseFloat(body.discount);
          }
          
          if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ 
              success: false,
              message: 'No valid fields to update' 
            });
          }
          
          const updateResult = await plansCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
          );
          
          if (updateResult.matchedCount === 0) {
            return res.status(404).json({ 
              success: false,
              message: 'Plan not found' 
            });
          }
          
          // Get the updated plan
          const updatedPlan = await plansCollection.findOne({ _id: new ObjectId(id) });
          
          return res.status(200).json({ 
            success: true,
            message: 'Plan updated successfully',
            data: updatedPlan
          });
        
        case 'DELETE':
          // DELETE Plan
          if (!id) return res.status(400).json({ 
            success: false,
            message: 'ID is required' 
          });
          
          if (!ObjectId.isValid(id)) {
            return res.status(400).json({ 
              success: false,
              message: 'Invalid ID format' 
            });
          }
          
          const deleteResult = await plansCollection.deleteOne({ _id: new ObjectId(id) });
          if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ 
              success: false,
              message: 'Plan not found' 
            });
          }
          
          return res.status(200).json({ 
            success: true,
            message: 'Plan deleted successfully',
            data: { _id: id }
          });
        
        default:
          return res.status(405).json({ 
            success: false,
            message: 'Method not allowed for plans' 
          });
      }
    }

    // ===== User Subscription Operations =====
    switch (type) {
      case 'check':
        if (req.method !== 'GET') {
          return res.status(405).json({ 
            success: false,
            message: 'Method not allowed' 
          });
        }
        
        if (!email || !isValidEmail(email)) {
          return res.status(400).json({ 
            success: false,
            message: 'Valid email is required' 
          });
        }
        
        const user = await usersCollection.findOne({ email });
        if (!user) return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
        
        const currentDate = new Date();
        const isSubscribed = user.isSubscribed && 
                            user.subscriptionEnd && 
                            new Date(user.subscriptionEnd) > currentDate;
        
        return res.status(200).json({ 
          success: true,
          data: {
            isSubscribed,
            subscriptionEnd: user.subscriptionEnd || null,
            planTitle: user.planTitle || null
          },
          message: 'Subscription status checked successfully'
        });
      
      case 'expire':
        if (req.method !== 'PUT') {
          return res.status(405).json({ 
            success: false,
            message: 'Method not allowed' 
          });
        }
        
        if (!email || !isValidEmail(email)) {
          return res.status(400).json({ 
            success: false,
            message: 'Valid email is required' 
          });
        }
        
        const expireResult = await usersCollection.updateOne(
          { email },
          {
            $set: {
              isSubscribed: false,
              subscriptionEnd: null,
              subscriptionStart: null,
              planId: null,
              planTitle: null,
              subscribedPlan: null,
            }
          }
        );
        
        if (expireResult.matchedCount === 0) {
          return res.status(404).json({ 
            success: false,
            message: 'User not found' 
          });
        }
        
        return res.status(200).json({ 
          success: true,
          message: 'Subscription expired successfully' 
        });
      
      case 'subscribe':
        if (req.method !== 'POST') {
          return res.status(405).json({ 
            success: false,
            message: 'Method not allowed' 
          });
        }
        
        let body;
        try {
          body = await parseRequestBody(req);
        } catch {
          return res.status(400).json({ 
            success: false,
            message: 'Invalid JSON body' 
          });
        }
        
        const { email: subEmail, planId } = body;
        if (!subEmail || !isValidEmail(subEmail) || !planId) {
          return res.status(400).json({ 
            success: false,
            message: 'Valid email and planId are required' 
          });
        }
        
        if (!ObjectId.isValid(planId)) {
          return res.status(400).json({ 
            success: false,
            message: 'Invalid Plan ID format' 
          });
        }
        
        const plan = await plansCollection.findOne({ _id: new ObjectId(planId) });
        if (!plan) {
          return res.status(404).json({ 
            success: false,
            message: 'Plan not found' 
          });
        }
        
        const startDate = new Date();
        const days = parseInt(plan.days) || 30;
        const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
        
        await usersCollection.updateOne(
          { email: subEmail },
          {
            $set: {
              isSubscribed: true,
              subscriptionStart: startDate,
              subscriptionEnd: endDate,
              planId: planId,
              planTitle: plan.title,
              subscribedPlan: {
                id: plan._id,
                title: plan.title,
                price: plan.price,
                days: plan.days,
                discount: plan.discount || 0,
              },
            },
          },
          { upsert: true }
        );
        
        return res.status(200).json({
          success: true,
          data: {
            subscriptionEnd: endDate.toISOString(),
            plan: plan.title,
          },
          message: 'Subscription activated successfully'
        });
      
      case 'userinfo':
        if (req.method !== 'GET') {
          return res.status(405).json({ 
            success: false,
            message: 'Method not allowed' 
          });
        }
        
        if (!email || !isValidEmail(email)) {
          return res.status(400).json({ 
            success: false,
            message: 'Valid email is required' 
          });
        }
        
        const userInfo = await usersCollection.findOne({ email });
        if (!userInfo) return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });

        const now = new Date();
        if (userInfo.subscriptionEnd && new Date(userInfo.subscriptionEnd) <= now) {
          // Auto-expire subscription
          await usersCollection.updateOne(
            { email },
            {
              $set: {
                isSubscribed: false,
                subscriptionStart: null,
                subscriptionEnd: null,
                planId: null,
                planTitle: null,
                subscribedPlan: null,
              },
            }
          );
          
          return res.status(200).json({
            success: true,
            data: {
              isSubscribed: false,
              planTitle: '',
              subscriptionStart: '',
              subscriptionEnd: '',
            },
            message: 'Subscription expired'
          });
        }

        return res.status(200).json({
          success: true,
          data: {
            isSubscribed: userInfo.isSubscribed ?? false,
            planTitle: userInfo.planTitle ?? '',
            subscriptionStart: userInfo.subscriptionStart ? userInfo.subscriptionStart.toISOString() : '',
            subscriptionEnd: userInfo.subscriptionEnd ? userInfo.subscriptionEnd.toISOString() : '',
          },
          message: 'User subscription info retrieved successfully'
        });
      
      default:
        return res.status(400).json({ 
          success: false,
          message: 'Invalid type parameter' 
        });
    }
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal Server Error',
      error: error.message 
    });
  }
}
