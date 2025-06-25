
import dbConnect from '../../../utils/dbConnect';
import Config from '../../../models/Config';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const config = await Config.findOne();
      res.status(200).json(config);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching config' });
    }
  } else if (req.method === 'POST') {
    try {
      const { siteName, logoUrl } = req.body;
      let config = await Config.findOne();

      if (config) {
        config.siteName = siteName;
        config.logoUrl = logoUrl;
        await config.save();
      } else {
        config = new Config({ siteName, logoUrl });
        await config.save();
      }

      res.status(201).json(config);
    } catch (error) {
      res.status(500).json({ message: 'Error updating config' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
