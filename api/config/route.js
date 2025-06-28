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
