// api/config/update-site-name/route.js
import dbConnect from '../../../config/dbConnect';
import Config from '../../../models/Config';

export const PUT = async (req) => {
  try {
    await dbConnect();
    const { websiteName } = await req.json();

    let config = await Config.findOne();
    if (config) {
      config.websiteName = websiteName;
      await config.save();
    } else {
      config = new Config({ websiteName, logoURL: '' });
      await config.save();
    }

    return new Response(JSON.stringify({ message: 'Site name updated successfully' }), { status: 200 });
  } catch (error) {
    console.error('Update Site Name Error:', error);
    return new Response(JSON.stringify({ message: 'Failed to update site name' }), { status: 500 });
  }
};
