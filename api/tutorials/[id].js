import dbConnect from '../../../utils/dbConnect';
import Tutorial from '../../../models/Tutorial';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      const deletedTutorial = await Tutorial.findByIdAndDelete(id);
      if (!deletedTutorial) {
        return res.status(404).json({ message: 'Tutorial not found' });
      }
      res.status(200).json({ message: 'Tutorial deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting tutorial' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
