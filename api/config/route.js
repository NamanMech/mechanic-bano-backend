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
  const body = await req.json();

  let config = await Config.findOne();
  if (!config) {
    config = new Config({ websiteName: 'Mechanic Bano', logoURL: '' });
  }

  // Smart update: only update fields that are sent
  if (body.websiteName !== undefined) {
    config.websiteName = body.websiteName;
  }

  if (body.logoURL !== undefined) {
    config.logoURL = body.logoURL;
  }

  await config.save();

  return new Response(JSON.stringify({ message: 'Config updated successfully' }), { status: 200 });
};
