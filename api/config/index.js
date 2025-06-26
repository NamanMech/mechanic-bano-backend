import dbConnect from '../../config/dbConnect';
import Config from '../../models/Config';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      let config = await Config.findOne();
      if (!config) {
        config = new Config({ websiteName: 'Mechanic Bano', logoURL: '' });
        await config.save();
      }
      res.status(200).json(config);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching config' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { websiteName, logoURL } = req.body;
      let config = await Config.findOne();

      if (config) {
        config.websiteName = websiteName;
        config.logoURL = logoURL;
        await config.save();
      } else {
        config = new Config({ websiteName, logoURL });
        await config.save();
      }

      res.status(200).json({ message: 'Config updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error updating config' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
