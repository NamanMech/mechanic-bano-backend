import { connectDB } from '../utils/connectDB.js';
import { ObjectId } from 'mongodb';
import { setCorsHeaders } from '../utils/cors.js';
import { parseJsonBody } from '../utils/jsonParser.js';

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return;

  try {
    const db = await connectDB();
    const plansCollection = db.collection('subscription_plans');

    switch (req.method) {
      case 'GET':
        const plans = await plansCollection.find().toArray();
        return res.status(200).json({ success: true, data: plans, message: 'Plans fetched successfully' });

      case 'POST':
        {
          const body = await parseJsonBody(req);
          const { title, price, days, discount = 0 } = body;

          if (!title || !price || !days) {
            return res.status(400).json({ success: false, message: 'Missing required fields: title, price, days' });
          }
          if (isNaN(price) || isNaN(days) || isNaN(discount)) {
            return res.status(400).json({ success: false, message: 'Price, days, and discount must be numbers' });
          }

          const result = await plansCollection.insertOne({
            title,
            price: parseFloat(price),
            days: parseInt(days),
            discount: parseFloat(discount)
          });

          return res.status(201).json({
            success: true,
            message: 'Plan created successfully',
            data: { _id: result.insertedId, title, price, days, discount }
          });
        }

      case 'PUT':
        {
          const { id } = req.query;
          if (!id || !ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Valid ID is required' });
          }

          const body = await parseJsonBody(req);
          const updateData = {};

          if (body.title) updateData.title = body.title;
          if (body.price) {
            if (isNaN(body.price)) {
              return res.status(400).json({ success: false, message: 'Price must be a number' });
            }
            updateData.price = parseFloat(body.price);
          }
          if (body.days) {
            if (isNaN(body.days)) {
              return res.status(400).json({ success: false, message: 'Days must be a number' });
            }
            updateData.days = parseInt(body.days);
          }
          if (body.discount !== undefined) {
            if (isNaN(body.discount)) {
              return res.status(400).json({ success: false, message: 'Discount must be a number' });
            }
            updateData.discount = parseFloat(body.discount);
          }

          if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update' });
          }

          const updateResult = await plansCollection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });

          if (updateResult.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
          }

          const updatedPlan = await plansCollection.findOne({ _id: new ObjectId(id) });

          return res.status(200).json({ success: true, message: 'Plan updated successfully', data: updatedPlan });
        }

      case 'DELETE':
        {
          const { id } = req.query;
          if (!id || !ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Valid ID is required' });
          }

          const deleteResult = await plansCollection.deleteOne({ _id: new ObjectId(id) });

          if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
          }

          return res.status(200).json({ success: true, message: 'Plan deleted successfully', data: { _id: id } });
        }

      default:
        return res.status(405).json({ success: false, message: 'Method not allowed for plans' });
    }
  } catch (error) {
    console.error('Error in subscription-plans:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
