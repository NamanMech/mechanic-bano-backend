import dbConnect from '../../config/dbConnect';
import Tutorial from '../../models/Tutorial';

export default async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      await Tutorial.findByIdAndDelete(id);
      res.status(200).json({ message: 'Tutorial deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting tutorial' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
