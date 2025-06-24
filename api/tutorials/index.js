import dbConnect from '../../utils/dbConnect.js';
import Tutorial from '../../models/Tutorial.js';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  await dbConnect();

  if (req.method === 'GET') {
    try {
      const tutorials = await Tutorial.find();
      res.status(200).json(tutorials);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching tutorials' });
    }
  } else if (req.method === 'POST') {
    try {
      const tutorial = new Tutorial(req.body);
      await tutorial.save();
      res.status(201).json(tutorial);
    } catch (error) {
      console.error('POST error:', error);
      res.status(500).json({ message: 'Error adding tutorial' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
