// api/config/route.js

import dbConnect from '../../config/dbConnect';
import Config from '../../models/Config';

export const GET = async () => {
  await dbConnect();
  let config = await Config.findOne();

  if (!config) {
    config = new Config({ websiteName: 'Mechanic Bano', logoURL: '' });
    await config.save();
  }

  return new Response(JSON.stringify(config), { status: 200 });
};

export const PUT = async (req) => {
  try {
    await dbConnect();
    const { websiteName, logoURL } = await req.json();

    let config = await Config.findOne();
    if (!config) {
      return new Response(JSON.stringify({ message: 'Config not found' }), { status: 404 });
    }

    // Smart update
    if (websiteName !== undefined) config.websiteName = websiteName;
    if (logoURL !== undefined) config.logoURL = logoURL;

    await config.save();

    return new Response(JSON.stringify({ message: 'Config updated successfully' }), { status: 200 });
  } catch (error) {
    console.error('Backend Error:', error);
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 });
  }
};
