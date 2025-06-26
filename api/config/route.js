// api/config/route.js
import dbConnect from '../../../config/dbConnect';
import Config from '../../../models/Config';

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

  return new Response(JSON.stringify({ message: 'Config updated successfully' }), { status: 200 });
};
