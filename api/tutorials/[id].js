import dbConnect from '../../utils/dbConnect.js';
import Tutorial from '../../models/Tutorial.js';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  await dbConnect();
  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      const deletedTutorial = await Tutorial.findByIdAndDelete(id);
      if (!deletedTutorial) return res.status(404).json({ message: 'Tutorial not found' });
      res.status(200).json({ message: 'Tutorial deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting tutorial' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
