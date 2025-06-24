import dbConnect from '../../../utils/dbConnect.js';
import Tutorial from '../../../models/Tutorial.js';

export default async function handler(req, res) {
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
      res.status(500).json({ message: 'Error adding tutorial' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
