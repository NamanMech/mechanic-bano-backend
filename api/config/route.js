// api/config/route.js
import dbConnect from '../../../config/dbConnect';
import Config from '../../../models/Config';

export const GET = async () => {
  try {
    await dbConnect();
    let config = await Config.findOne();

    if (!config) {
      config = new Config({ websiteName: 'Mechanic Bano', logoURL: '' });
      await config.save();
    }

    return new Response(JSON.stringify(config), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Error fetching config' }), { status: 500 });
  }
};

export const PUT = async (req) => {
  try {
    await dbConnect();
    const { websiteName, logoURL } = await req.json();

    let config = await Config.findOne();
    if (config) {
      config.websiteName = websiteName;
      config.logoURL = logoURL;
      await config.save();
    } else {
      config = new Config({ websiteName, logoURL });
      await config.save();
    }

    return new Response(JSON.stringify({ success: true, message: 'Config updated successfully', config }), { status: 200 });
  } catch (error) {
    console.error('Update Config Error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to update configuration' }), { status: 500 });
  }
};
