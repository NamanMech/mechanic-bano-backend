import dbConnect from '../../config/dbConnect';
import Tutorial from '../../models/Tutorial';

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
      const { title, description, youtubeLink } = req.body;
      const newTutorial = new Tutorial({ title, description, youtubeLink });
      await newTutorial.save();
      res.status(201).json({ message: 'Tutorial added successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error adding tutorial' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
